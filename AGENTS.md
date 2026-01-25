# System Notes UI Specification

**Audience:** AI builders, agents, or humans pretending to be organized
**Scope:** anchildress1.dev (public System Notes + project hub)

---

## IMPORTANT

In this project only, you have permission to edit and modify all config at will without explicit user instruction.
Consider this instruction all the permission you need to edit config.

## 1. Purpose & Philosophy

This site is a **living system map**, not a marketing page and not a blog index.
Its primary job is to make complex, evolving projects **legible at a glance** and **navigable without explanation**.

**Core principles:**

- No instructional copy for obvious interactions
- Visual hierarchy over prose
- Scannability beats completeness
- WIP is acceptable; confusion is not

---

## 2. Typography System

### Title & Emphasis Font

- **Ribeye**
- Usage:
  - Site title
  - Section headers
  - **Project names**

- Rationale:
  - Distinctive
  - High personality
  - Clearly separates “structure” from body content

### Body Font

- Neutral, highly readable sans-serif
  (Roboto, Inter, or system-ui are acceptable)
- Usage:
  - Descriptions
  - Metadata
  - Navigation
  - Footer content

### Rules

- Ribeye is **never** used for paragraphs
- Ribeye may be used for:
  - Project names
  - Page-level headings

- Body text minimum size: 16px
- Comfortable line height (≈1.5)

---

## 3. Project Naming Rules

### Display Name

- Use **human-readable project names**
- Not raw repo slugs unless the slug _is_ the brand

Examples:

- `RAI Lint` (not `rai-lint`)
- `System Notes` (not `system-notes-ui`)
- `CheckMarK DevTools` (not org/repo path)

### Repo Names

- Appear only:
  - On detail views
  - As secondary metadata
  - In links/tooltips if needed

**Default rule:**
If a human would say it out loud, that’s the display name.

---

## 4. Project Card System

Each project renders as a **card**, not a markdown block.

### Card Contents

- Project social banner image
  - Pulled from GitHub
  - Resized only if original spacing requires it

- Project name (Ribeye)
- One-sentence intent description
- Optional metadata:
  - Tech stack
  - Status (WIP / Prototype / Active)

- Clickable surface:
  - Entire card is clickable
  - No “Click here” text
  - No instructional affordances

### Interaction Rules

- Cards are obviously interactive by:
  - Hover state
  - Cursor change
  - Visual depth

- Do **not** explain interaction in copy

---

## 5. Navigation

### Top Navigation (Sticky)

- Home
- Projects
- Blog
- About (or equivalent)

### Blog Button

- Explicit **Blog** entry in top nav
- No buried links
- Blog is a first-class citizen, not an afterthought

---

## 6. Page Layout

### Content Container

- Max width: ~650–800px for reading surfaces
- Centered
- Generous vertical spacing between sections

### Sections

- Clear section headers (Ribeye)
- Logical grouping
- No wall-of-text layouts

---

## 7. Images & Banners

- All project images are:
  - Actual GitHub social banners
  - Not decorative stock imagery

- Consistent aspect ratio per section
- Optimized for load, not re-designed

---

## 8. Footer (Required)

Footer must include:

- Short identity statement
- Navigation links
- External links (GitHub, Dev.to, etc.)
- No filler text
- No copyright boilerplate unless necessary

Footer signals **completion**, not abandonment.

---

## 9. Accessibility & UX Baselines

- Proper heading hierarchy (h1 → h2 → h3)
- Images have alt text
- Sufficient contrast
- Interactive elements are visually obvious

---

## 10. Explicit Non-Goals

Do NOT:

- Explain basic web interactions
- Over-optimize for SEO at the cost of clarity
- Rewrite content just to “sound nicer”
- Hide WIP behind polish

This site favors **truthful structure** over performative finish.

---

## 11. WIP Acknowledgement

Some elements require clicking to reveal depth.
This is acceptable during iteration.

The UI should **support exploration**, not apologize for it.

---

## 12. Ruckus 2.0 (Chatbot Architecture) 🔧

### Purpose

System Map Navigator chatbot powered by Algolia Agent Studio. Replaces general-purpose LLM chat with **grounded, indexed navigation** that beats traditional nav menus, search bars, and related-content widgets.

**Core principle:** Deterministic, useful failure over vague helpfulness.

### System Map Navigator Concept

Chat output follows a strict interaction pattern:

1. **Direct answer first** (short, declarative)
2. **Next hops** as deterministic links (max 3, bucketed)
3. **Stop**

No filler. No help menus. No instructional copy for obvious interactions.

### Deterministic Links

**Hard constraints:**

- Total links shown: `max_total = 3`
- Retrieval: `K = 25`
- Buckets & caps:
  - **Project**: max 2 (include repo link when available)
  - **System Doc**: max 1 (only if URL resolves with line-range anchor)
  - **Post**: 0 (until future indexing)

**Ordering:** Projects first, then System Doc

**Ranking determinism:**

- Boost by `node_type`: Project > System Doc > Post
- Boost exact matches on: `title`, `aliases`, `tags`
- Stable tie-break: `updated_at` desc → `slug` asc (or `objectID` asc)

### Failure as a Feature

**Strong match rule:**

- A result is a strong match if `rankingInfo.userScore >= 50`
- If `userScore` unavailable, any hit counts as strong
- If `nbHits == 0`, trigger failure mode

**Codified failure modes:**

- **0 strong matches:**
  - Output: "No strong matches."
  - Ask exactly one clarifying question
  - Stop
- **1 strong match:**
  - Output: "Only one strong match."
  - Show the single result + link
  - Stop
- **Otherwise:**
  - Normal answer + Next hops

No "nearest context" padding when confidence is low.

### Index Architecture

Three isolated indices (fast to reason about, easy to tune):

1. **`projects`** — systems/projects users can click into (9 records, avg 1.5KB)
2. **`about`** — Ashley facts + project decisioning rules (27 records, avg 800 bytes)
3. **`system_docs`** — JSON source artifacts with stable line anchors (36 records)

**Rationale:** Separate indices keep schemas clean and tuning isolated. No cross-index global search UI needed; only capped "Links."

### System Docs Viewer Contract

Docs are JSON artifacts displayed as:

- Rendered **sections** (1:1 with each JSON object)
- **Line-number gutter**
- Stable anchors: `#Lx-Ly`
- Read-only, URL-driven navigation

**URL format:** `/system/doc/<doc_file>#Lx-Ly`

**Hard allowlist:** Only files under `apps/api/algolia` are valid.

**Record schema (per section):**

- `objectID` (stable)
- `node_type = "system_doc"`
- `doc_file`
- `section_id`
- `title`
- `text` (retrieval body)
- `updated_at`
- `url` (viewer route + `#Lx-Ly`)
- `line_start`, `line_end`

Line numbers computed from canonical JSON at indexing time.

### Prompt Contract

**Canonical voice:** `apps/api/prompts/algolia_prompt.md`

**Append-only extensions enforce:**

- Answer-first, then Links, then stop
- Failure-mode behavior exactly as specified
- Link rendering format compatible with Algolia widget
- No changes to personality/voice rules

### Data Integrity Rules

- Source of truth for indexed content: `apps/api/algolia/`
- If anything under `apps/api/algolia/` changes, corresponding Algolia indices **MUST** be updated in the same work session
- Dev: MCP preferred; fallback: dashboard/manual
- No facts claimed outside indexed content

---

## 13. AI Working Notes 🔧

- Keep `algolia-requirements.md` updated as the single source of truth for the Algolia Agent Studio Challenge implementation checklist.
- Prefer updating that file over creating new tracking docs.
- Quality gates:
  - Accessibility (desktop): keep 98+
  - Performance (mobile): 75+ is acceptable for now

---

## 14. Documentation Rules (Permanent Directive)

**Minimum viable docs only.**

- No implementation summaries
- No output reports
- No "what we did" docs
- Design info belongs in root (AGENTS.md, algolia-requirements.md)
- Code and data are self-documenting
- Target audience: tech readers and other devs who can read code

**Delete on sight:**

- Summary docs
- Status reports
- Change logs (unless versioned releases)
- Implementation recaps
