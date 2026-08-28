# System Architecture

## Shape

System Notes is one Next.js application deployed to Cloud Run. It has four public surfaces.

| Surface     | Responsibility                         | State owner                                             |
| ----------- | -------------------------------------- | ------------------------------------------------------- |
| `/`         | One-turn intake                        | Local form state; settled brief may use session storage |
| `/notes`    | Searchable notes index                 | InstantSearch owns query and refinements in the URL     |
| `/projects` | Complete project directory             | Server-rendered project registry                        |
| `/about`    | Professional record and derived totals | Server-rendered profile and project registry            |

There is no application-wide client shell. Pages render on the server until a feature needs browser state.

## Index boundary

The index is the only large client-side surface.

- `IndexWorkspaceLoader` defers it until after the page shell.
- React InstantSearch queries Algolia directly with a search-only key.
- `searchRouting` serializes query plus category, project, and topic refinements.
- `IndexWorkspace` keeps the selected reader note local and sends the Algolia click event on selection.
- Malformed hits are withheld before the workspace renders them.

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

The exact invariants live in [`SECURITY_RULES.md`](./SECURITY_RULES.md).

## Validation boundary

- Vitest enforces coverage floors.
- Playwright covers navigation, filtering, note interaction, responsive layout, and accessibility.
- Lighthouse gates accessibility, best practices, SEO, and performance.
- `gitleaks`, `npm audit`, Semgrep, CodeQL, and SonarCloud cover secrets, dependencies, security patterns, and code quality.
- Lefthook runs the local pre-push subset; CI runs the remote gates.
