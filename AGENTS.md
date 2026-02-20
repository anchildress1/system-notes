# AGENTS.md

Canonical instruction source for this repository. Treat this file as authoritative.

## Scope

- Apply these rules when changing code in this repo.
- If a local instruction file conflicts with this file, prefer this file.

## Non-Negotiable Constraints

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

### Core rule: InstantSearch owns the URL; FactCard owns local overlay state

InstantSearch manages all URL serialization (query, facets, page) via its default routing. FactCard does NOT write to the URL — it toggles a local overlay and fires Algolia click events.

Deep-linking via `?factId=...` is handled separately by `useFactIdRouting`, which fetches the card from Algolia and renders a standalone overlay.

### Implementation contracts

| Component                                            | Responsibility                                        | Writes to URL       |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------- |
| `FactCard.openCard`                                  | Toggle local overlay state; fire `sendEvent`          | No                  |
| `FactCard.closeCard`                                 | Toggle local overlay state                            | No                  |
| `FactCard.cardUrl` (href)                            | Static link for right-click / new tab                 | `factId` only       |
| `searchRouting`                                      | Serialize InstantSearch state (query, facets, page)   | Search params       |
| `useFactIdRouting`                                   | Deep-link overlay for direct navigation with `factId` | Removes on close    |
| Facet widgets (`RefinementList`, `GroupedTagFilter`) | Refine via InstantSearch hooks                        | Via `searchRouting` |

### Rules for future changes

- FactCard must NOT call `window.history.pushState`. InstantSearch manages the URL.
- `searchRouting` must NOT handle `factId`. That param belongs to `useFactIdRouting`.
- Algolia events (`sendEvent`) fire on card open. Never gate events on URL state.
- Do not add custom `createURL` logic that fights InstantSearch's default routing behavior.

## Frontend Style Skill

- Refer to `.claude/skills/frontend-style.md`.

## Test Standards

- **Coverage thresholds**: 85% lines/functions/statements, 80% branches (enforced by `vitest.config.ts` and `pyproject.toml`).
- Every new component or utility must ship with positive, negative, and edge-case tests.
- Integration-heavy modules (e.g. `SearchPage.tsx`, `recommendations.ts`) are excluded from coverage; test them via E2E instead.

## TypeScript Strictness

- `strict: true` is enforced in `tsconfig.json`. Run `make typecheck` to verify.
- Do not weaken strict settings or add `// @ts-ignore` without a justifying comment.

## Performance / Lighthouse

- **Targets**: 90%+ all Lighthouse categories (mobile and desktop).
- Below-the-fold components must be deferred via `IntersectionObserver` or `next/dynamic` (see `SearchPageWrapper.tsx`).
- Prefer `instantsearch.css/themes/reset.css` over `satellite.css` to minimize CSS payload.

## API Design

- **Methods**: GET and OPTIONS only. CORS explicitly restricts to these.
- **CORS origins**: localhost:3000, production domains, and Cloud Run revision URLs.
- **Logging**: Request logging middleware emits method, path, status, and duration_ms for every request.

## Shared Utilities

- **`@/lib/algolia.ts`**: Credential validation (`hasValidAlgoliaCredentials`, `isValidAppId`, `isValidApiKey`). Use instead of inline regex checks.
- **`@/components/icons/`**: Shared SVG icon components (`GitHubIcon`, `DevIcon`, `CloseIcon`). Use instead of inline SVG.
- **Icon libraries**: Use `lucide-react` for UI icons. Keep `react-icons` only for brand icons (`FaGithub`, `SiAlgolia`, `FaDev`, etc.) that lucide doesn't provide.

## Documentation

- Do not add docs to project unless specifically asked
- Aim for witty, humorous tone in docs.
