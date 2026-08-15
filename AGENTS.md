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

## URL State Architecture: Search Page

### Core rule: InstantSearch owns the URL; FactCard owns local flip state

InstantSearch manages all URL serialization (query, facets, page) via its default routing. FactCard does NOT write to the URL — it toggles a local 3D flip in its grid cell and fires Algolia click events.

There is no deep-link overlay. The card never grows, never modals, never takes over the screen. Both faces live in the same grid slot.

### Implementation contracts

| Component                         | Responsibility                                    | Writes to URL       |
| --------------------------------- | ------------------------------------------------- | ------------------- |
| `FactCard.openCard` / `closeCard` | Toggle local in-place 3D flip; fire `sendEvent`   | No                  |
| `searchRouting`                   | Serialize InstantSearch state (query, kind, page) | Search params       |
| Facet widgets (`KindChips`, etc.) | Refine via InstantSearch hooks                    | Via `searchRouting` |

### Rules for future changes

- FactCard must NOT call `window.history.pushState`. InstantSearch manages the URL.
- Do not reintroduce a fact-card overlay, modal, or expand-to-fullscreen behavior. The card flips in place inside its grid cell.
- Algolia events (`sendEvent`) fire on card open. Never gate events on URL state.
- Do not add custom `createURL` logic that fights InstantSearch's default routing behavior.

## Test Standards

- **Coverage thresholds**: 95% lines, 92% functions/statements, 85% branches (enforced by `vitest.config.ts`). Floors sit a few points under actual so a regression trips them; do not lower them to make a run pass.
- Every new component or utility must ship with positive, negative, and edge-case tests.
- Integration-heavy modules (e.g. `SearchPage.tsx`) are excluded from coverage; test them via E2E instead.
- Playwright uses one worker in CI. Do not increase it without a zero-retry stress run across every configured browser project.

## Validation

- Lefthook pre-push runs unit tests, `gitleaks`, and Lighthouse; it does not run E2E, SonarCloud, or Semgrep.
- Let pre-push execute once. Run only task-required checks it omits before pushing.
- Run SonarCloud and Semgrep explicitly for security, scanner, or repository-wide review work.

## TypeScript Strictness

- `strict: true` is enforced in `tsconfig.json`. Run `make typecheck` to verify.
- Do not weaken strict settings or add `// @ts-ignore` without a justifying comment.

## Performance / Lighthouse

- **Targets** (enforced pre-push via the lefthook `performance` step → `make test-perf`):
  - **accessibility, best-practices, SEO: 100%** on both. These are deterministic given the
    same DOM, so the gate sits exactly at the observed score — a drop is a real regression.
  - **performance: 98% desktop, 92% mobile.** Performance is the only timing-dependent
    category, so it is the only one carrying headroom. Desktop sat at `minScore: 1` and failed
    CI at 0.99 on a slightly slower runner while scoring 100 locally and on a re-run of the
    same commit; a perfect-score gate measures the runner, not the code.
- `errors-in-console` is skipped in the LH configs — the local harness uses dummy Algolia credentials, so unreachable-host network errors are a test artifact, not a defect (same rationale as the pre-existing `uses-http2` skip).
- Below-the-fold components must be deferred via `IntersectionObserver` or `next/dynamic` (see `SearchPageWrapper.tsx`).
- Prefer `instantsearch.css/themes/reset.css` over `satellite.css` to minimize CSS payload.

## API Design

- **Route**: `src/app/api/blog/search/route.ts` — a Next.js route handler, **GET only**.
- **Behavior**: aggregates DEV blog posts from an external sitemap, extracts JSON-LD, caches results in memory (15 min; 60s when empty), and filters by `q`/`tag` with a clamped `limit` (1–50, default 3).
- **Untrusted input**: the sitemap and post HTML are untrusted. Accept only credential-free URLs on the sitemap's exact origin under `/posts/`; refuse redirects; cap sitemap/post bodies at 1 MB/2 MB, URLs at 50, concurrency at five, and requests at 10 seconds. See `SECURITY_RULES.md`.

## Shared Utilities

- **`@/lib/algolia.ts`**: Credential validation (`hasValidAlgoliaCredentials`, `isValidAppId`, `isValidApiKey`). Use instead of inline regex checks.
- **`@/components/icons/`**: Shared SVG icon components (`GitHubIcon`, `DevIcon`, `TrophyIcon`). Use instead of inline SVG.
- **Icon libraries**: Use `react-icons` for all icons (UI and brand). Prefer `react-icons/fa`, `react-icons/io5`, `react-icons/si`, etc.

## Documentation

- Do not add docs to project unless specifically asked
- Aim for witty, humorous tone in docs.
