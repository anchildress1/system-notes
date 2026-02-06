#!/bin/bash
set -e

# Configuration
API_SERVICE="system-notes-api"
API_SOURCE="apps/api"
API_PORT="8080"

UI_SERVICE="system-notes-ui"
UI_SOURCE="apps/web"
UI_PORT="3000"

REGION="us-east1"

# Check dependencies
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT_ID" == "(unset)" ] || [ -z "$PROJECT_ID" ]; then
    echo "Error: No Google Cloud Project ID set."
    exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

echo "=================================================="
echo "DEPLOYMENT CONFIGURATIONS"
echo "=================================================="
echo "Project: $PROJECT_ID ($PROJECT_NUMBER)"
echo "Region:  $REGION"
echo "API:     $API_SERVICE ($API_SOURCE)"
echo "UI:      $UI_SERVICE ($UI_SOURCE)"
echo "=================================================="

# Enable required services
echo "Enabling required Google Cloud APIs..."
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com --project "$PROJECT_ID" --quiet

# Define Service Accounts
API_SA="system-notes-api@$PROJECT_ID.iam.gserviceaccount.com"
UI_SA="system-notes-ui@$PROJECT_ID.iam.gserviceaccount.com"

# Algolia Config - these are PUBLIC keys (safe for client-side)
# For sensitive secrets, use Secret Manager instead of env vars
NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=EXKENZ9FHJ
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=cd51e9af01f0796ac10c3fbfc5aa5b9f
NEXT_PUBLIC_ALGOLIA_AGENT_ID=11caec4a-abd5-439a-a66a-3c26562de5c1
NEXT_PUBLIC_BASE_URL=https://unstable.anchildress1.dev

# ==========================================
# Deployment Function
# ==========================================
deploy_service() {
    local SERVICE_NAME=$1
    local SOURCE_DIR=$2
    local PORT=$3
    local SERVICE_ACCOUNT=$4
    local ENV_VARS=$5
    local DOCKERFILE_PATH=$6
    local BUILD_ARGS=$7

    echo ""
    echo "--- Deploying $SERVICE_NAME ---"

    # 1. Ensure Artifact Registry Repo exists
    if ! gcloud artifacts repositories describe "$SERVICE_NAME" --location="$REGION" --project "$PROJECT_ID" --quiet &>/dev/null; then
        echo "Creating Artifact Registry repository: $SERVICE_NAME..."
        gcloud artifacts repositories create "$SERVICE_NAME" \
            --repository-format=docker \
            --location="$REGION" \
            --project "$PROJECT_ID" \
            --description="Docker repository for $SERVICE_NAME"
    fi

    # 2. Build and Push Image
    local IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME:latest"
    echo "Building: $IMAGE_URI"

    if [ -n "$DOCKERFILE_PATH" ]; then
        # Use cloudbuild.yaml for web app with build args
        # Prefix sensitive vars with _ to prevent Cloud Build from logging them
        gcloud beta builds submit "$SOURCE_DIR" \
            --config "apps/web/cloudbuild.yaml" \
            --project "$PROJECT_ID" \
            --substitutions "_IMAGE_URI=$IMAGE_URI,_NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID,_NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,_NEXT_PUBLIC_ALGOLIA_AGENT_ID=$NEXT_PUBLIC_ALGOLIA_AGENT_ID,_NEXT_PUBLIC_API_URL=$API_URL,_NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL"
    else
        # Standard build from root of service directory
        gcloud beta builds submit --tag "$IMAGE_URI" "$SOURCE_DIR" --project "$PROJECT_ID"
    fi

    # 3. Deploy to Cloud Run
    echo "Deploying to Cloud Run..."
    
    # Use array to prevent word splitting issues
    DEPLOY_ARGS=(
        "deploy" "$SERVICE_NAME"
        "--image" "$IMAGE_URI"
        "--region" "$REGION"
        "--project" "$PROJECT_ID"
        "--allow-unauthenticated"
        "--port" "$PORT"
    )

    if [ -n "$SERVICE_ACCOUNT" ]; then
        DEPLOY_ARGS+=("--service-account" "$SERVICE_ACCOUNT")
    fi

    if [ -n "$ENV_VARS" ]; then
        DEPLOY_ARGS+=("--set-env-vars" "$ENV_VARS")
    fi

    gcloud run "${DEPLOY_ARGS[@]}"
}

# ==========================================
# Execution
# ==========================================

# 1. Deploy API (No Env Vars needed, relies on defaults)
deploy_service "$API_SERVICE" "$API_SOURCE" "$API_PORT" "$API_SA"

# 2. Get API URL
API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')
echo "API URL: $API_URL"

deploy_service "$UI_SERVICE" "." "$UI_PORT" "$UI_SA" "" "apps/web/Dockerfile"

echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE"
echo "=================================================="
