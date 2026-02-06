# Algolia Index Configuration

This folder tracks all Algolia index settings for reproducibility.

## Indices

- **`system-notes`** — Unified index containing "fact" objects and narrative records (Identity, Principles, Projects, etc.) for targeted retrieval.

## Files

- `sources/` — Source of truth JSON files (`index.json`).
- `config/` — Index settings and synonym files (`settings.json`, `synonyms.json`).
- `algolia_prompt.md` — The unified system prompt for the agent.

## Searchable Attributes (Tier Order)

### `system-notes`

1. `title`
2. `blurb`
3. `fact`
4. `tags`
5. `entities`

## Architecture Diagrams

### System Flow: Source → Algolia → Agent → User

```mermaid
graph TB
    accTitle: Algolia System Data Flow
    accDescr: Data flow showing how the Python script enriches JSON data with graph context before indexing

    %% Data sources
    UnifiedJSON["sources/index.json<br/>(Unified Knowledge Graph)"]:::source

    %% Algolia indices
    UnifiedIndex[("system-notes index<br/>(Unified)")]:::index

    %% Retrieval
    Ruckus["Ruckus Agent<br/>(RAG Retrieval)"]:::agent

    %% Link generation
    Links["Deterministic Links"]:::output

    %% Flow
    UnifiedJSON --> UnifiedIndex
    UnifiedIndex -->|retrieve| Ruckus

    Ruckus --> Links
    Links --> User

    %% Styles
    classDef source fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#f9fafb
    classDef process fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#faf5ff
    classDef index fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#f0f9ff
    classDef agent fill:#059669,stroke:#047857,stroke-width:2px,color:#f0fdf4
    classDef output fill:#0891b2,stroke:#0e7490,stroke-width:2px,color:#ecfeff
```

## Upload Workflow

The primary upload method is via the python script:

```bash
# Upload to Algolia (Enrichment happens in-memory)
python3 apps/api/scripts/index_algolia.py
```

## Credentials

Stored in `.env`:

```
ALGOLIA_APPLICATION_ID=EXKENZ9FHJ
ALGOLIA_ADMIN_API_KEY=<redacted>
```

**Never commit credentials to git.**
