Treat this file as authoritative. Where another instruction file disagrees, this one wins.

## Non-negotiables

- Build for the long term. No quick fixes, no compatibility kept "just in case".
- Delete scratch files written for local validation. Never commit them.
- Conventional Commits, with the RAI footer.
- `SECURITY_RULES.md` is mandatory policy for any change touching outbound fetches, file loading, or path resolution.

## Untrusted input

Remote content and user-supplied paths are hostile until proven otherwise.

- Follow only same-host, allowlisted URLs. Refuse redirects and credential-bearing hosts.
- Reject any path containing `..`; resolve to absolute and enforce sandbox containment before use.
- Allowlist served file types. Deny by default on any validation failure.
- Cap body size, URL count, concurrency, and timeout on every outbound fetch.

## URL state

InstantSearch owns index URL state. Components own their own selection.

- `searchRouting` serializes query and refinements. Nothing else writes search params.
- A selected note lives in local state and never reaches the URL.
- The selected note renders in the workspace reader. No overlay, no modal.
- Algolia `sendEvent` fires on selection. Never gate an event on URL state.
- Do not add `createURL` logic that fights InstantSearch's own routing.

## Colour

Every colour is declared in `src/app/globals.css`. Declare one nowhere else.

- One chromatic hue. There is no second one — not for a state, a warning, or an error.
- Neutrals stay near-achromatic.
- Never reintroduce rust, brick, terracotta, amber, mustard, or ochre. Each has shipped and been reverted, and each arrived through the same argument that **Keyline, never recolour** answers.
- Verify a new `oklch()` lands inside sRGB. Out-of-gamut values clip toward a hue nobody chose.
- Board swatch tokens are for the board. They do not travel.

### Gold is a marker, not an ink

- Gold is a **ground** under dark ink. It is never text on paper — it clears no contrast floor at any lightness that is still yellow.
- Emphasis on paper is carried by weight, not by hue.
- Compose the shared highlight class. Never re-implement the band.

### Keyline, never recolour

Gold is near-invisible on paper — not faint, invisible. A mark that must survive the light theme gains a keyline; its hue does not change.

- Rectangular fill: a hairline ring behind it.
- Drawn mark: `drop-shadow`, which traces the mask's own alpha so the hairline follows the stroke instead of boxing it.
- Focus ring: the outline plus a keyline behind it.

One rule covers both themes — on the dark ground the keyline composites away.

### Aliases and literals

- An alias token points at another token and never holds a literal of its own. Giving one a literal is how a second hue keeps coming back.
- Hardcoded hex is permitted only where a file cannot read a custom property: a document that replaces the page, a standalone SVG, and the browser-chrome values in `src/lib/theme.ts`. Each must be the sRGB rendering of the token it stands for.

### Editing a colour

- Change the token. Nothing else should need editing.
- If a second file needs the same edit, that file is wrong — delete its copy rather than syncing it.
- Comments recording a rejected colour are load-bearing. Keep them, in the past tense.

## Interaction primitives

`globals.css` owns every button, hover, and image treatment. A component sets its own footprint — padding, min-width, gap — and nothing more.

- Compose the primitive. Never restate shape, fill, hover, or disabled state.
- Grep for the primitive before adding any interactive style.
- Two button variants. A third is a link.
- Never write a `:hover` that sets a colour. A component may add motion on top of the shared hover; it may not add a second colour.
- The wash is for empty boxes. A filled control deepens instead — laying translucent gold over gold reads as a stain.
- Alpha tokens are **layers, not backgrounds**. Composite them over the fill; set flat, they replace it with a smear of whatever is behind.
- `composes` works only on a simple class selector. Anything else belongs in the JSX.

### Images

- One image treatment, site-wide. A second one is the defect, not the solution.
- The picture inside the print is part of the treatment: the shared rule owns fit, sizing, ratio and grade. A page supplies only the ratio's **value**, because the shape of a picture is a fact about the picture. A module that holds the mechanism will drift from it.
- A print must allow overflow and carry no mask. Either one clips the treatment away.
- Use `rotate`, never `transform`, for a tilt — an animation's `transform` replaces the element's own, so the tilt silently vanishes wherever an animation is also applied.
- Captions go under the print. Never overlay one and paint a gradient behind it to buy contrast.

### Focus and overflow

- **Never put `mask-image` on a focusable element.** A mask clips everything the element paints, `outline` and `box-shadow` included, so the focus ring computes and never reaches the screen. No automated check catches this — it only shows on a Tab key. Draw the masked fill on a `::before` beneath the element instead.
- The global focus rule covers the standard interactive elements. Do not override it per page. Add `:focus-visible` only for a container made focusable with `tabIndex`.
- A field drawn as a rule rather than a box opts out through its data attribute and thickens its own rule. Never through a per-component `outline: 0`.
- **Never clip content to hide overflow, and never pair a `min-width` with a clip.** That strands real content outside the viewport where nothing can scroll to it. The narrowest supported width is a real device and is also a wide one at 400% zoom. Clipping is for decorative overhang; real content reflows or it scrolls.
- Clipping on `body` propagates to the viewport: it stops sideways scrolling but still reports the overflow in `scrollWidth`, which is the number the mobile spec asserts on. Keep the clip on the content column.

### Marks

- Drawn marks are SVG masks held in custom properties, so the colour stays a variable. Add a shape, not a pre-coloured image.
- A pre-inked mark must match its token exactly.
- Nothing decorative is a plain rectangle or a 1px rule.

## Page heads

- A page head is the head class plus an `h1`. Nothing else.
- No kicker, slug, eyebrow, or label row above an `h1`, under any name.
- The tick marks the **site** — the header wordmark and the footer byline. It never marks a section. It is declared once and composed; two declarations of it drifted four ways before.
- Two heading scales, both named. Do not add a third.
- The turn of a headline is a `<span>`, marked and italic. Do not tint it.
- Facts belong with the page's other facts. Never delete content in order to delete a wrapper.

## Tests

- **Assert logic and structure, never colour.** No hex, `oklch()`, lightness, or contrast ratio mirrored from CSS into a test file. A mirrored value makes every colour change a two-file edit and drifts silently — the guard then passes while asserting a number the stylesheet abandoned.
- Assert the _shape_ of a style contract, not its value. Which tone a token resolves to is the stylesheet's business.
- Contrast and colour accessibility are enforced against the rendered page, by axe and the Lighthouse gate. Never re-derive them arithmetically in a unit test. Measuring a **computed** style in the browser is not the same thing and is the right tool where axe has no rule.
- Mobile axe scans only what the viewport changes; markup does not reflow, so a second full scan restates the answer. A rule named in `withRules` reports nothing when it did not run — assert the rule ran before asserting no violations.
- **Stub every third-party endpoint at the network boundary, analytics included.** Narrowing a route to one path leaves the others live: an unstubbed host means the suite is talking to a real provider and the behaviour it was meant to prove is unverified.
- Coverage floors are enforced in `vitest.config.ts` and measured over every module, not only the files a test imported. Raise them when coverage rises; never lower one to make a run pass.
- Every component and utility ships positive, negative, and edge-case tests.
- Page composition is excluded from coverage. Cover cross-page behaviour with E2E.
- One worker, zero retries. A retry turns a flake into a pass and hides it — fix the test.
- Each browser project owns a slice of the suite, so a check runs on the engine that can answer it and nowhere else. A new spec must be assigned, or it runs on the default engine alone.

## Validation

- Lefthook pre-push runs unit tests, `gitleaks`, and Lighthouse. It does not run E2E, SonarCloud, or Semgrep.
- Let pre-push run once. Add only the checks it omits.
- Run SonarCloud and Semgrep explicitly for security, scanner, or repository-wide review work.
- `strict: true` is enforced. Do not weaken it, and do not add `@ts-ignore` without a justifying comment.

## Performance

- Accessibility, best-practices and SEO gate at 100%. They are deterministic given the same DOM, so a drop is a real regression.
- Performance is the only timing-dependent category and so the only one carrying headroom. A perfect-score gate measures the runner, not the code.
- **Never lower a performance floor to make a run pass.** A floor that moves carries the measurement, the reason, and the condition for restoring it — and is restored.
- Lighthouse runs the desktop profile only. Mobile layout and target sizes are asserted directly in the mobile spec, in pixels, rather than inferred from a score.
- A floor already attempted and reverted stays reverted until the bytes behind it are actually shed. Read the recorded measurement before trying again.
- An audit is skipped only when the harness, not the code, is what fails it. Say which.
- Defer browser-only, below-the-fold work with `next/dynamic` or `IntersectionObserver`.
- Prefer the smallest stylesheet that does the job.
- Test-only switches that disable network work exist for test and perf runs. Never set one in a real environment.

## API

- The blog search route is **GET only**.
- It aggregates an external sitemap, extracts structured data, caches in memory, and clamps its own limits.
- Sitemap and post HTML are untrusted. Apply the untrusted-input rules above and `SECURITY_RULES.md`.

## Conventions

- Validate Algolia credentials through `@/lib/algolia.ts`, not an inline regex.
- Every icon comes from `react-icons`. Never hand-draw an SVG icon, and never use a Unicode character as one — a glyph renders as whatever the reader's font stack has, which is not a decision this repo gets to make.
- Do not add documentation unless asked. Where docs are written for people, they may have a voice.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
