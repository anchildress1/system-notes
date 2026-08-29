Authoritative where any other instruction file disagrees. Everything here is something
scanning the repo will not tell you.

## What this repo will not accept

- No quick fixes, and no compatibility kept "just in case".
- **No backward compatibility, ever.** Nothing links to this site from anywhere outside it. A route that moves or dies just 404s — never add a redirect, alias, or shim, and delete the tests that guarded the old path in the same commit.
- Dead code goes, and its tests go with it. Passing tests are not evidence a thing is used; check for a caller.
- Do not commit scratch files written for local validation.
- Do not add documentation unless asked.

## Failure modes nothing will catch

Each of these has shipped. All of them pass review, typecheck, lint, and CI.

- **`mask-image` on a focusable element deletes its focus ring.** A mask clips everything the element paints, `outline` and `box-shadow` included. `:focus-visible` still matches and the ring still computes — it just never reaches the screen, and only a Tab key reveals it. Put the masked fill on a `::before` beneath the element and leave the element unmasked.
- **`overflow-x: clip` on `body` propagates to the viewport.** Sideways scrolling stops, but `scrollWidth` still reports the overflow. Paired with a `min-width` it strands real content where nothing can scroll to it. Clip the content column instead, and never clip to hide content that is real.
- **An animation's `transform` replaces the element's own.** A tilt set with `transform` silently vanishes wherever an animation also applies one. Use `rotate`; it composes.
- **Alpha tokens are layers, not backgrounds.** Set as a flat `background` they replace the fill with a translucent smear of whatever sits behind it. Composite them over the fill.
- **`composes` works only on a simple class selector.** A descendant or element selector fails the build — put the global class in the JSX.
- **An out-of-gamut `oklch()` is clipped toward a hue nobody chose.** Verify a new value lands inside sRGB before shipping it.
- **An accessibility rule named in `withRules` reports nothing when it did not run.** Assert the rule ran before asserting no violations, or the check is green without measuring anything.

## Settled decisions

Each was tried and reverted. Re-opening one costs a pass and lands back here.

- **One chromatic hue.** No second hue for a state, a warning, an error, or for "the gold is not legible here" — that case gets a keyline, never a recolour. Rust, brick, terracotta, amber, mustard and ochre have each shipped and been reverted.
- **Gold is a ground, never an ink on paper.** It clears no contrast floor at any lightness that is still yellow. Emphasis on paper is carried by weight, not hue.
- **An alias token never holds a literal.** Giving one its own value is how the second hue keeps coming back.
- **Two button variants.** If something needs a third, it is a link.
- **One image treatment, site-wide.** A second is the defect, not the solution. The shared rule owns fit, sizing, ratio and grade; a page supplies only the ratio's value, because the shape of a picture is a fact about the picture.
- **A selected note never reaches the URL,** and never opens in an overlay or a modal. It renders in the workspace reader.
- **No kicker, slug, eyebrow, or label row above an `h1`,** under any name.
- **The tick marks the site** — the header wordmark and the footer byline. It never marks a section.

## Rejected colours

Every value below shipped and was reverted. This section is the entire record; the stylesheets no longer carry it. Do not reintroduce one, and do not derive a "better" version of it — an illegible gold gets a keyline, never a new hue.

| Value                 | Held                         | Why it went                                                                                                                              |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Hue arc 25–96         | The palette's range          | A range admits its own ends: it is what let rust in at hue 40 and brick in at 38. One hue cannot.                                        |
| `oklch(0.66 0.19 42)` | A second pen                 | Safety-orange.                                                                                                                           |
| `oklch(0.55 0.14 40)` | A second pen                 | Rust, however it was labelled.                                                                                                           |
| `oklch(0.38 0.07 70)` | Light `--ink-accent` literal | Dark mustard.                                                                                                                            |
| `oklch(0.4 0.15 38)`  | Light `--ink-accent` literal | Brick, and it put three red numerals down the left of every answer, card label and focus ring.                                           |
| `oklch(0.78 0.19 86)` | `--mark-drag`                | Hue 92 has no chroma 0.19 at that lightness, so the browser clipped it to `#edab00` — hue 76, an orange, painted down every marked line. |
| `oklch(0.93 0.12 97)` | `--mark-lift`                | Off-hue for the same reason. L 0.91 buys the same colour on hue 92.                                                                      |

The measurements behind the rules, so none of them reads as taste:

- Gold on paper is 1.41:1 — invisible, not faint.
- Yellow as ink is 1.74:1 at L 0.80 and clears 4.5:1 only at L 0.55, by which point chroma has collapsed to 0.12 and it is olive. Yellow's character is its lightness, so darkening it to pass contrast destroys it.
- `--mark-ink` on `--mark` is 11.34:1 on either theme. Gold as ink on graphite is 12.74:1, which is why the accent alias points at the mark there and at the mark's ink on paper.

## Rules whose reason is not visible in the code

- Colour is declared in exactly one stylesheet. If a second file needs the same colour edit, that file is wrong — delete its copy rather than syncing it.
- Hardcoded hex is permitted only where a file cannot read a custom property, and must be the sRGB rendering of the token it stands for.
- Rejected colours are recorded once, in **Rejected colours** above. Stylesheets carry the rule, never the archaeology.
- Compose the interaction primitives; never restate shape, fill, hover, or disabled state. Grep for the primitive before writing any interactive style.
- Never write a `:hover` that sets a colour. A component may add motion on top of the shared hover.
- Drawn marks are SVG masks held in custom properties, so the colour stays a variable. Add a shape, not a pre-coloured image. Nothing decorative is a rectangle or a 1px rule.
- Do not override the global focus rule per page. A field drawn as a rule rather than a box opts out through its data attribute — never through a per-component `outline: 0`.
- **Tests assert logic and structure, never colour.** A value mirrored from CSS into a test drifts silently, and the guard then passes while asserting a number the stylesheet abandoned. Contrast is enforced against the rendered page; never re-derive it arithmetically in a unit test. Reading a _computed_ style in a real browser is a different thing, and is the right tool where the accessibility scanner has no rule.
- **Stub every third-party endpoint at the network boundary, analytics included.** Narrowing a route to one path leaves the others live: the suite then talks to a real provider, and the behaviour it was meant to prove goes unverified.
- Never lower a coverage or performance floor to make a run pass. A floor that moves carries its measurement, its reason, and the condition for restoring it.
- A floor already attempted and reverted stays reverted until the bytes behind it are actually shed. Read the recorded measurement before trying again.
- Lighthouse gates two profiles: desktop at 98 over `/`, `/projects`, `/about`, and mobile at 92 over those three plus `/notes`. Mobile layout and target sizes are still measured in pixels in the mobile spec; a score is not a substitute for either.
- Mobile floors sit at 92 because the ceiling is 0.96. LCP is bound by ~187 KB of framework JS under a 4× CPU multiplier, and the two routes whose LCP element is an image run ~300ms behind the two whose LCP element is text. Preload, eager loading and `fetchPriority` were each measured on those images: every one traded load delay for render delay and left LCP unmoved.
- The mobile profile exempts `/notes` from `best-practices` and `errors-in-console` through `assertMatrix`. The harness authenticates with fake Algolia credentials, so the browser logs `ERR_NAME_NOT_RESOLVED`; no application change can prevent it. Every other route asserts both at a perfect score.
- Run counts are evidence, not taste. Mobile uses 5 because a median of 3 drawn from the observed `/about` distribution lands under the floor about one run in seven.
- Only accessibility, best-practices and SEO gate at a perfect score; they are deterministic. Performance is timing-dependent, so a perfect-score gate there measures the runner rather than the code.
- Mobile accessibility scans cover only what the viewport changes. Markup does not reflow, so a second full scan restates the answer.
- Each browser project owns a slice of the suite. A new spec must be assigned to the engine that can answer it, or it runs on the default engine alone.
- Let pre-push run once, then add only the checks it omits. Run SonarCloud and Semgrep explicitly for security or repository-wide review work.
- An audit is skipped only when the harness, not the code, is what fails it. Say which.

## Conventions

- Conventional Commits, with the RAI footer.
- Every icon comes from `react-icons`. Never hand-draw an SVG icon, and never use a Unicode character as one — a glyph renders as whatever the reader's font stack happens to have, which is not a decision this repo gets to make.
- Validate Algolia credentials through the shared helper rather than an inline regex.
- `SECURITY_RULES.md` is mandatory policy for any change touching outbound fetches, file loading, or path resolution. The application currently makes no outbound requests; keep it that way unless asked.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
