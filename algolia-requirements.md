# Algolia Agent Studio Challenge — Tech Requirements + Demo PRD 🔧

This is the technical checklist for Ruckus 2.0 (System Notes chatbot).
This is not contest-admin tracking.

## Best Outcome (1-week constraints)

- [ ] Ship a **single consumer-facing chat experience** that beats nav/search/related widgets.
- [ ] Keep scope brutally small: deterministic links, explicit failure, fast retrieval.
- [ ] Accept “best effort” where the Algolia widget constrains us.

## Index Strategy (Pick One: do the simplest thing)

Chosen outcome: **3 small indices** (fast to reason about, easy to tune):

- [x] `projects` — systems/projects users can click into (9 records, avg 1.5KB)
- [x] `about` — Ashley facts + project decisioning rules (27 records, avg 800 bytes)
- [ ] `system_docs` — JSON source artifacts with stable line anchors (future)

Rationale (pragmatic):

- Separate indices keep schemas clean and tuning isolated.
- We are not building cross-index global search UI; we only need capped “Next hops”.

## Chat Experience Requirements

- [ ] Keep existing chat icon behavior (open/close, placement).
- [ ] Use Algolia embedded chat widget as the chat surface.
- [ ] Customize widget styling to match System Notes.
- [ ] Chat output supports the “System Map Navigator” interaction:
  - [ ] Direct answer first (short, declarative).
  - [ ] Then deterministic “Next hops” links.
  - [ ] Then stop.

## Deterministic “Next hops” (Hard Rules)

- [ ] Retrieval: `K=25`.
- [ ] Total links shown: `max_total=3`.
- [ ] Buckets and caps:
  - [ ] **Project**: max 2
  - [ ] **System Doc**: max 1
  - [ ] **Post**: 0 (future indexing only)
- [ ] Ordering:
  - [ ] Projects first, then System Doc.
- [ ] Ranking determinism:
  - [ ] Boost by `node_type`: Project > System Doc > Post
  - [ ] Boost exact matches on: `title`, `aliases`, `tags`
  - [ ] Stable tie-break: `updated_at` desc, then `slug` asc (or `objectID` asc)

## Failure Is A Feature (Codified)

Strong match rule (short, no fluff):

- [ ] A result is a strong match if `rankingInfo.userScore >= 50`.
- [ ] If `userScore` is unavailable, any hit counts as strong.
- [ ] If `nbHits == 0`, trigger failure mode.

Failure modes:

- [ ] **0 strong matches**: output “No strong matches.” Ask exactly one clarifying question. Stop.
- [ ] **1 strong match**: output “Only one strong match.” Show the single result. Stop.
- [ ] Otherwise: normal answer + Next hops.

## Prompt Contract (Append-only)

- [ ] Keep `apps/api/prompts/algolia_prompt.md` as the canonical voice spec.
- [ ] Append an output-format contract section that forces:
  - [ ] answer-first, then Next hops, then stop
  - [ ] failure-mode behavior exactly as specified
  - [ ] link rendering format compatible with the widget
- [ ] Do not change the personality/voice rules.

## System Docs: Source Artifacts + Viewer

### Canonical sources

- [ ] Canonical doc JSON files live under `apps/api/indices/*`.
- [ ] Old versions under `apps/api/prompts/*` are legacy and removed later.

### Viewer URL contract

- [ ] Doc viewer URL format: `/system/doc/<doc_file>#Lx-Ly`.
- [ ] Hard allowlist: only files under `apps/api/indices` are valid.

### Viewer UX (Mode B)

- [ ] Viewer renders per-record sections (1:1 with each JSON object).
- [ ] Viewer has line-number gutter.
- [ ] Viewer supports anchors to `#Lx-Ly`.
- [ ] Viewer supports “copy link” for a section/line-range.

### Data source

- [ ] Web app fetches doc data via an API endpoint (portable across deploy).

## Algolia Widget “Citations”

- [ ] Citations/snippets are allowed for now.
- [ ] Track future option: show title+link only (no snippet), if needed.

## MCP + Index Updates (Dev Only)

- [ ] Use Algolia MCP to update indices during development.
- [ ] If MCP fails, document fallback manual steps (dashboard) rather than blocking.
- [ ] No automation scripts required this week.

## Security / Privacy

- [ ] No secrets committed.
- [ ] If any auth/memory features require keys, they live in `.env` only.
- [ ] Chat must not claim facts not present in `about`/`projects`/`system_docs`.
