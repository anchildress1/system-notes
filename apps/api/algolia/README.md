# Algolia Index Configuration

This folder tracks all Algolia index settings for reproducibility.

## Indices

- **`projects`** — 9 records, avg 1.5KB
- **`about`** — 27 records, avg 800 bytes

## Files

- `about/` — About index data + tests (about.json, about.test.js)
- `projects/` — Projects index data + tests (projects.json, projects.test.js)
- `projects-settings.json` — Full index settings for `projects`
- `about-settings.json` — Full index settings for `about`
- `upload.sh` — Script to upload indices + settings via REST API

## Searchable Attributes (Tier Order)

### `projects`

1. `title`
2. `aliases`
3. `tags`
4. `display_name`
5. `summary`

### `about`

1. `title`
2. `aliases`
3. `tags`
4. `section`

**Note:** The `data` object in `about` records is opaque (not searchable). Extract to top-level or create a separate index if specific `data.*` keys need search.

## Manual Upload (REST API)

### Upload Index Data

```bash
# Projects index
cat projects/projects.json | jq '{requests: [.[] | {action: "updateObject", body: .}]}' | \
  curl -X POST "https://${ALGOLIA_APPLICATION_ID}.algolia.net/1/indexes/projects/batch" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data-binary @-

# About index
cat about/about.json | jq '{requests: [.[] | {action: "updateObject", body: .}]}' | \
  curl -X POST "https://${ALGOLIA_APPLICATION_ID}.algolia.net/1/indexes/about/batch" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data-binary @-
```

### Upload Settings

```bash
# Projects settings
curl -X PUT "https://${ALGOLIA_APPLICATION_ID}.algolia.net/1/indexes/projects/settings" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data @projects-settings.json

# About settings
curl -X PUT "https://${ALGOLIA_APPLICATION_ID}.algolia.net/1/indexes/about/settings" \
  -H "X-Algolia-API-Key: ${ALGOLIA_ADMIN_API_KEY}" \
  -H "X-Algolia-Application-Id: ${ALGOLIA_APPLICATION_ID}" \
  -H "Content-Type: application/json" \
  --data @about-settings.json
```

## MCP Upload (Preferred)

If Algolia MCP is configured and working:

```bash
# Use mcp_algolia-mcp_batch or mcp_algolia-mcp_setSettings
# (exact commands depend on MCP server implementation)
```

## Dashboard Upload (Manual Fallback)

1. Navigate to https://www.algolia.com/apps/EXKENZ9FHJ/explorer
2. Select index (`projects` or `about`)
3. Go to **Configuration** → **Searchable attributes**
4. Paste tier order from above
5. Go to **Configuration** → **Facets**
6. Add facets from settings files
7. Go to **Configuration** → **Ranking and Sorting**
8. Configure custom ranking

## Credentials

Stored in `.env`:

```
ALGOLIA_APPLICATION_ID=EXKENZ9FHJ
ALGOLIA_ADMIN_API_KEY=<redacted>
```

Never commit credentials to git.

## Architecture Diagrams

### System Flow: Source → Algolia → Agent → User

`mermaid src="../../../../docs/diagrams/algolia-system-flow.mmd" alt="Algolia system data flow from source JSON to user interaction"`

**Why this flow?**

- **Git-tracked sources**: JSON files are version-controlled truth, not Algolia dashboard edits.
- **Three upload paths**: MCP (dev), script (reproducible), dashboard (fallback). MCP preferred to avoid env var management during iteration.
- **Two indices, not one**: Separate `about` (identity/rules) from `projects` (portfolio items) to isolate tuning and prevent ranking contamination.
- **Fast-path router**: Greetings bypass search entirely to keep interactions snappy. No need to query 36 records for "hi".
- **K=25, max_total=3**: Retrieval is generous (K=25 for ranking stability), but display is ruthless (3 links max) to force concise navigation.
- **Deterministic ranker**: Strong match threshold (userScore ≥ 50), bucket caps (2 projects, 1 doc), tie-break by `updated_at` desc. No randomness.

---

### Index Design: Why 2 Indices, Normalized Schemas, Opaque Data

`mermaid src="../../../../docs/diagrams/algolia-index-decisions.mmd" alt="Decision tree explaining why two indices with normalized schemas and opaque data fields"`

**Key decisions:**

1. **Multiple indices over single index**:
   - Single index forces compromise settings (typo tolerance, ranking weights, facet structure).
   - Multiple indices allow per-type tuning: `projects` ranks by `order_rank`, `about` by `updated_at`.

2. **Normalized schemas (top-level only)**:
   - Flattening nested `data.*` fields would balloon record size and dilute search relevance.
   - Normalized approach keeps records small (~800B–1.5KB) and searchable attributes explicit (5–6 per index).

3. **Opaque `data` field**:
   - Not searchable, retrieval only.
   - Prevents search noise from deeply nested metadata.
   - If future need arises to search `data.*` fields, extract to top-level or create a new index—never auto-flatten.

**Outcome**: 36 records total, fast retrieval, stable ranking, clear search surface.

---

### Upload Workflow: MCP → Script → Dashboard

`mermaid src="../../../../docs/diagrams/algolia-upload-workflow.mmd" alt="Upload workflow comparison: MCP vs script vs manual, with constraints and failure modes"`

**Path preference order:**

1. **MCP (preferred, dev only)**:
   - Atomic uploads via `mcp_algolia-mcp_batch` and `mcp_algolia-mcp_setSettings`.
   - No env var juggling during iteration.
   - Not available in prod deployments.

2. **REST script (`upload.sh`)**:
   - Requires `ALGOLIA_APPLICATION_ID` and `ALGOLIA_ADMIN_API_KEY` in `.env`.
   - Reproducible, works in CI.
   - Uses `curl` + `jq` for batch transforms.

3. **Dashboard (manual fallback)**:
   - Error-prone, slow, non-reproducible.
   - Last resort when MCP unavailable and env vars missing.

**Constraints enforced:**

- MCP: dev only (not in prod).
- Script: secrets in `.env` only, never committed.
- All paths: manual triggers only, no auto-sync (prevents accidental overwrites).

**Failure modes:**

- MCP unavailable → fall back to script.
- Missing env vars → fall back to dashboard.
- Dashboard error → read docs, retry (no automated recovery).
