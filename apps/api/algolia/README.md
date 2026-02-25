# Algolia Search Configuration

This directory contains the configuration and source data for the **System Notes** Algolia search index.

## 📂 Directory Structure

We use a consolidated structure for the unified `system-notes` index:

```
apps/api/algolia/
├── sources/             # Consolidated data and configuration
│   ├── index.json       # The Master Knowledge Graph (facts, narratives, projects)
│   ├── settings.json    # Searchable attributes, faceting, ranking
│   ├── synonyms.json    # Synonym definitions
│   └── crawler.js       # Algolia web crawler config for blog post indexing
├── diagrams/            # Architecture diagrams
└── prompts/             # Algolia Agent Studio prompts
```

## 🧠 Index Schema

The `system-notes` index uses a **Granular Fact Architecture**. Instead of indexing full pages, we index atomic "facts" or "narratives" to enable precise retrieval.

### Core Attributes

| Attribute  | Description                                                  |
| :--------- | :----------------------------------------------------------- |
| `objectID` | Unique identifier (e.g., `fact-001`, `project-system-notes`) |
| `title`    | Title of the context (e.g., "Algolia Integration")           |
| `fact`     | The core atomic content/statement                            |
| `blurb`    | Short description or summary (for projects/narratives)       |

### Faceting & Filtering Attributes

| Attribute  | Type     | Description                                                     |
| :--------- | :------- | :-------------------------------------------------------------- |
| `category` | `string` | High-level domain: `Work Style`, `Philosophy`, `Projects`, etc. |
| `projects` | `array`  | Related projects: `System Notes`, `Hermes Agent`, etc.          |
| `tags`     | `array`  | Thematic tags: `Architecture`, `UX`, `Performance`              |
| `signal`   | `string` | Priority/Relevance signal: `High`, `Medium`, `Low`              |
