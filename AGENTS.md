# AGENTS.md

Canonical instruction source for this repository. Treat this file as authoritative.

## Scope

- Apply these rules when changing code in this repo.
- If a local instruction file conflicts with this file, prefer this file.

## Non-Negotiable Constraints

### Code Quality Standards

- Goal is long-term maintainable and reliable solutions only.
- Do not implement quick fixes in this codebase for any reason.
- Any test files introduced for local validation must be removed, not committed.

### Security: untrusted input and path handling

- If changes touch outbound fetches, file loading, or path resolution, apply `SECURITY_RULES.md` as mandatory policy.
- Required invariants:
  - Treat remote content (e.g. the blog sitemap) as untrusted; only follow same-host, allowlisted URLs (SSRF guard).
  - Reject any user-controlled path input containing `..`; resolve to absolute paths and enforce sandbox-root containment before use.
  - Allowlist served file types to `.md`, `.json`, `.txt`; default to deny on validation failure.

### Commit format (when committing is requested)

- Use Conventional Commits.
- Include required RAI footer.

## URL State Architecture: Notes Index

### Core rule: InstantSearch owns index state; the workspace owns the selected note

`/notes` is the searchable index. InstantSearch serializes query and facets through
`searchRouting`; `IndexWorkspace` keeps its selected note in local state and fires the
Algolia click event when that selection changes. Neither writes a note selection to the URL.

`/` is the intake. Its question and one-turn agent result are local; a settled brief may
survive within the current browser session.

### Implementation contracts

| Component                   | Responsibility                                     | Writes to URL       |
| --------------------------- | -------------------------------------------------- | ------------------- |
| `IndexWorkspace.selectNote` | Select reader content; send Algolia click event    | No                  |
| `searchRouting`             | Serialize query and refinements                    | Search params       |
| Facet widgets               | Refine through InstantSearch hooks                 | Via `searchRouting` |
| `ProjectDirectory.select`   | Select an exhibit and replace `system` query state | `system` only       |

### Rules for future changes

- Do not write selected-note state to the URL. InstantSearch manages index URL state.
- Do not introduce an index overlay or modal. The selected note renders in the workspace reader.
- Algolia events (`sendEvent`) fire when a note is selected. Never gate events on URL state.
- Do not add custom `createURL` logic that fights InstantSearch's default routing behavior.

## Color System

Every color in this repo is declared in `src/app/globals.css`. Declare one nowhere else.

### The single hue

- Chromatic tokens are `oklch(L C 92)`. Hue 92, no exceptions.
- Neutrals are hue 265 at chroma ≤ 0.02, or hue 90 at chroma ≤ 0.012.
- There is no second chromatic hue — not for a second pen, a section marker, a state, a warning, or an error.
- Never add rust, brick, terracotta, vermilion, safety-orange, amber, mustard, or ochre. Each has shipped and been reverted. They arrive through one argument — "the gold is not legible here" — which **Keyline, never recolour** answers instead.
- Verify a new `oklch()` renders inside sRGB before shipping it. Out-of-gamut values are clipped by the browser toward a hue you did not choose: `oklch(0.78 0.19 86)` clipped to `#edab00`, hue 76, an orange.

### Token contracts

| Token                        | Resolves to                                 | Use for                                                          | Never                        |
| ---------------------------- | ------------------------------------------- | ---------------------------------------------------------------- | ---------------------------- |
| `--mark`                     | `oklch(0.86 0.17 92)`                       | Any filled ground: highlight bands, buttons, tiles, bars         | Text color on paper — 1.41:1 |
| `--mark-ink`                 | `oklch(0.22 0.045 92)`                      | Text sitting on `--mark`                                         | A page background            |
| `--ink-accent`               | `var(--mark)` dark, `var(--mark-ink)` light | Accent-as-ink: fine print, hover, borders, focus, `accent-color` | Holding a literal of its own |
| `--tile-keyline`             | Theme-specific near-black                   | The hairline that makes gold legible on paper                    | Carrying a fill              |
| `--k-decision` … `--k-award` | Board swatches                              | Index board tiles and filter chips                               | Any use outside the board    |

- `--ink-accent` is an **alias**. It points at `--mark` or `--mark-ink` and never holds a value. Giving it a literal is how the light theme got mustard, then brick.
- Both attempts at a light `--ink-accent` literal are on record in the token comments: `oklch(0.38 0.07 70)` and `oklch(0.4 0.15 38)`. Do not reintroduce the pattern.

### Yellow is a marker, not an ink

- Use gold as a **ground** under `--mark-ink`: 11.29:1 on either theme.
- Never set body text, labels, numerals, or headings in gold on paper. It does not clear 4.5:1 at any lightness that is still yellow.
- Emphasis on paper is carried by weight against `--soft` and `--mute` — not by hue.
- Compose the global `marked` class for highlighting (`composes: marked from global;` in a module, `class="marked"` in JSX). Never re-implement the band.

### Keyline, never recolour

Gold is 1.41:1 against paper — invisible, not faint. When a gold mark must survive the light theme, add `--tile-keyline`; do not swap its hue.

| Shape                            | Mechanism                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Rectangular fill (tile, chip)    | `box-shadow: 0 0 0 1px var(--tile-keyline)`                                    |
| Masked/drawn mark (brush stroke) | `filter: drop-shadow(0 0 0.5px var(--tile-keyline))`, applied twice            |
| Focus ring                       | `outline: 2px solid var(--mark)` + `box-shadow: 0 0 0 5px var(--tile-keyline)` |

`drop-shadow` traces the alpha the mask leaves behind, so the hairline follows the brush's own edge instead of boxing it. One rule covers both themes: on graphite the keyline composites into the ground and disappears.

### Interaction primitives — compose, never re-declare

`globals.css` owns every button and every hover. A component may set its own footprint (padding, min-width, gap); it may not restate shape, fill, hover, or disabled state.

| Primitive                         | For                                            | How                                                          |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `.btn` + `data-variant="filled"`  | The one action on a screen                     | `composes: btn from global;` + the attribute in JSX          |
| `.btn` + `data-variant="outline"` | Every other control, icon buttons included     | same                                                         |
| `.marked-hover`                   | A text link — a WORD                           | `composes:` on a simple class, or `className="marked-hover"` |
| `.washed`                         | A row: option, record, rail entry              | same                                                         |
| `.marked-link`                    | A link carrying a permanent gold stroke        | `composes: marked-link from global;`                         |
| `.marked`                         | Highlighted text                               | `composes: marked from global;`                              |
| `.marked-soft`                    | A marked fact that must not outshout an action | `composes: marked-soft from global;`                         |
| `.taped`                          | An image — a print laid on the page            | `composes: taped from global;`                               |

- **Never write a `:hover` rule that sets a colour.** Hover is `--mark-soft` — the swipe band on a word, the wash on a row. A component may add motion (a step, a transform) on top; it may not add a second colour.
- **The wash is for empty boxes only.** A filled button is already the gold; laying 16% gold over it reads as a stain. Filled hover deepens instead, by adding `--mark-drag` as one more gradient layer.
- `--mark-drag` and `--mark-soft` carry alpha and are **layers, not backgrounds**. Set as a flat `background` they replace the gold with a translucent smear of whatever is behind it. Composite them: `linear-gradient(var(--mark-drag), var(--mark-drag))` over `background-color: var(--mark)`.
- **Never put `mask-image` on a focusable element.** A mask clips everything the element paints, `outline` and `box-shadow` included, so it silently deletes the focus ring — `:focus-visible` still matches and the outline still computes, it just never reaches the screen. No automated check catches this; it only shows on a Tab key. Draw the masked fill on a `::before` with `z-index: -1` under `isolation: isolate`, and leave the element itself unmasked.
- There is no third button variant. If something needs one, it is a link.
- `.taped` is a mat, a two-stop shadow, half a degree of tilt and two torn tape strips on opposite corners. **Every image on the site uses it — there is no per-page image styling.** Adding a second image treatment is the defect, not the solution.
- A taped element must allow overflow (**`overflow: hidden` clips the tape off**) and must not carry `mask-image` (a mask clips the shadow away — the same trap as the focus ring below). If an image seems to need either, the image is being styled per page; fix that instead of adding an exception.
- **The picture inside the print is part of the treatment too.** `.taped img` owns `object-fit`, sizing and the grade; a page supplies only `--print-ratio`, because the shape of a picture is a fact about the picture. Both images once composed `.taped` and still diverged three ways underneath it — `contain` vs `cover`, a grade on one of them, and the aspect ratio declared in two different places.
- **Use `rotate`, never `transform`, for the tilt.** An animation's `transform` REPLACES the element's own, so the portrait — which also carries `.drift` — silently lost its tilt while the exhibit kept it. `rotate` is an independent property and composes with any transform an animation applies.
- A caption goes UNDER the print, styled by `.taped figcaption`. Never overlay a caption on a picture and paint a gradient behind it to buy contrast — that gradient is what made the portrait look un-tapeable.
- **Never clip content to hide overflow, and never pair a `min-width` with a clip.** `body` held `min-width: 20rem` while its `overflow-x: clip` propagated to the viewport, so below 320px the page stayed 320px wide, the surplus sat outside the viewport, and `scrollX` could not leave 0 — that content was unreachable, not merely off screen. 280px is a real device and is also 1280px at 400% zoom (WCAG 1.4.10). Clipping belongs to decorative overhang only; real content reflows or it scrolls.
- `main` carries `overflow-x: clip` globally, and anything that hangs past its column depends on it. `body`'s `overflow-x: clip` is not enough: it **propagates to the viewport**, which stops sideways scrolling but leaves `documentElement.scrollWidth` reporting the overflow — and that number is what `tests/e2e/mobile.spec.ts` asserts on.
- `composes` only works on a **simple class selector**. `.links a` or `.categoryList button` will fail the build — put the global class in the JSX instead.
- Before adding any interactive style, grep for the primitive. The rule this replaced was eight hover treatments and three button declarations across nine files, two of them byte-identical.

### Marks and strokes

- Drawn marks are SVG **masks** in custom properties (`--stroke-brush`, `--stroke-brush-y`, `--stroke-swipe`), so the color stays a variable. Add a shape, not a pre-colored image.
- `--stroke-brush-inked` is the one pre-inked exception; `#f9cc21` in it must equal `--mark` exactly.
- Nothing decorative is a plain rectangle or a 1px rule. Marks are drawn strokes.

### Hardcoded hex

Permitted in exactly three files, because none can read a custom property:

| File                              | Why                                      |
| --------------------------------- | ---------------------------------------- |
| `src/app/global-error.module.css` | Replaces the whole document              |
| `src/app/icon.svg`                | Standalone document                      |
| `src/lib/theme.ts`                | Browser chrome cannot read CSS variables |

Each value must be the sRGB rendering of the token it stands for. `--mark` is `#f9cc21`; `--mark-ink` is `#221a00`; `--void` is `#0b0c0f` dark and `#f7f6f2` light (`THEME_COLORS` in `src/lib/theme.ts`).

### Focus rings

- The global rule in `globals.css` covers `a, button, input, textarea, summary`. Do not add a per-page override for elements it already matches — one did, and the exhibits route was the only one whose ring did not match the site.
- **An input drawn as a rule rather than a box opts out with `data-focus="ruled"`** and thickens its own rule instead. The intake field and the search pill are deliberately chrome-less, so a 2px ring plus a 5px keyline draws exactly the box they exist not to have. Still compliant: WCAG 2.4.11 asks for an area of at least a 4px line along the component's **shortest** side, and the shortest side of either field is its height — a 2px rule across a far longer width clears it, at well over 3:1 between states. Opt out through the attribute; never with a per-component `outline: 0`, which is what silently regressed when both were removed.
- Add a `:focus-visible` rule only for a container made focusable with `tabIndex` (`.reader`, `.boardTiles`).

### When editing a color

- Change the token in `globals.css`. Nothing else should need editing.
- If a second file needs the same edit, that file is wrong — delete its copy rather than syncing it.
- Comments explaining a rejected color are load-bearing history. Keep them; state rejected colors in the past tense.

## Page Heads

- A page head is `.page-head` + `h1` (or `.page-head-title`). Nothing else.
- There is no kicker, slug, eyebrow, or label row above an `h1`. `.page-head-slug` existed, carried the site's only tick mark on five routes, and is deleted — do not reintroduce it under any name.
- The tick mark lives once, in `SiteHeader` as `.wordmark::before`, beside the name. It marks the site, not a section.
- Two heading scales, both named: default is a page name; `data-scale="compact"` is for a head sharing the fold with a working tool or a title that can run long. Do not add a third clamp.
- The turn of a headline is `<span>`, which is marked and italic. Do not tint it.
- Facts that were in a slug belong with the page's other facts — the index pulse moved under the `h1`, the note category into the metadata `<dl>`. Never delete content to delete a wrapper.

## Test Standards

- **Tests assert logic and structure, never color.** No hex, `oklch()`, lightness number, or contrast ratio mirrored from CSS into a `.ts` or `.test.ts` file. A mirrored value makes every color change a two-file edit and drifts silently when only one is updated — `SWATCH_TOKEN_LIGHTNESS` claimed `--k-decision` was 93 on paper long after `globals.css` set it to 28, and the guard built on it passed the whole time.
- Assert the _shape_ of a style contract, not its value: `SWATCH_PALETTE` entries match `/^var\(--[\w-]+\)$/` because a literal cannot follow a theme. Which tone the token resolves to is `globals.css`'s business.
- Contrast and color accessibility are enforced against the rendered page — axe in `tests/e2e/theme.spec.ts` across all four routes in both themes, plus the Lighthouse accessibility gate. Never re-derive them arithmetically in a unit test.
- **Mobile axe runs only on what the viewport changes.** `tests/e2e/mobile.spec.ts` scans `target-size` and `meta-viewport` and nothing else: the rest of what axe checks is markup, and markup does not reflow, so a second full scan would report every violation twice. Reflow itself (WCAG 1.4.10) is asserted in pixels there, because axe has no rule for it. A rule named in `withRules` reports nothing when it did not run — assert the rule id appears in the results before asserting no violations, or the check is green without measuring anything.
- **Coverage thresholds**: 97% lines, 95% functions/statements, 90% branches (enforced by `vitest.config.ts`), measured over every module in `src/` and every project-owned script in `scripts/` rather than only the files a test happened to import. Floors sit under actual so a regression trips them; do not lower them to make a run pass.
- Every new component or utility must ship with positive, negative, and edge-case tests.
- Page composition is excluded from coverage; test cross-page behavior via E2E instead.
- Playwright runs one worker with zero retries, everywhere. A retry turns a flake into a pass and hides it; fix the test instead.
- Each browser project owns a slice of the suite, so a check runs on the engine that can answer it and nowhere else: Chromium runs everything except `mobile.spec.ts` and `cross-browser.spec.ts`; WebKit runs `cross-browser.spec.ts`; the two phone projects run `mobile.spec.ts`. Adding a spec means deciding which engine it belongs to — an unassigned file runs on Chromium alone.

## Validation

- Lefthook pre-push runs unit tests, `gitleaks`, and Lighthouse; it does not run E2E, SonarCloud, or Semgrep.
- Let pre-push execute once. Run only task-required checks it omits before pushing.
- Run SonarCloud and Semgrep explicitly for security, scanner, or repository-wide review work.

## TypeScript Strictness

- `strict: true` is enforced in `tsconfig.json`. Run `make typecheck` to verify.
- Do not weaken strict settings or add `// @ts-ignore` without a justifying comment.

## Performance / Lighthouse

- **Targets** (enforced pre-push via the lefthook `performance` step → `make test-perf`):
  - **accessibility, best-practices, SEO: 100%.** These are deterministic given the same DOM,
    so the gate sits exactly at the observed score — a drop is a real regression.
  - **performance: 98%.** Performance is the only timing-dependent category, so it is the only
    one carrying headroom. It sat at `minScore: 1` and failed CI at 0.99 on a slightly slower
    runner while scoring 100 locally and on a re-run of the same commit; a perfect-score gate
    measures the runner, not the code.
  - Lighthouse runs the desktop profile only. Mobile layout and target sizes are asserted in
    `tests/e2e/mobile.spec.ts`, which measures them directly rather than through a score.
- `errors-in-console` is **enforced**, and the audited routes are `/`, `/projects`, and `/about`. `/notes` is off that list because the dummy Algolia credentials the harness runs on make it log unreachable-host errors that are a test artifact rather than a defect — the console gate and that route cannot both be had. `uses-http2` stays skipped for the same kind of reason.
- Server-side index calls are switched off for both browser and Lighthouse runs with `INDEX_PULSE_DISABLED=true`, set in the `test-e2e` and `test-perf` Make targets. It exists so a run does not spend the pulse's 3s deadline against a host that is not there; never set it in a real environment.
- Defer browser-only, below-the-fold features with `next/dynamic` or `IntersectionObserver` (for example, `IntakeBriefLoader.tsx`).
- Prefer `instantsearch.css/themes/reset.css` over `satellite.css` to minimize CSS payload.

## API Design

- **Route**: `src/app/api/blog/search/route.ts` — a Next.js route handler, **GET only**.
- **Behavior**: aggregates DEV blog posts from an external sitemap, extracts JSON-LD, caches results in memory (15 min; 60s when empty), and filters by `q`/`tag` with a clamped `limit` (1–50, default 3).
- **Untrusted input**: the sitemap and post HTML are untrusted. Accept only credential-free URLs on the sitemap's exact origin under `/posts/`; refuse redirects; cap sitemap/post bodies at 1 MB/2 MB, URLs at 50, concurrency at five, and requests at 10 seconds. See `SECURITY_RULES.md`.

## Shared Utilities

- **`@/lib/algolia.ts`**: Credential validation (`hasValidAlgoliaCredentials`, `isValidAppId`, `isValidApiKey`). Use instead of inline regex checks.
- **Icon libraries**: Use `react-icons` for all icons (UI and brand). Prefer `react-icons/fa`, `react-icons/io5`, `react-icons/si`, etc.

## Documentation

- Do not add docs to project unless specifically asked
- Aim for witty, humorous tone in docs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
