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

echo "Deploying $SERVICE_NAME to Cloud Run (Region: $REGION)..."
echo "Note: This builds the image on Google Cloud Build using the Dockerfile in apps/web."

# Deploy
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000

echo "Deployment complete!"
