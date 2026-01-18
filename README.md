# System Notes

A living, queryable index of projects, versions, and decisions.

## What this is

System Notes replaces a static developer website with a dynamic system map.
It presents projects as evolving systems rather than finished artifacts, with
visible relationships, version history, and intent.

This repository contains the structure, data model, and interface that power
that system.

## What this is not

- A marketing site
- A résumé replacement
- A product landing page
- A collection of unrelated demos

## Core concepts

- **System map UI**: Projects are represented as interconnected nodes rather than pages.
- **Versioned records**: Each project exposes its evolution over time.
- **Contextual AI interface**: Queries surface structure, history, and relationships.
- **Machine-readable data**: Content is structured for retrieval and indexing.

## Repository structure

```
system-notes/
├─ app/                # UI and interaction layer
├─ data/               # Project and version definitions
├─ ai/                 # Embedded AI interface logic
├─ indexing/           # Search and retrieval schemas (Algolia-ready)
├─ public/
├─ docs/
└─ README.md
```

## Related systems

- **CheckMarK DevTools**  
  A collection of developer tooling projects indexed within System Notes.  
  External site: https://anchildress1.dev  
  GitHub org: https://github.com/CheckMarKDevTools

## Status

Active and evolving. Incomplete by design.

## Mine. Read Before You Get Ideas. ⚖️

This project is my work and it’s licensed under the [Polyform Shield License 1.0.0](./LICENSE).

You’re welcome to use it, fork it, study it, remix it, and generally take it apart to see how it ticks. Run it internally. Adapt it for your workflows. Learn from it. That part is encouraged.

What you don’t get to do is quietly turn it into money and pretend we never met.

If you’re selling it, monetizing it, bundling it into a paid product, offering it as a service, or otherwise making profit because this exists, you need my explicit permission first. I’m friendly. I’m reasonable. I’m not a checkout lane. 🛒

## Development

### Setup

1. **Install dependencies**:

   ```bash
   npm install --ignore-scripts
   ```

2. **Setup Git Hooks**:

   ```bash
   npx lefthook install
   ```

3. **Python (API)**:
   We use [uv](https://github.com/astral-sh/uv) for Python package management.
   ```bash
   cd apps/api
   npm run setup  # Runs: uv venv && uv pip install -r requirements.txt
   ```
