# System Architecture

## Shape

System Notes is one Next.js application deployed to Cloud Run. It has five public surfaces and one bounded integration route.

| Surface            | Responsibility                         | State owner                                             |
| ------------------ | -------------------------------------- | ------------------------------------------------------- |
| `/`                | One-turn intake                        | Local form state; settled brief may use session storage |
| `/notes`           | Searchable notes index                 | InstantSearch owns query and refinements in the URL     |
| `/notes/[id]`      | Durable full-note view                 | Server-rendered route reads one Algolia record          |
| `/projects`        | Complete project directory             | Server-rendered project registry                        |
| `/about`           | Professional record and derived totals | Server-rendered profile and project registry            |
| `/api/blog/search` | Bounded DEV post aggregation           | In-memory cache with guarded external fetches           |

There is no application-wide client shell. Pages render on the server until a feature needs browser state.

## Index boundary

The index is the only large client-side surface.

- `IndexWorkspaceLoader` defers it until after the page shell.
- React InstantSearch queries Algolia directly with a search-only key.
- `searchRouting` serializes query plus category, project, and topic refinements.
- `IndexWorkspace` keeps the selected reader note local and sends the Algolia click event on selection.
- Malformed hits are withheld before the workspace renders them.
- `/notes/[id]` reads a single record on the server and never becomes an index overlay.

## Intake boundary

The homepage lazily loads the agent transport only after a valid question is submitted.

- The client calls the configured Algolia Agent Studio completion endpoint with public search credentials and `NEXT_PUBLIC_ALGOLIA_AGENT_ID`.
- One question produces one answer; there is no conversational history.
- A request is stopped after 45 seconds and the form is released on every terminal result.
- Agent output is parsed into React elements. HTTPS citations may be followed; model output is never injected as HTML.
- The Agent Studio handoff copy lives under `.agent/agent-studio/`; regenerate its roster prompt after changing `src/data/projects.json`.

## Data boundary

- `src/data/projects.json` is the project registry.
- `src/data/profile.ts` contains authored profile copy only.
- Counts and project groupings are derived at render time.
- Algolia stores the searchable note corpus, individual note records, and the intake agent's evidence sources.
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
