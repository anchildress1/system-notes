#!/usr/bin/env bash
set -euo pipefail

# Algolia Crawler Configuration Deploy Script
# Creates or updates Algolia crawler configuration from repository root
# Reference: https://www.algolia.com/doc/rest-api/crawler/create-crawler/

# Load credentials from .env
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Require necessary environment variables
require_env() {
    local name=$1
    if [ -z "${!name:-}" ]; then
        echo "Error: Required env var '$name' is missing or empty."
        exit 1
    fi
}

require_env "NEXT_PUBLIC_ALGOLIA_APPLICATION_ID"
require_env "NEXT_PUBLIC_BASE_URL"
require_env "ALGOLIA_ADMIN_API_KEY"

# Configuration
CRAWLER_API_URL="https://crawler.algolia.com/api/1/crawlers"
CRAWLER_ID="${ALGOLIA_CRAWLER_ID:-}"

echo "=================================================="
echo "ALGOLIA CRAWLER DEPLOYMENT"
echo "=================================================="
echo "Application ID: $NEXT_PUBLIC_ALGOLIA_APPLICATION_ID"
echo "Base URL:       $NEXT_PUBLIC_BASE_URL"
if [ -n "$CRAWLER_ID" ]; then
  echo "Crawler ID:     $CRAWLER_ID (updating existing)"
else
  echo "Crawler ID:     (will be created as new crawler)"
fi
echo "=================================================="

# Create crawler configuration JSON
CRAWLER_CONFIG=$(cat <<EOF
{
  "name": "system-notes-crawler",
  "config": {
    "startUrls": ["${NEXT_PUBLIC_BASE_URL}"],
    "sitemaps": ["${NEXT_PUBLIC_BASE_URL}/sitemap.xml"],
    "indexPrefix": "crawly_",
    "schedule": "every 1 day at 3:00 am UTC",
    "actions": [
      {
        "indexName": "posts",
        "pathsToMatch": ["${NEXT_PUBLIC_BASE_URL}/**"],
        "recordExtractor": {
          "action": "extract",
          "fields": {
            "title": {
              "selector": "h1",
              "default": ""
            },
            "blurb": {
              "selector": "meta[name='description']",
              "attribute": "content",
              "default": ""
            },
            "url": {
              "selector": "link[rel='canonical']",
              "attribute": "href",
              "default": ""
            }
          }
        }
      }
    ]
  }
}
EOF
)

if [ -n "$CRAWLER_ID" ]; then
    echo "Updating existing crawler configuration..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        "${CRAWLER_API_URL}/${CRAWLER_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ALGOLIA_ADMIN_API_KEY}" \
        --data "$CRAWLER_CONFIG")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        echo "✅ Crawler configuration updated successfully"
    else
        echo "❌ Error: Failed to update crawler configuration (HTTP $HTTP_CODE)"
        echo "$BODY"
        exit 1
    fi
else
    echo "Creating new crawler..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "${CRAWLER_API_URL}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ALGOLIA_ADMIN_API_KEY}" \
        --data "$CRAWLER_CONFIG")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        CRAWLER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Crawler created successfully"
        echo ""
        echo "⚠️  ACTION REQUIRED:"
        echo "   Add this to your .env file:"
        echo "   ALGOLIA_CRAWLER_ID=$CRAWLER_ID"
        echo ""
        echo "   Or manually set the environment variable:"
        echo "   export ALGOLIA_CRAWLER_ID=$CRAWLER_ID"
    else
        echo "❌ Error: Failed to create crawler (HTTP $HTTP_CODE)"
        echo "$BODY"
        exit 1
    fi
fi

echo ""
echo "=================================================="
echo "ALGOLIA CRAWLER DEPLOYMENT COMPLETE"
echo "=================================================="
