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

# Algolia Config
NEXT_PUBLIC_ALGOLIA_APPLICATION_ID="${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}"
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY="${NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY}"
NEXT_PUBLIC_ALGOLIA_AGENT_ID="${NEXT_PUBLIC_ALGOLIA_AGENT_ID}"

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
    REPO_NAME="$SERVICE_NAME"

    if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
        echo "Creating Artifact Registry repository: $REPO_NAME..."
        gcloud artifacts repositories create "$REPO_NAME" \
            --repository-format=docker \
            --location="$REGION" \
            --project "$PROJECT_ID" \
            --description="Docker repository for $SERVICE_NAME"
    fi

    # 2. Build and Push Image
    IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"
    echo "Building and pushing image: $IMAGE_URI"

    if [ -n "$DOCKERFILE_PATH" ]; then
        # Use provided cloudbuild configuration if Dockerfile path implies special handling (via config file)
        # We assume if DOCKERFILE_PATH is passed, we are using the web config pattern or similar
        # For simplicity in this specific project context:
        gcloud builds submit "$SOURCE_DIR" \
            --config "apps/web/cloudbuild.yaml" \
            --project "$PROJECT_ID" \
            --substitutions _IMAGE_URI="$IMAGE_URI",_NEXT_PUBLIC_ALGOLIA_APPLICATION_ID="$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID",_NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY="$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY",_NEXT_PUBLIC_ALGOLIA_AGENT_ID="$NEXT_PUBLIC_ALGOLIA_AGENT_ID",_NEXT_PUBLIC_API_URL="$API_URL"
    else
        # Standard build from root of service directory
        gcloud builds submit --tag "$IMAGE_URI" "$SOURCE_DIR" --project "$PROJECT_ID"
    fi

    # 3. Deploy to Cloud Run
    echo "Deploying to Cloud Run..."

    # Build arguments array to avoid eval/injection risks
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

# Define target regions (space separated)
REGIONS=("us-east1" "europe-north1")

# 2. Get API URL
API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')
echo "API URL: $API_URL"

deploy_service "$UI_SERVICE" "." "$UI_PORT" "$UI_SA" "" "apps/web/Dockerfile"

echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE"
echo "=================================================="
