# Algolia Index Configuration

This folder tracks all Algolia index settings for reproducibility.

## Indices

- **`projects`** — 9 records, single granular objects with narrative fields (`what_it_is`, `why_it_exists`).
- **`about`** — ~6 records, granular "fact" objects (Identity, Principles, etc.) for targeted retrieval.
- **`blog_posts`** — 56 records, fetched from sitemap.

## Files

- `sources/` — Source of truth JSON files (`about.json`, `projects.json`).
- `config/` — Index settings and synonym files (`projects_settings.json`, `about_settings.json`).
- `build/` — Generated artifacts (enriched with visual refs and graph connections) ready for upload.
- `algolia_prompt.md` — The unified system prompt for the agent.

## Searchable Attributes (Tier Order)

### `projects`

1. `name`
2. `aliases`
3. `what_it_is`
4. `why_it_exists`
5. `tech_stack`

### `about`

1. `title`
2. `tags`
3. `content` (the raw JSON data of the fact)

### `blog_posts`

1. `title`
2. `excerpt`
3. `tags`

## Architecture Diagrams

### System Flow: Source → Algolia → Agent → User

```mermaid
graph TB
    %% Data sources
    AboutJSON["sources/about.json<br/>(Granular Facts)"]:::source
    ProjectsJSON["sources/projects.json<br/>(Narrative Objects)"]:::source

    %% The Builder
    subgraph "Builder: apps/api/scripts/build_knowledge_graph.py"
        EnrichProjects["Enrich Projects<br/>(Add banners & graph links)"]:::process
        FactExtract["Extract Facts<br/>(Add visual refs)"]:::process
    end

    %% Algolia indices
    AboutIndex[("about index")]:::index
    ProjectsIndex[("projects index")]:::index

    %% Retrieval
    Ruckus["Ruckus Agent<br/>(Retrieval-Augmented)"]:::agent

    %% Flow
    ProjectsJSON --> EnrichProjects
    AboutJSON --> FactExtract

    EnrichProjects -->|upload| ProjectsIndex
    FactExtract -->|upload| AboutIndex

    AboutIndex -->|retrieve| Ruckus
    ProjectsIndex -->|retrieve| Ruckus

    %% Styles
    classDef source fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:#f9fafb
    classDef process fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#faf5ff
    classDef index fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#f0f9ff
    classDef agent fill:#059669,stroke:#047857,stroke-width:2px,color:#f0fdf4
```

## Upload Workflow

The primary upload method is via the python scripts:

```bash
# 1. Build artifacts from sources
python3 apps/api/scripts/build_knowledge_graph.py

# 2. Upload to Algolia
python3 apps/api/scripts/index_algolia.py
```

## Credentials

Stored in `.env`:

```
ALGOLIA_APPLICATION_ID=EXKENZ9FHJ
ALGOLIA_ADMIN_API_KEY=<redacted>
```

**Never commit credentials to git.**
