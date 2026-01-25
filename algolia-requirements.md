# Algolia Agent Studio Challenge — Tech Requirements + Demo PRD 🔧

This is the technical checklist for Ruckus 2.0 (System Notes chatbot).
This is not contest-admin tracking.

## Best Outcome (1-week constraints)

- [ ] Ship a **single consumer-facing chat experience** that beats nav/search/related widgets.
- [ ] Keep scope brutally small: deterministic links, explicit failure, fast retrieval.
- [ ] Accept "best effort" where the Algolia widget constrains us.

## Index Strategy (Pick One: do the simplest thing)

Chosen outcome: **3 small indices** (fast to reason about, easy to tune):

- [x] `projects` — systems/projects users can click into (9 records, avg 1.5KB)
- [x] `about` — Ashley facts + project decisioning rules (27 records, avg 800 bytes)
- [x] `system_docs` — JSON source artifacts with stable line anchors (36 records)

Rationale (pragmatic):

- Separate indices keep schemas clean and tuning isolated.
- We are not building cross-index global search UI; we only need capped "Links".

### Searchable Attributes (Normalized, Top-Level Only)

**`projects` index:**

- Tier 1: `title`
- Tier 2: `aliases`
- Tier 3: `tags`
- Tier 4: `display_name`
- Tier 5: `summary`

**`about` index:**

- Tier 1: `title`
- Tier 2: `aliases`
- Tier 3: `tags`
- Tier 4: `section`

**`data` object:** opaque (not searchable). If specific `data.*` keys need search, extract to top-level or create separate index.

## Chat Experience Requirements

- [x] Research: in-chat navigation UI (clickable quick-prompts that send a preloaded message to the chatbot).
- [x] Research: user personalization based on previous interactions or session context (e.g. "Welcome back, [Name]" or referencing prior topics).

- [ ] Keep existing chat icon behavior (open/close, placement).
- [x] Use Algolia embedded chat widget as the chat surface.
- [x] Customize widget styling to match System Notes.
- [x] Chat output supports the "System Map Navigator" interaction:
  - [x] Direct answer first (short, declarative).
  - [x] Then deterministic "Links" links.
  - [x] Then stop.

## Deterministic "Links" (Hard Rules)

- [x] Retrieval: `K=25`.
- [x] Total links shown: `max_total=3`.
- [x] Buckets and caps:
  - [x] **Project**: max 2
  - [x] **System Doc**: max 1
  - [x] **Post**: 0 (future indexing only)
- [x] Ordering:
  - [x] Projects first, then System Doc.
- [x] Ranking determinism:
  - [x] Boost by `node_type`: Project > System Doc > Post
  - [x] Boost exact matches on: `title`, `aliases`, `tags`
  - [x] Stable tie-break: `updated_at` desc, then `slug` asc (or `objectID` asc)

## Failure Is A Feature (Codified)

Strong match rule (short, no fluff):

- [x] A result is a strong match if `rankingInfo.userScore >= 50`.
- [x] If `userScore` is unavailable, any hit counts as strong.
- [x] If `nbHits == 0`, trigger failure mode.

Failure modes:

- [x] **0 strong matches**: output "No strong matches." Ask exactly one clarifying question. Stop.
- [x] **1 strong match**: output "Only one strong match." Show the single result. Stop.
- [x] Otherwise: normal answer + Links.

## Prompt Contract (Append-only)

- [x] Keep `apps/api/prompts/algolia_prompt.md` as the canonical voice spec.
- [x] Append an output-format contract section that forces:
  - [x] answer-first, then Links, then stop
  - [x] failure-mode behavior exactly as specified
  - [x] link rendering format compatible with the widget
- [x] Do not change the personality/voice rules.

## System Docs: Source Artifacts + Viewer

### Canonical sources

- [x] Canonical doc JSON files live under `apps/api/algolia/*`.
- [ ] Old versions under `apps/api/prompts/*` are legacy and removed later.

### Viewer URL contract

- [x] Doc viewer URL format: `/system/doc/<doc_file>#Lx-Ly`.
- [x] Hard allowlist: only files under `apps/api/algolia` are valid.

### Viewer UX (Mode B)

- [x] Viewer renders per-record sections (1:1 with each JSON object).
- [x] Viewer has line-number gutter.
- [x] Viewer supports anchors to `#Lx-Ly`.
- [x] Viewer is read-only (no click interaction, URL-driven only).

### Data source

- [x] Web app fetches doc data via an API endpoint (portable across deploy).

## Algolia Widget "Citations"

- [ ] Citations/snippets are allowed for now.
- [ ] Track future option: show title+link only (no snippet), if needed.

## MCP + Index Updates (Dev Only)

- [ ] Use Algolia MCP to update indices during development.
- [ ] If MCP fails, document fallback manual steps (dashboard) rather than blocking.
- [ ] No automation scripts required this week.

## Security / Privacy

- [x] No secrets committed.
- [x] If any auth/memory features require keys, they live in `.env` only.
- [x] Chat must not claim facts not present in `about`/`projects`/`system_docs`.
