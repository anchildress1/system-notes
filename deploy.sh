#!/bin/bash
set -e

# Configuration
UI_SERVICE="system-notes"
UI_SOURCE="."
UI_PORT="3000"

REGION="${GCP_REGION:-us-east1}"
ARTIFACT_CLEANUP_ENABLED="${ARTIFACT_CLEANUP_ENABLED:-true}"
ARTIFACT_CLEANUP_KEEP_COUNT="${ARTIFACT_CLEANUP_KEEP_COUNT:-5}"
ARTIFACT_CLEANUP_DELETE_OLDER_THAN="${ARTIFACT_CLEANUP_DELETE_OLDER_THAN:-7d}"

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
echo "UI:      $UI_SERVICE ($UI_SOURCE)"
echo "Cleanup: ${ARTIFACT_CLEANUP_ENABLED} (keep ${ARTIFACT_CLEANUP_KEEP_COUNT}, delete untagged > ${ARTIFACT_CLEANUP_DELETE_OLDER_THAN})"
echo "$SEPARATOR"

# Enable required services
echo "Enabling required Google Cloud APIs..."
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com --project "$PROJECT_ID" --quiet

# Define Service Account
UI_SA="system-notes-ui@$PROJECT_ID.iam.gserviceaccount.com"

# Env loading (PUBLIC keys are safe for client-side)
# For sensitive secrets, use Secret Manager instead of env vars
if [[ -f ".env" ]]; then
    set -a
    # shellcheck disable=SC1091
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
# Artifact Registry Helpers
# ==========================================

truthy() {
    case "$1" in
        true|TRUE|1|yes|YES|y|Y) return 0 ;;
        *) return 1 ;;
    esac
}

ensure_artifact_cleanup_policy() {
    local repository=$1

    if ! truthy "$ARTIFACT_CLEANUP_ENABLED"; then
        echo "Artifact Registry cleanup policy disabled."
        return 0
    fi

    if ! [[ "$ARTIFACT_CLEANUP_KEEP_COUNT" =~ ^[1-9][0-9]*$ ]]; then
        echo "Error: ARTIFACT_CLEANUP_KEEP_COUNT must be a positive integer." >&2
        exit 1
    fi

    if ! [[ "$ARTIFACT_CLEANUP_DELETE_OLDER_THAN" =~ ^[1-9][0-9]*[smhd]$ ]]; then
        echo "Error: ARTIFACT_CLEANUP_DELETE_OLDER_THAN must be a duration like 12h, 7d, or 30d." >&2
        exit 1
    fi

    local policy_file
    policy_file=$(mktemp)

    cat > "$policy_file" <<EOF
[
  {
    "name": "delete-old-untagged",
    "action": {"type": "Delete"},
    "condition": {
      "tagState": "untagged",
      "olderThan": "$ARTIFACT_CLEANUP_DELETE_OLDER_THAN"
    }
  },
  {
    "name": "keep-recent-versions",
    "action": {"type": "Keep"},
    "mostRecentVersions": {
      "keepCount": $ARTIFACT_CLEANUP_KEEP_COUNT
    }
  }
]
EOF

    echo "Applying Artifact Registry cleanup policy to $repository..."
    if ! gcloud artifacts repositories set-cleanup-policies "$repository" \
        --project "$PROJECT_ID" \
        --location "$REGION" \
        --policy "$policy_file" \
        --no-dry-run \
        --quiet; then
        rm -f "$policy_file"
        return 1
    fi

    rm -f "$policy_file"
}

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

    # 1. Ensure Artifact Registry Repo exists. Repo creation + cleanup policy
    #    only run when the repo is missing — they need admin rights the CI deploy
    #    SA doesn't have (it has writer to push). An existing repo is left as-is,
    #    so the repo is provisioned out-of-band once and deploys just push to it.
    if ! gcloud artifacts repositories describe "$service_name" --location="$REGION" --project "$PROJECT_ID" --quiet &>/dev/null; then
        echo "Creating Artifact Registry repository: $service_name..."
        gcloud artifacts repositories create "$service_name" \
            --repository-format=docker \
            --location="$REGION" \
            --project "$PROJECT_ID" \
            --description="Docker repository for $service_name"
        ensure_artifact_cleanup_policy "$service_name"
    fi

    # 2. Build and Push Image
    local image_uri="$REGION-docker.pkg.dev/$PROJECT_ID/$service_name/$service_name:latest"
    echo "Building: $image_uri"

    if [[ -n "$dockerfile_path" ]]; then
        # Use cloudbuild.yaml for web app with build args
        # Prefix sensitive vars with _ to prevent Cloud Build from logging them
        submit_build "$source_dir" \
            --config "cloudbuild.yaml" \
            --substitutions "_IMAGE_URI=$image_uri,_NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID,_NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,_NEXT_PUBLIC_ALGOLIA_AGENT_ID=$NEXT_PUBLIC_ALGOLIA_AGENT_ID,_NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID=$NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID,_NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL,_NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME,_NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME"
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

    deploy_args+=("--max-instances" "1")

    gcloud run "${deploy_args[@]}"

    # Delete all revisions not currently serving traffic
    echo "Cleaning up old revisions for $service_name..."
    local active_revision
    active_revision=$(gcloud run services describe "$service_name" \
        --region "$REGION" --project "$PROJECT_ID" \
        --format='value(status.latestReadyRevisionName)')
    # Guard: without a known active revision the grep -v below would match every
    # name and delete the live revision too. Skip cleanup rather than risk that.
    if [ -z "$active_revision" ]; then
        echo "  Skipping cleanup: could not determine the active revision."
    else
        gcloud run revisions list \
            --service "$service_name" \
            --region "$REGION" \
            --project "$PROJECT_ID" \
            --format='value(metadata.name)' \
            | grep -v "^${active_revision}$" \
            | while read -r rev; do
                echo "  Deleting $rev..."
                gcloud run revisions delete "$rev" \
                    --region "$REGION" --project "$PROJECT_ID" --quiet 2>&1 || true
            done
    fi

    return 0
}

# ==========================================
# Execution
# ==========================================

# Surface the public NEXT_PUBLIC_* config as Cloud Run runtime env vars too.
# They're already inlined into the client bundle at build time (via cloudbuild
# build args), so this is for visibility in the console and any server-side
# runtime reads. All NEXT_PUBLIC_* values are public/safe to embed.
UI_ENV_VARS="NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}"
UI_ENV_VARS+=",NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=${NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY}"
UI_ENV_VARS+=",NEXT_PUBLIC_ALGOLIA_AGENT_ID=${NEXT_PUBLIC_ALGOLIA_AGENT_ID}"
UI_ENV_VARS+=",NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID=${NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID}"
UI_ENV_VARS+=",NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}"
UI_ENV_VARS+=",NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=${NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME}"
UI_ENV_VARS+=",NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME=${NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME}"

deploy_service "$UI_SERVICE" "." "$UI_PORT" "$UI_SA" "$UI_ENV_VARS" "Dockerfile"

echo ""
echo "$SEPARATOR"
echo "DEPLOYMENT COMPLETE"
echo "$SEPARATOR"
