# Algolia Agent Studio Chatbot (Ruckus 2.0) 🔧

## Objective

Replace the current OpenAI-driven chat behavior with an Algolia Agent Studio–backed chatbot that **beats nav menus/search bars/related-content widgets** by:

- answering with **grounded, indexed facts**
- providing **deterministic “Next hops” (max 3)**
- making **failure an explicit, useful state**
- keeping the existing chat icon while swapping the embedded chat surface to Algolia’s chat widget

Scope priority: **chatbot first**. Search-assisted tools/dashboard/navigation/text effects are explicitly future work.

## Non-goals

- Competing with general-purpose LLMs (ChatGPT/Copilot).
- Indexing/crawling external content (DEV/Medium/blog) in this phase.
- Enabling Algolia “Memory” for end users (requires authentication; track as future enhancement).

---

## Core Product Requirements (mini‑PRD)

### Chat UX

- Keep the existing chat icon (behavior + placement).
- Use Algolia’s embedded chat interface, customized as much as supported.
- The chatbot must present answers as a **“system map navigator”**:
  - Direct answer first (short, declarative).
  - Then **Next hops** as links (deterministic; max 3).
  - No filler, no “help menus”, no instructional copy for obvious interactions.

### Deterministic Next hops

Constraints:

- Total links: **max_total = 3**
- Buckets & caps:
  - **Project**: max 2 (include repo link when available)
  - **System Doc**: max 1 (only if it resolves to a clickable URL with line-range anchor)
  - **Post**: 0 (until future indexing exists)

Ordering:

1. Projects
2. System Doc

Determinism rules:

- Retrieval: K=25
- Ranking boosts (Algolia):
  - node_type boost: Project > System Doc > Post
  - exact-match boosts: title, aliases, tags
- Post-processing: stable ordering tie-break
  - updated_at desc
  - slug asc (or objectID asc)

### Failure as a feature

Codified behaviors:

- **0 strong matches**:
  - Output: “No strong matches.”
  - Ask exactly one clarifying question.
  - Stop.
- **1 strong match**:
  - Output: “Only one strong match.”
  - Show the single result and link.
  - Stop.
- Otherwise:
  - Normal answer + Next hops.

No “nearest context” padding when confidence is low.

---

## Data & Indexing Requirements

### Index set (3 indexes)

1. **Projects index**

- Source: existing project data + assets already in repo.
- Starting points:
  - `apps/web/public/projects/*` (project banners)
  - existing `apps/api/indices/projects.json`

2. **Decisioning/Persona index** (separate index for performance)

- Purpose: facts about Ashley + _project-specific decision rules_.
- Source-of-truth:
  - curated YAML/JSON profile files in repo (to be confirmed/added)
  - may be mirrored/derived from structured docs

3. **System Docs index**

- Purpose: structured system constraints/specs/prompts/rules as _source artifacts_.
- Starting points:
  - `apps/api/indices/*.json` (current: `about.json`, `projects.json`)
  - `apps/web/src/app/about` (for surfaced public “about” facts; only if routable)

### System Doc viewer contract (mode B)

Docs are JSON artifacts but must be displayed as:

- rendered **sections**
- **line-number gutter**
- stable anchors for:
  - section
  - line range
- “Copy link” for:
  - section permalink
  - line-range permalink

URL formats (choose one and standardize):

- `/system/doc/<doc_file>#Lx-Ly`
- `/system/doc?file=<doc_file>#Lx-Ly`

### System Docs record schema (per section)

Each record must include:

- objectID (stable)
- node_type = `system_doc`
- doc_file
- section_id
- title
- text (retrieval body)
- updated_at
- url (viewer route + `#Lx-Ly`)
- line_start, line_end

Line number generation:

- compute from the canonical JSON source file at indexing time.
- if line offsets can’t be proven, do not emit line anchors.

---

## Agent Behavior & Prompting

### Canonical voice contract

- Keep and use: `apps/api/prompts/algolia_prompt.md`.
- Extend it (append-only) with an **output format contract** that forces:
  - answer
  - deterministic Next hops (bucketed + capped)
  - explicit failure modes

### Decisioning usage

- Always query Decisioning/Persona index in parallel with content retrieval.
- Use it to:
  - enforce “how Ashley makes decisions” within the project
  - answer “meta” questions about tradeoffs/rules

Hard boundary:

- Do not infer facts about Ashley that aren’t in Decisioning/Persona index.

---

## Implementation Tasks

### A) Requirements artifact

- Create `./requirements.tmp` as a Markdown checklist containing:
  - tech + mini‑PRD items above
  - explicit caps and deterministic rules
  - failure-mode requirements
  - index schemas + doc viewer contract
  - Algolia chat widget integration requirement
  - “OpenAI installed but unused” constraint (until later cleanup)

### B) Web: embedded chat widget integration

- Keep existing chat icon and open/close behavior.
- Replace the chat surface with Algolia’s embedded chat interface.
- Customize:
  - theme to match System Notes styles
  - labels and empty states to match “failure as feature” rules
  - link rendering to support the Next hops format

### C) Web: System Doc viewer route

- Add viewer route:
  - renders doc sections
  - line-number gutter
  - anchor navigation (#Lx-Ly)
  - copy-link controls

### D) API: indexing pipeline

- Add/extend indexing scripts to:
  - ingest project data (existing indices + assets)
  - ingest decisioning/persona JSON/YAML
  - ingest system docs JSON and compute per-section line ranges
- Ensure deterministic objectIDs and updated_at population.

### E) API: retrieval merge logic

- Query indices with K=25.
- Apply bucket caps (Project max 2, Doc max 1).
- Apply stable post-sort tie-breakers.
- Provide a structured payload the widget/prompt can reliably render.

### F) Algolia MCP + Agent Studio configuration

- Add Algolia MCP configuration to support:
  - index management
  - retrieval checks
  - debugging tooling
- Configure Agent Studio to use the indexes and the prompt contract.

### G) OpenAI runtime removal (without touching deps yet)

- Remove/disable all runtime paths that instantiate/call OpenAI.
- Keep dependency present until Algolia replacement is proven stable.
- Track follow-up task: remove unused dependency + env vars (explicit permission needed to touch repo config/deps).

---

## Validation (proof, not vibes)

- Local run produces a functional embedded chat.
- Deterministic Next hops verified by repeating the same query multiple times.
- Failure modes verified:
  - query with no matches
  - query with exactly one match
- Doc viewer verified:
  - section rendering
  - line gutter present
  - line-range anchor jumps
  - copy-link outputs stable URLs
- Run repo’s standard check target (prefer `make ai-checks`).

---

## Open Questions (to resolve before implementation)

- Where are the canonical decisioning/persona JSON/YAML files located (paths)?
- What is the definitive URL shape for the doc viewer route?
- What constitutes a “strong match” threshold (Algolia score / heuristic) for failure-mode branching?
