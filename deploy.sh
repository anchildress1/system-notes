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

# Load environment variables from apps/api/.env if present
if [ -f "apps/api/.env" ]; then
    echo "Loading environment variables from apps/api/.env..."
    export $(grep -v '^#' apps/api/.env | xargs)
fi


# if [ -z "$OPENAI_API_KEY" ]; then
#     echo "Error: OPENAI_API_KEY environment variable is not set."
#     echo "Export it: export OPENAI_API_KEY='your-key'"
#     exit 1
# fi

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
        "$SERVICE_NAME"
        --image "$IMAGE_URI"
        --region "$REGION"
        --allow-unauthenticated
        --port "$PORT"
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
REGIONS=("us-east1")

# Service Accounts
API_SA="system-notes-api@anchildress1-unstable.iam.gserviceaccount.com"
UI_SA="system-notes-ui@anchildress1-unstable.iam.gserviceaccount.com"

deploy_service "$UI_SERVICE" "." "$UI_PORT" "$UI_SA" "" "apps/web/Dockerfile"

echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE"
echo "=================================================="
