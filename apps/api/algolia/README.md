# Algolia Index Configuration

This folder tracks all Algolia index settings for reproducibility.

## Indices

- **`system-notes`** — Unified index containing "fact" objects and narrative records (Identity, Principles, Projects, etc.) for targeted retrieval.
- **`projects`** — (Deprecated) legacy project records.
- **`about`** — (Deprecated) legacy identity records.

## Files

- `sources/` — Source of truth JSON files (`index.json`).
- `config/` — Index settings and synonym files (`settings.json`, `synonyms.json`).
- `algolia_prompt.md` — The unified system prompt for the agent.

## Searchable Attributes (Tier Order)

### `projects`

1. `title`
2. `tags`
3. `data.name`
4. `data.what_it_is`
5. `data.why_it_exists`
6. `data.what_happened`
7. `data.tech_stack`

### `about`

1. `title`
2. `tags`

## Architecture Diagrams

### System Flow: Source → Algolia → Agent → User

```mermaid
graph TB
    %% Data sources
    AboutJSON["sources/about.json<br/>(Granular Facts)"]:::source
    ProjectsJSON["sources/projects.json<br/>(Narrative Objects)"]:::source

    %% Algolia indices
    AboutIndex[("about index")]:::index
    ProjectsIndex[("projects index")]:::index

    %% Retrieval
    Ruckus["Ruckus Agent<br/>(Retrieval-Augmented)"]:::agent

    %% Flow
    ProjectsJSON --> ProjectsIndex
    AboutJSON --> AboutIndex

    AboutIndex -->|retrieve| Ruckus
    ProjectsIndex -->|retrieve| Ruckus

    %% Styles
    classDef source fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#f9fafb
    classDef process fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#faf5ff
    classDef index fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#f0f9ff
    classDef agent fill:#059669,stroke:#047857,stroke-width:2px,color:#f0fdf4
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
