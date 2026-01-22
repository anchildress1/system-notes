#!/bin/bash
set -e

# Configuration
API_SERVICE="system-notes-api"
API_SOURCE="apps/api"
API_PORT="8080"

UI_SERVICE="system-notes-ui"
UI_SOURCE="apps/web"
UI_PORT="3000"


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
echo "Deployment Type: Multi-Region"
echo "=================================================="

# Function to deploy a service
deploy_service() {
    local SERVICE_NAME=$1
    local SOURCE_DIR=$2
    local PORT=$3
    local ENV_VARS=$4
    local DOCKERFILE_PATH=$5
    local BUILD_ARGS_FLAGS=$6
    local SERVICE_ACCOUNT=$7

    echo ""
    echo "--- Processing $SERVICE_NAME ---"

    # 1. Ensure Artifact Registry Repo exists
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
    
    if [ -n "$DOCKERFILE_PATH" ]; then
        # Simpler approach: Create a temporary cloudbuild.yaml for this build
        cat > cloudbuild_tmp.yaml <<EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  entrypoint: 'bash'
  args:
  - '-c'
  - |
    docker build -t $IMAGE_URI -f $DOCKERFILE_PATH $BUILD_ARGS_FLAGS .
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
    
    local DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_URI \
        --region $REGION \
        --allow-unauthenticated \
        --labels dev-tutorial=devnewyear2026 \
        --port $PORT"

    if [ -n "$ENV_VARS" ]; then
        DEPLOY_CMD="$DEPLOY_CMD --set-env-vars $ENV_VARS"
    fi

    if [ -n "$SERVICE_ACCOUNT" ]; then
        DEPLOY_CMD="$DEPLOY_CMD --service-account $SERVICE_ACCOUNT"
    fi

    eval $DEPLOY_CMD
}


# Define target regions (space separated)
REGIONS=("us-east1")

# Service Accounts
API_SA="system-notes-api@anchildress1.iam.gserviceaccount.com"
UI_SA="system-notes-ui@anchildress1.iam.gserviceaccount.com"

for REGION in "${REGIONS[@]}"; do
    echo ""
    echo "##################################################"
    echo "DEPLOYING TO REGION: $REGION"
    echo "##################################################"
    echo ""

    # Deploy API
    deploy_service "$API_SERVICE" "$API_SOURCE" "$API_PORT" "OPENAI_API_KEY=${OPENAI_API_KEY}" "" "" "$API_SA"

    # Get API URL
    echo "Retrieving API URL for $REGION..."
    API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --format 'value(status.url)')
    echo "API URL ($REGION): $API_URL"

    # Deploy UI
    export API_URL
    BUILD_ARGS="--build-arg NEXT_PUBLIC_API_URL=$API_URL"
    deploy_service "$UI_SERVICE" "." "$UI_PORT" "NEXT_PUBLIC_API_URL=$API_URL" "apps/web/Dockerfile" "$BUILD_ARGS" "$UI_SA"
done

echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE"
echo "=================================================="
