#!/usr/bin/env bash
set -euo pipefail

# Algolia Index Upload Script
# Uploads both data and settings to Algolia indices from repository root

# Load credentials from .env files
for env_file in ".env" ".env.local" "apps/web/.env.local"; do
  if [ -f "$env_file" ]; then
    # shellcheck disable=SC1090,SC1091
    set -a
    source "$env_file"
    set +a
  fi
done

if [ -z "${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID:-}" ] || [ -z "${ALGOLIA_ADMIN_API_KEY:-}" ]; then
  echo "Error: NEXT_PUBLIC_ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY must be set in .env"
  exit 1
fi

BASE_URL="https://${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}.algolia.net/1"
INDEX_NAME="${NEXT_PUBLIC_ALGOLIA_INDEX_NAME:-system-notes}"
MERGED_INDEX="${ALGOLIA_MERGED_INDEX:-merged-search}"
CRAWLER_INDEX="${ALGOLIA_CRAWLER_INDEX:-crawly_posts}"

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

  # --- System Notes: Upsert + Prune ---
  echo "📥 Fetching history from ${INDEX_NAME}..."
  > sys_state.jsonl
  if curl --output /dev/null --silent --head --fail "${BASE_URL}/indexes/${INDEX_NAME}"; then
    CURSOR=""
    while true; do
      URL="${BASE_URL}/indexes/${INDEX_NAME}/browse?attributesToRetrieve=objectID,created_at${CURSOR:+&cursor=$CURSOR}"
      RESP=$(curl -s "$URL" \
        -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
        -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

      if echo "$RESP" | jq -e 'has("status") and (.status | tonumber) >= 400' >/dev/null 2>&1; then
        echo "Error from Algolia: $(echo "$RESP" | jq -r '.message // "Unknown error"')" >&2
        exit 1
      fi

      echo "$RESP" | jq -c '.hits[] | {id: .objectID, created_at: .created_at}' >> sys_state.jsonl
      CURSOR=$(echo "$RESP" | jq -r '.cursor // empty')
      [ -z "$CURSOR" ] && break
    done
  fi

  # Create lookup map
  if [ -s sys_state.jsonl ]; then
    jq -n '[inputs] | {
      dates: (map(select(.created_at) | {(.id): .created_at}) | add // {}),
      ids: map(.id)
    }' sys_state.jsonl > sys_state.json
  else
    echo '{"dates": {}, "ids": []}' > sys_state.json
  fi
  rm -f sys_state.jsonl

  echo "🔨 Calculating System Notes Plan (Upsert & Prune)..."
  # Enrich with dates & Plan
  jq -s '
    .[0] as $state
    | .[1]
    | map(. + {
        created_at: ($state.dates[.objectID] // (now | todate))
      }) as $payload
    | $payload
    | map(.objectID) as $new_ids
    | ($state.ids - $new_ids) as $to_delete
    | {
        payload: $payload,
        deletes: $to_delete
      }
  ' sys_state.json "$INDEX_JSON_PATH" > sys_plan.json

  # Execute Deletes
  DELETE_COUNT=$(jq '.deletes | length' sys_plan.json)
  if [ "$DELETE_COUNT" -gt 0 ]; then
    echo "🗑️  Deleting $DELETE_COUNT stale records from ${INDEX_NAME}..."
    jq -c '.deletes' sys_plan.json | \
    jq '{requests: map({action: "deleteObject", body: {objectID: .}})}' | \
    curl --fail-with-body -X POST "${BASE_URL}/indexes/${INDEX_NAME}/batch" \
      -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
      -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
      -H "Content-Type: application/json" \
      --data-binary @- -w "\n" -s > /dev/null
  else
    echo "✨ No stale records to delete from ${INDEX_NAME}."
  fi

  # Execute Upserts
  UPSERT_COUNT=$(jq '.payload | length' sys_plan.json)
  if [ "$UPSERT_COUNT" -gt 0 ]; then
    echo "🚀 Upserting $UPSERT_COUNT records to ${INDEX_NAME}..."
    jq '.payload' sys_plan.json | \
    jq -f "apps/api/algolia/config/normalize_sys.jq" | \
    curl --fail-with-body -X POST "${BASE_URL}/indexes/${INDEX_NAME}/batch" \
      -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
      -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
      -H "Content-Type: application/json" \
      --data-binary @- -w "\n" -s > /dev/null
  else
    echo "✨ No records to upload to ${INDEX_NAME}."
  fi

  # Cleanup
  rm -f sys_state.json sys_plan.json

  # --- Merged Index: Sync (Upsert + Prune) ---
  echo "📥 Fetching history from ${MERGED_INDEX}..."
  > merged_state.jsonl
  if curl --output /dev/null --silent --head --fail "${BASE_URL}/indexes/${MERGED_INDEX}"; then
    CURSOR=""
    while true; do
      URL="${BASE_URL}/indexes/${MERGED_INDEX}/browse?attributesToRetrieve=objectID,created_at${CURSOR:+&cursor=$CURSOR}"
      RESP=$(curl -s "$URL" \
        -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
        -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

      if echo "$RESP" | jq -e 'has("status") and (.status | tonumber) >= 400' >/dev/null 2>&1; then
        echo "Error from Algolia: $(echo "$RESP" | jq -r '.message // "Unknown error"')" >&2
        exit 1
      fi

      echo "$RESP" | jq -c '.hits[] | {id: .objectID, created_at: .created_at}' >> merged_state.jsonl
      CURSOR=$(echo "$RESP" | jq -r '.cursor // empty')
      [ -z "$CURSOR" ] && break
    done
  fi

  # Create lookup map for dates
  if [ -s merged_state.jsonl ]; then
    jq -n '[inputs] | {
      dates: (map(select(.created_at) | {(.id): .created_at}) | add // {}),
      ids: map(.id)
    }' merged_state.jsonl > merged_state.json
  else
    echo '{"dates": {}, "ids": []}' > merged_state.json
  fi
  rm -f merged_state.jsonl

  echo "🕷️  Fetching Crawler records..."
  > crawler_records.jsonl
  if curl --output /dev/null --silent --head --fail "${BASE_URL}/indexes/${CRAWLER_INDEX}"; then
    CURSOR=""
    while true; do
      URL="${BASE_URL}/indexes/${CRAWLER_INDEX}/browse${CURSOR:+?cursor=$CURSOR}"
      RESP=$(curl -s "$URL" \
        -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
        -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}")

      if echo "$RESP" | jq -e 'has("status") and (.status | tonumber) >= 400' >/dev/null 2>&1; then
        echo "Error from Algolia: $(echo "$RESP" | jq -r '.message // "Unknown error"')" >&2
        exit 1
      fi

      echo "$RESP" | jq -c '.hits[]' >> crawler_records.jsonl
      CURSOR=$(echo "$RESP" | jq -r '.cursor // empty')
      [ -z "$CURSOR" ] && break
    done
  fi
  jq -s '.' crawler_records.jsonl > crawler_data.json
  rm -f crawler_records.jsonl

  echo "🔄 Calculating Sync (Diff & Merge)..."

  # Combine Sources & Enrich
  # Inputs: [merged_state.json, index.json (sys), crawler_data.json]
  jq -s '
    .[0] as $state
    | .[1] as $sys
    | .[2] as $crawl
    | ($sys + $crawl) as $all_new
    | $all_new
    | map(. + {
        created_at: ($state.dates[.objectID] // (now | todate))
      }) as $payload
    | $payload
    | map(.objectID) as $new_ids
    | ($state.ids - $new_ids) as $to_delete
    | {
        payload: $payload,
        deletes: $to_delete
      }
  ' merged_state.json "$INDEX_JSON_PATH" crawler_data.json > sync_plan.json

  # Execute Deletes
  DELETE_COUNT=$(jq '.deletes | length' sync_plan.json)
  if [ "$DELETE_COUNT" -gt 0 ]; then
    echo "🗑️  Deleting $DELETE_COUNT stale records from ${MERGED_INDEX}..."
    jq -c '.deletes' sync_plan.json | \
    jq '{requests: map({action: "deleteObject", body: {objectID: .}})}' | \
    curl --fail-with-body -X POST "${BASE_URL}/indexes/${MERGED_INDEX}/batch" \
      -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
      -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
      -H "Content-Type: application/json" \
      --data-binary @- -w "\n" -s > /dev/null
  else
    echo "✨ No stale records to delete."
  fi

  # Execute Upserts
  UPSERT_COUNT=$(jq '.payload | length' sync_plan.json)
  if [ "$UPSERT_COUNT" -gt 0 ]; then
    echo "🚀 Upserting $UPSERT_COUNT records to ${MERGED_INDEX}..."
    jq '.payload' sync_plan.json | \
    jq -f "apps/api/algolia/config/normalize_merged.jq" | \
    curl --fail-with-body -X POST "${BASE_URL}/indexes/${MERGED_INDEX}/batch" \
      -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
      -H "X-Algolia-Application-Id: ${NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}" \
      -H "Content-Type: application/json" \
      --data-binary @- -w "\n" -s > /dev/null
  else
    echo "✨ No records to upload."
  fi

  # Cleanup
  rm -f sys_state.json sys_payload.json merged_state.json crawler_data.json sync_plan.json
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
