#!/usr/bin/env bash
set -euo pipefail

# Algolia Index Upload Script
# Uploads both data and settings to Algolia indices from repository root

# Load credentials from .env
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID:-}" ] || [ -z "${ALGOLIA_ADMIN_API_KEY:-}" ]; then
  echo "Error: NEXT_PUBLIC_ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY must be set in .env"
  exit 1
fi

BASE_URL="https://${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}.algolia.net/1"
INDEX_NAME="${NEXT_PUBLIC_ALGOLIA_INDEX_NAME:-system-notes}"
MERGED_INDEX="${ALGOLIA_MERGED_INDEX:-merged-search}"
CRAWLER_INDEX="${ALGOLIA_CRAWLER_INDEX:-crawly_posts}"

NORMALIZE_JQ_COMMON='
  def ensure_array($value):
    if $value == null then []
    elif ($value | type) == "array" then $value
    else [$value]
    end;

  def normalize_common:
    . as $in
    | {
        objectID: ($in.objectID // error("Missing objectID")),
        title: ($in.title // ""),
        blurb: ($in.blurb // ""),
        fact: ($in.fact // ""),
        "tags.lvl0": (ensure_array($in["tags.lvl0"])),
        "tags.lvl1": (ensure_array($in["tags.lvl1"])),
        projects: (ensure_array($in.projects)),
        category: ($in.category // ""),
        signal: ($in.signal // 0)
      }
    | . as $record
    | ($record["tags.lvl0"]) as $lvl0
    | ($record["tags.lvl1"]) as $lvl1
    | if ($lvl0 | length) == 1
      then .["tags.lvl1"] = ($lvl1 | map(
        if (type == "string" and (contains(" > ") | not))
        then ($lvl0[0] + " > " + (sub("^#"; "")))
        else .
        end
      ))
      else .
      end;

  def normalize_no_url: normalize_common;
  def normalize_with_url: . as $in | normalize_common | . + {url: ($in.url // "")};
  def normalize_with_url_empty_blurb: . as $in | normalize_common | . + {url: ($in.url // "")} | .blurb = "";
'

# Filters:
NORMALIZE_JQ_SYS="${NORMALIZE_JQ_COMMON}; {requests: [.[] | {action: \"updateObject\", body: (normalize_no_url)}]}"
NORMALIZE_JQ_MERGED="${NORMALIZE_JQ_COMMON}; {requests: [.[] | {action: \"updateObject\", body: (normalize_with_url)}]}"
NORMALIZE_JQ_MERGED_FROM_HITS="${NORMALIZE_JQ_COMMON}; {requests: [.[] | {action: \"updateObject\", body: (normalize_with_url_empty_blurb)}]}"

echo "📤 Uploading ${INDEX_NAME} index data..."
if [ -f "apps/api/algolia/sources/index.json" ]; then
  INDEX_JSON_PATH="$(pwd)/apps/api/algolia/sources/index.json"
  if [ ! -f "$INDEX_JSON_PATH" ]; then
    echo "Error: index file not found at $INDEX_JSON_PATH" >&2
    exit 1
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required but not installed" >&2
    exit 1
  fi

  BATCH_JSON_SYS=$(jq -f "apps/api/algolia/config/normalize_sys.jq" "$INDEX_JSON_PATH")

  # Upload to system-notes (no url field)
  echo "$BATCH_JSON_SYS" | curl --fail-with-body -X POST "${BASE_URL}/indexes/${INDEX_NAME}/batch" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data-binary @- -w "\n" -s

  # Upload to merged-search
  echo "📤 Syncing to ${MERGED_INDEX}..."
  BATCH_JSON_MERGED=$(jq -f "apps/api/algolia/config/normalize_merged.jq" "$INDEX_JSON_PATH")
  echo "$BATCH_JSON_MERGED" | curl --fail-with-body -X POST "${BASE_URL}/indexes/${MERGED_INDEX}/batch" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data-binary @- -w "\n" -s
else
  echo "Error: apps/api/algolia/sources/index.json not found"
  exit 1
fi

echo "⚙️  Uploading settings to ${INDEX_NAME} and ${MERGED_INDEX}..."
if [ -f "apps/api/algolia/sources/settings.json" ]; then
  # Settings for system-notes
  curl --fail-with-body -X PUT "${BASE_URL}/indexes/${INDEX_NAME}/settings" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data @apps/api/algolia/sources/settings.json -w "\n" -s

  # Settings for merged-search
  curl --fail-with-body -X PUT "${BASE_URL}/indexes/${MERGED_INDEX}/settings" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data @apps/api/algolia/sources/settings.json -w "\n" -s
else
  echo "Info: apps/api/algolia/sources/settings.json not found — skipping settings upload.\n  To upload settings, create the file at apps/api/algolia/config/settings.json (Algolia index settings JSON)."
fi

echo "🔤 Uploading synonyms to ${INDEX_NAME} and ${MERGED_INDEX}..."
if [ -f "apps/api/algolia/sources/synonyms.json" ]; then
  # Synonyms for system-notes
  curl --fail-with-body -X POST "${BASE_URL}/indexes/${INDEX_NAME}/synonyms/batch?replaceExistingSynonyms=true" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data @apps/api/algolia/sources/synonyms.json -w "\n" -s

  # Synonyms for merged-search
  curl --fail-with-body -X POST "${BASE_URL}/indexes/${MERGED_INDEX}/synonyms/batch?replaceExistingSynonyms=true" \
    -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
    -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
    -H "Content-Type: application/json" \
    --data @apps/api/algolia/sources/synonyms.json -w "\n" -s
else
  echo "Info: apps/api/algolia/sources/synonyms.json not found — skipping synonyms upload.\n  To upload synonyms, create the file at apps/api/algolia/config/synonyms.json (an array of synonym objects)."
fi

echo "🔗 Merging ${CRAWLER_INDEX} into ${MERGED_INDEX}..."

# Use a more robust check that handles 404
INDEX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/indexes/${CRAWLER_INDEX}" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

if [ "$INDEX_CHECK" = "200" ]; then
  echo "   Found ${CRAWLER_INDEX} index (HTTP 200), fetching records..."

  CURSOR=""
  TOTAL_MERGED=0

  while true; do
    if [ -z "$CURSOR" ]; then
      BROWSE_URL="${BASE_URL}/indexes/${CRAWLER_INDEX}/browse"
    else
      BROWSE_URL="${BASE_URL}/indexes/${CRAWLER_INDEX}/browse?cursor=${CURSOR}"
    fi

    RESPONSE=$(curl -s "$BROWSE_URL" \
      -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
      -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

    HITS=$(echo "$RESPONSE" | jq '.hits')
    HIT_COUNT=$(echo "$HITS" | jq 'length')

    if [ "$HIT_COUNT" -gt 0 ]; then
      echo "   Merging batch of $HIT_COUNT records into ${MERGED_INDEX}..."
      echo "$HITS" | jq -f "apps/api/algolia/config/normalize_merged_from_hits.jq" - | \
        curl --fail-with-body -X POST "${BASE_URL}/indexes/${MERGED_INDEX}/batch" \
        -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
        -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
        -H "Content-Type: application/json" \
        --data-binary @- \
        -w "\n" \
        -s > /dev/null

      TOTAL_MERGED=$((TOTAL_MERGED + HIT_COUNT))
    fi

    CURSOR=$(echo "$RESPONSE" | jq -r '.cursor // empty')

    if [ -z "$CURSOR" ]; then
      break
    fi
  done

  echo "   ✓ Merged $TOTAL_MERGED records from ${CRAWLER_INDEX} into ${MERGED_INDEX}"
else
  echo "   ${CRAWLER_INDEX} index not found, skipping merge"
fi

SYSTEM_INDEX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/indexes/${INDEX_NAME}" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

if [ "$SYSTEM_INDEX_CHECK" != "200" ]; then
  echo "Error: ${INDEX_NAME} index not found after upload (HTTP ${SYSTEM_INDEX_CHECK})"
  exit 1
fi

MERGED_INDEX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/indexes/${MERGED_INDEX}" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

if [ "$MERGED_INDEX_CHECK" != "200" ]; then
  echo "Error: ${MERGED_INDEX} index not found after upload (HTTP ${MERGED_INDEX_CHECK})"
  exit 1
fi

echo "✅ Index upload complete"
