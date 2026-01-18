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

if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable is not set."
    echo "Export it: export OPENAI_API_KEY='your-key'"
    exit 1
fi

# Setup Project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT_ID" == "(unset)" ] || [ -z "$PROJECT_ID" ]; then
    read -p "Enter Google Cloud Project ID: " PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        echo "Error: Project ID required."
        exit 1
    fi
    gcloud config set project "$PROJECT_ID"
fi

echo "=================================================="
echo "DEPLOYMENT STARTED"
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo "=================================================="

# Function to deploy a service
deploy_service() {
    local SERVICE_NAME=$1
    local SOURCE_DIR=$2
    local PORT=$3
    local ENV_VARS=$4
    local DOCKERFILE_PATH=$5

    echo ""
    echo "--- Processing $SERVICE_NAME ---"

    # 1. Ensure Artifact Registry Repo exists
    # We use the service name as the repo name for isolation
    REPO_NAME="$SERVICE_NAME"
    
    if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
        echo "Creating Artifact Registry repository: $REPO_NAME..."
        gcloud artifacts repositories create "$REPO_NAME" \
            --repository-format=docker \
            --location="$REGION" \
            --description="Docker repository for $SERVICE_NAME"
    else
        echo "Repository $REPO_NAME exists."
    fi

    # 2. Build and Push Image
    IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"
    echo "Building and pushing image: $IMAGE_URI"
    
    # Construct build command arguments
    BUILD_ARGS="--tag $IMAGE_URI"
    if [ -n "$DOCKERFILE_PATH" ]; then
        # If a custom Dockerfile path is provided, use the config flag to specify it
        # gcloud builds submit doesn't have a direct --file flag like docker build,
        # but we can assume the source is correct.
        # Wait, gcloud builds submit DOES NOT support --file directly for source builds easily without cloudbuild.yaml.
        # BUT, if we can't use --file, we might need a cloudbuild.yaml or use `docker build` + `docker push` if local docker is available,
        # OR use the --config flag pointing to a generated cloudbuild.yaml.
        
        # Simpler approach: Create a temporary cloudbuild.yaml for this build
        cat > cloudbuild_tmp.yaml <<EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [ 'build', '-t', '$IMAGE_URI', '-f', '$DOCKERFILE_PATH', '.' ]
images:
- '$IMAGE_URI'
EOF
        gcloud builds submit --config cloudbuild_tmp.yaml "$SOURCE_DIR"
        rm cloudbuild_tmp.yaml
    else
        gcloud builds submit --tag "$IMAGE_URI" "$SOURCE_DIR"
    fi

    # 3. Deploy to Cloud Run
    echo "Deploying to Cloud Run..."
    if [ -n "$ENV_VARS" ]; then
        gcloud run deploy "$SERVICE_NAME" \
            --image "$IMAGE_URI" \
            --region "$REGION" \
            --allow-unauthenticated \
            --port "$PORT" \
            --set-env-vars "$ENV_VARS"
    else
        gcloud run deploy "$SERVICE_NAME" \
            --image "$IMAGE_URI" \
            --region "$REGION" \
            --allow-unauthenticated \
            --port "$PORT"
    fi
}

# Deploy API
deploy_service "$API_SERVICE" "$API_SOURCE" "$API_PORT" "OPENAI_API_KEY=${OPENAI_API_KEY}" ""

# Deploy UI
# Source is root (.) because turbo prune needs to see the whole repo
# Dockerfile is apps/web/Dockerfile
deploy_service "$UI_SERVICE" "." "$UI_PORT" "" "apps/web/Dockerfile"

echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE"
echo "=================================================="
