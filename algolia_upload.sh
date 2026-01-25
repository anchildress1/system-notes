#!/usr/bin/env bash
set -euo pipefail

# Algolia Index Upload Script
# Uploads both data and settings to Algolia indices from repository root

# Load credentials from .env
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "${ALGOLIA_APPLICATION_ID:-}" ] || [ -z "${ALGOLIA_ADMIN_API_KEY:-}" ]; then
  echo "Error: ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY must be set in .env"
  exit 1
fi

BASE_URL="https://${ALGOLIA_APPLICATION_ID}.algolia.net/1"

echo "📤 Uploading projects index data..."
cat apps/api/algolia/projects/projects.json | jq '{requests: [.[] | {action: "updateObject", body: .}]}' | \
  curl -X POST "${BASE_URL}/indexes/projects/batch" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data-binary @- \
  -w "\n" \
  -s

echo "📤 Uploading about index data..."
cat apps/api/algolia/about/about.json | jq '{requests: [.[] | {action: "updateObject", body: .}]}' | \
  curl -X POST "${BASE_URL}/indexes/about/batch" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data-binary @- \
  -w "\n" \
  -s

echo "⚙️  Uploading projects settings..."
curl -X PUT "${BASE_URL}/indexes/projects/settings" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data @apps/api/algolia/projects/projects-settings.json \
  -w "\n" \
  -s

echo "⚙️  Uploading about settings..."
curl -X PUT "${BASE_URL}/indexes/about/settings" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data @apps/api/algolia/about/about-settings.json \
  -w "\n" \
  -s

echo "✅ All indices uploaded successfully"
