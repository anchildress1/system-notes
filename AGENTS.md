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

## Frontend Style Skill

- Refer to `.claude/skills/frontend-style.md`.

## Test Standards

- **Coverage thresholds**: 85% lines/functions/statements, 80% branches (enforced by `apps/web/vitest.config.ts`).
- Every new component or utility must ship with positive, negative, and edge-case tests.
- Integration-heavy modules (e.g. `SearchPage.tsx`) are excluded from coverage; test them via E2E instead.

## TypeScript Strictness

- `strict: true` is enforced in `tsconfig.json`. Run `make typecheck` to verify.
- Do not weaken strict settings or add `// @ts-ignore` without a justifying comment.

## Performance / Lighthouse

- **Targets** (enforced pre-push via the lefthook `performance` step → `make test-perf`):
  - **best-practices: 100%** on both mobile and desktop.
  - **performance: 100% desktop, 95% mobile.**
  - **accessibility & SEO: 95%+** on both.
- `errors-in-console` is skipped in the LH configs — the local harness uses dummy Algolia credentials, so unreachable-host network errors are a test artifact, not a defect (same rationale as the pre-existing `uses-http2` skip).
- Below-the-fold components must be deferred via `IntersectionObserver` or `next/dynamic` (see `SearchPageWrapper.tsx`).
- Prefer `instantsearch.css/themes/reset.css` over `satellite.css` to minimize CSS payload.

## API Design

- **Route**: `apps/web/src/app/api/blog/search/route.ts` — a Next.js route handler, **GET only**.
- **Behavior**: aggregates DEV blog posts from an external sitemap, extracts JSON-LD, caches results in memory (15 min; 60s when empty), and filters by `q`/`tag` with a clamped `limit` (1–50, default 3).
- **Untrusted input**: the sitemap and post HTML are untrusted — outbound fetches are SSRF-guarded (same-host `/posts/` URLs only, 10s timeout per request). See `SECURITY_RULES.md`.

## Shared Utilities

- **`@/lib/algolia.ts`**: Credential validation (`hasValidAlgoliaCredentials`, `isValidAppId`, `isValidApiKey`). Use instead of inline regex checks.
- **`@/components/icons/`**: Shared SVG icon components (`GitHubIcon`, `DevIcon`, `TrophyIcon`). Use instead of inline SVG.
- **Icon libraries**: Use `react-icons` for all icons (UI and brand). Prefer `react-icons/fa`, `react-icons/io5`, `react-icons/si`, etc.

## Documentation

- Do not add docs to project unless specifically asked
- Aim for witty, humorous tone in docs.
