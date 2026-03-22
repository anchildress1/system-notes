#!/bin/bash
set -e

# Configuration
API_SERVICE="system-notes-api"
API_SOURCE="apps/api"
API_PORT="8080"

UI_SERVICE="system-notes-ui"
UI_SOURCE="apps/web"
UI_PORT="3000"

REGION="${GCP_REGION:-us-east1}"

SEPARATOR="=================================================="

# Check dependencies
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed." >&2
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [[ "$PROJECT_ID" == "(unset)" ]] || [[ -z "$PROJECT_ID" ]]; then
    echo "Error: No Google Cloud Project ID set." >&2
    exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

echo "$SEPARATOR"
echo "DEPLOYMENT CONFIGURATIONS"
echo "$SEPARATOR"
echo "Project: $PROJECT_ID ($PROJECT_NUMBER)"
echo "Region:  $REGION"
echo "API:     $API_SERVICE ($API_SOURCE)"
echo "UI:      $UI_SERVICE ($UI_SOURCE)"
echo "$SEPARATOR"

# Enable required services
echo "Enabling required Google Cloud APIs..."
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com --project "$PROJECT_ID" --quiet

# Define Service Accounts
API_SA="system-notes-api@$PROJECT_ID.iam.gserviceaccount.com"
UI_SA="system-notes-ui@$PROJECT_ID.iam.gserviceaccount.com"

# Env loading (PUBLIC keys are safe for client-side)
# For sensitive secrets, use Secret Manager instead of env vars
if [[ -f ".env" ]]; then
    set -a
    # shellcheck disable=SC1090
    . ".env"
    set +a
fi

require_env() {
    local name=$1
    if [[ -z "${!name}" ]]; then
        echo "Error: Required env var '$name' is missing or empty." >&2
        exit 1
    fi
    return 0
}

require_env "NEXT_PUBLIC_ALGOLIA_APPLICATION_ID"
require_env "NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY"
require_env "NEXT_PUBLIC_ALGOLIA_AGENT_ID"
require_env "NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID"
require_env "NEXT_PUBLIC_BASE_URL"

# Set defaults for optional vars that are required by build
NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME="${NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME:-system-notes}"
NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME="${NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME:-${NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME}_query_suggestions}"

# ==========================================
# Build Helpers
# ==========================================

# gcloud builds submit exits 1 when it can't stream logs from the default
# Cloud Build bucket (SA lacks storage.objectViewer). Submit async and poll
# the build status instead.
#
# The function always passes --project to both submit and describe so it is
# self-contained regardless of how callers invoke it.
submit_build() {
    local build_id
    build_id=$(gcloud beta builds submit --project "$PROJECT_ID" "$@" --async --format='value(id)')
    echo "Build $build_id submitted"

    local status
    local timeout=${BUILD_TIMEOUT:-1200}
    local interval=15
    local elapsed=0

    while (( elapsed < timeout )); do
        status=$(gcloud builds describe "$build_id" --project "$PROJECT_ID" --format='value(status)')
        case "$status" in
            SUCCESS)
                echo "Build $build_id succeeded"
                return 0
                ;;
            FAILURE|CANCELLED|TIMEOUT|INTERNAL_ERROR)
                echo "Build $build_id failed: $status" >&2
                echo "Logs: https://console.cloud.google.com/cloud-build/builds/$build_id?project=$PROJECT_ID" >&2
                return 1
                ;;
            *)
                echo "Build $build_id: $status — waiting... (${elapsed}s/${timeout}s)"
                sleep "$interval"
                (( elapsed += interval ))
                ;;
        esac
    done

    echo "Build $build_id timed out after ${timeout}s (status: $status)" >&2
    echo "Logs: https://console.cloud.google.com/cloud-build/builds/$build_id?project=$PROJECT_ID" >&2
    return 1
}

# ==========================================
# Deployment Function
# ==========================================
deploy_service() {
    local service_name=$1
    local source_dir=$2
    local port=$3
    local service_account=$4
    local env_vars=$5
    local dockerfile_path=$6

    echo ""
    echo "--- Deploying $service_name ---"

    # 1. Ensure Artifact Registry Repo exists
    if ! gcloud artifacts repositories describe "$service_name" --location="$REGION" --project "$PROJECT_ID" --quiet &>/dev/null; then
        echo "Creating Artifact Registry repository: $service_name..."
        gcloud artifacts repositories create "$service_name" \
            --repository-format=docker \
            --location="$REGION" \
            --project "$PROJECT_ID" \
            --description="Docker repository for $service_name"
    fi

    # 2. Build and Push Image
    local image_uri="$REGION-docker.pkg.dev/$PROJECT_ID/$service_name/$service_name:latest"
    echo "Building: $image_uri"

    if [[ -n "$dockerfile_path" ]]; then
        # Use cloudbuild.yaml for web app with build args
        # Prefix sensitive vars with _ to prevent Cloud Build from logging them
        submit_build "$source_dir" \
            --config "apps/web/cloudbuild.yaml" \
            --substitutions "_IMAGE_URI=$image_uri,_NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID,_NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,_NEXT_PUBLIC_ALGOLIA_AGENT_ID=$NEXT_PUBLIC_ALGOLIA_AGENT_ID,_NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID=$NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID,_NEXT_PUBLIC_API_URL=$API_URL,_NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL,_NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME,_NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME"
    else
        # Standard build from root of service directory
        submit_build --tag "$image_uri" "$source_dir"
    fi

    # 3. Deploy to Cloud Run
    echo "Deploying to Cloud Run..."

    # Use array to prevent word splitting issues
    local -a deploy_args=(
        "deploy" "$service_name"
        "--image" "$image_uri"
        "--region" "$REGION"
        "--project" "$PROJECT_ID"
        "--allow-unauthenticated"
        "--port" "$port"
    )

    if [[ -n "$service_account" ]]; then
        deploy_args+=("--service-account" "$service_account")
    fi

    if [[ -n "$env_vars" ]]; then
        deploy_args+=("--set-env-vars" "$env_vars")
    fi

    # Enable startup CPU boost for faster cold starts (UI service)
    if [[ "$service_name" = "$UI_SERVICE" ]]; then
        deploy_args+=("--cpu-boost")
    fi

    gcloud run "${deploy_args[@]}"
    return 0
}

# ==========================================
# Execution
# ==========================================

# 1. Deploy API (No Env Vars needed, relies on defaults)
deploy_service "$API_SERVICE" "$API_SOURCE" "$API_PORT" "$API_SA"

# 2. Get API URL
API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')
if [[ -z "$API_URL" ]]; then
    echo "Error: Failed to resolve API_URL from Cloud Run service '$API_SERVICE'." >&2
    exit 1
fi
echo "API URL: $API_URL"

deploy_service "$UI_SERVICE" "." "$UI_PORT" "$UI_SA" "" "apps/web/Dockerfile"

echo ""
echo "$SEPARATOR"
echo "DEPLOYMENT COMPLETE"
echo "$SEPARATOR"
