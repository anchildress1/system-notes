#!/bin/bash
set -e

# Configuration
SERVICE_NAME="system-notes-ui"
REGION="us-east1"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed or not in PATH."
    echo "Please install it and run 'gcloud auth login' before running this script."
    exit 1
fi

# Check if project is set
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT_ID" == "(unset)" ] || [ -z "$PROJECT_ID" ]; then
    echo "Google Cloud project is not set."
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        echo "Error: Project ID is required."
        exit 1
    fi
    gcloud config set project "$PROJECT_ID"
fi

echo "Deploying $SERVICE_NAME to Cloud Run (Project: $PROJECT_ID, Region: $REGION)..."
echo "Note: This builds the image on Google Cloud Build using the Dockerfile in apps/web."

# Deploy
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000

echo "Deployment complete!"
