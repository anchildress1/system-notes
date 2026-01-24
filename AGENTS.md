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

## 12. AI Working Notes 🔧

- Keep `algolia-requirements.md` updated as the single source of truth for the Algolia Agent Studio Challenge implementation checklist.
- Prefer updating that file over creating new tracking docs.
