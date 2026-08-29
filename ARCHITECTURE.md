# System Architecture

## Shape

System Notes is one Next.js application deployed to Cloud Run. It has four public surfaces and one bounded integration route.

| Surface            | Responsibility                         | State owner                                           |
| ------------------ | -------------------------------------- | ----------------------------------------------------- |
| `/`                | Searchable notes index                 | InstantSearch owns query, facets, and page in the URL |
| `/notes/[id]`      | Durable full-note view                 | Server-rendered route reads one Algolia record        |
| `/projects`        | Complete project directory             | Server-rendered project registry                      |
| `/about`           | Professional record and derived totals | Server-rendered profile and project registry          |
| `/api/blog/search` | Bounded DEV post aggregation           | In-memory cache with guarded external fetches         |

There is no application-wide client shell. Pages render on the server until a feature needs browser state.

## Search boundary

The index is the only large client-side surface.

- `IndexWorkspaceLoader` defers it until after the page shell.
- React InstantSearch queries Algolia directly with a search-only key.
- InstantSearch serializes query, category, project, topic, and page state.
- Note cards keep flip state inside their grid cell and never write browser history.
- Opening a card fires the Algolia click event once.
- Full-note links use a normal route rather than an overlay.

## Data boundary

- `src/data/projects.json` is the project registry.
- `src/data/profile.ts` contains authored profile copy only.
- Counts and project groupings are derived at render time.
- Algolia stores the searchable note corpus and supplies individual note records.
- `/site.jsonld`, the sitemap, and public AI metadata expose machine-readable context.

## External content boundary

`src/app/api/blog/search/route.ts` is the only route that fetches third-party content.

- The sitemap and post HTML are untrusted.
- URLs must be credential-free, same-origin, and under `/posts/`.
- Redirects are refused.
- Sitemap and post bodies are capped at 1 MB and 2 MB.
- At most 50 URLs are considered, five requests run concurrently, and each request gets 10 seconds.
- Empty results use a shorter cache lifetime than successful results.

The exact invariants live in [`SECURITY_RULES.md`](./SECURITY_RULES.md).

## Validation boundary

- Vitest enforces coverage floors.
- Playwright covers navigation, filtering, note interaction, responsive layout, and accessibility.
- Lighthouse gates accessibility, best practices, SEO, and performance.
- `gitleaks`, `npm audit`, Semgrep, CodeQL, and SonarCloud cover secrets, dependencies, security patterns, and code quality.
- Lefthook runs the local pre-push subset; CI runs the remote gates.
