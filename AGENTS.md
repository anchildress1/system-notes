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

### Security: file access and path handling

- If changes touch file loading, path resolution, or file-serving behavior, apply `SECURITY_RULES.md` as mandatory policy.
- Required invariants:
  - Reject any user-controlled path input containing `..`.
  - Resolve to absolute paths before use.
  - Enforce sandbox-root containment after resolution.
  - Allowlist served file types to `.md`, `.json`, `.txt`.
  - Default to deny on validation failure.

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

- **Coverage thresholds**: 85% lines/functions/statements, 80% branches (enforced by `vitest.config.ts` and `pyproject.toml`).
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

- **Methods**: GET and OPTIONS only. CORS explicitly restricts to these.
- **CORS origins**: localhost:3000, production domains, and Cloud Run revision URLs.
- **Logging**: Request logging middleware emits method, path, status, and duration_ms for every request.

## Shared Utilities

- **`@/lib/algolia.ts`**: Credential validation (`hasValidAlgoliaCredentials`, `isValidAppId`, `isValidApiKey`). Use instead of inline regex checks.
- **`@/components/icons/`**: Shared SVG icon components (`GitHubIcon`, `DevIcon`, `CloseIcon`). Use instead of inline SVG.
- **Icon libraries**: Use `react-icons` for all icons (UI and brand). Prefer `react-icons/fa`, `react-icons/io5`, `react-icons/si`, etc.

## Documentation

- Do not add docs to project unless specifically asked
- Aim for witty, humorous tone in docs.
