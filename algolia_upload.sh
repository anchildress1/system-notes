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
INDEX_NAME="system-notes"

echo "📤 Uploading ${INDEX_NAME} index data..."
if [ -f "apps/api/algolia/sources/index.json" ]; then
  cat apps/api/algolia/sources/index.json | jq '{requests: [.[] | {action: "updateObject", body: .}]}' | \
    curl -X POST "${BASE_URL}/indexes/${INDEX_NAME}/batch" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data-binary @- \
    -w "\n" \
    -s
else
  echo "Error: apps/api/algolia/sources/index.json not found"
  exit 1
fi

echo "⚙️  Uploading ${INDEX_NAME} settings..."
if [ -f "apps/api/algolia/config/settings.json" ]; then
  curl -X PUT "${BASE_URL}/indexes/${INDEX_NAME}/settings" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data @apps/api/algolia/config/settings.json \
    -w "\n" \
    -s
else
  echo "Warning: apps/api/algolia/config/settings.json not found, skipping settings upload"
fi

echo "🔤 Uploading ${INDEX_NAME} synonyms..."
if [ -f "apps/api/algolia/config/synonyms.json" ]; then
  curl -X POST "${BASE_URL}/indexes/${INDEX_NAME}/synonyms/batch?replaceExistingSynonyms=true" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data @apps/api/algolia/config/synonyms.json \
    -w "\n" \
    -s
else
  echo "Warning: apps/api/algolia/config/synonyms.json not found, skipping synonyms upload"
fi

echo "✅ Index upload complete"
