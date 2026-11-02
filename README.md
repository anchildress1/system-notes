[![CI](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml) [![Quality Gate](https://img.shields.io/sonar/alert_status/anchildress1_system-notes?server=https%3A%2F%2Fsonarcloud.io&logo=sonarqubecloud)](https://sonarcloud.io/summary/new_code?id=anchildress1_system-notes) ![License](https://img.shields.io/badge/License-PolyForm%20Shield%201.0.0%20%2B%20supplemental-blue)

<!-- prettier-ignore-start -->
<!--START_SECTION:rai-badge-->
![AI attribution](https://img.shields.io/badge/AI%20attribution-74%25%20since%202026--01-C03070?style=flat)
<!--END_SECTION:rai-badge-->
<!-- prettier-ignore-end -->

_That badge is [rai-commit-badge](https://github.com/anchildress1/rai-commit-badge) scoring this repo's own git history. Dependabot and release automation remain in the denominator, because flattering math is still flattering math._

# System Notes

A searchable record of Ashley Childress's engineering decisions, constraints, failures, and working rules. The evidence is the interface.

## What ships

- **Intake**: A one-turn Agent Studio brief at `/`, using filed evidence when valid agent credentials are configured.
- **Index**: Algolia InstantSearch at `/notes`, with query and facet state in the URL and selection kept in the reader.
- **Projects**: One complete directory of current work, retired tools, archived experiments, and deliberate dead ends.
- **About**: A short professional record backed by counts derived from the project registry.
- **Machine-readable context**: Structured project data, sitemap output, and `/site.jsonld`.
- **Hard gates**: Formatting, linting, type checks, unit coverage, Playwright with axe, Lighthouse, secret scanning, and dependency auditing.

## Stack

| Layer       | Tools                                             |
| ----------- | ------------------------------------------------- |
| Application | Next.js, React, TypeScript                        |
| Search      | Algolia, React InstantSearch                      |
| Interface   | CSS Modules, CSS custom properties, `react-icons` |
| Images      | `sharp`, build-time responsive variants           |
| Testing     | Vitest, Testing Library, Playwright, axe-core     |
| Delivery    | Cloud Run, GitHub Actions, Release Please         |

## Local development

```bash
make install
make dev
```

Run the complete local gate before handing work over:

```bash
make ai-checks
```

Responsive image variants are generated before build and test targets. No separate ritual sacrifice is required.

## Environment

Keep these values in a local `.env` file. Any `NEXT_PUBLIC_*` value is shipped to the browser; use a search-only Algolia key.

| Variable                                | Required | Purpose                                                         |
| --------------------------------------- | -------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_ALGOLIA_APPLICATION_ID`    | Yes      | Algolia application queried by the browser and index            |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`    | Yes      | Search-only API key                                             |
| `NEXT_PUBLIC_ALGOLIA_AGENT_ID`          | Intake   | Agent Studio agent ID; without it, the intake stays unavailable |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME` | No       | Index name; defaults to `system-notes`                          |
| `NEXT_PUBLIC_BASE_URL`                  | No       | Canonical origin for metadata, sitemap, and JSON-LD             |
| `ANALYZE`                               | No       | Enables the bundle report when running `npm run build:analyze`  |

Admin and write-scoped keys belong outside this app. Giving one a `NEXT_PUBLIC_` prefix is how a quiet afternoon becomes an incident report.

## Quality bar

- `make ai-checks` runs dependency installation, secret scanning, audit, formatting, linting, type checks, unit coverage, browser integration, and Lighthouse.
- Unit coverage includes production TypeScript and project-owned generator scripts; floors are 97% lines, 95% functions/statements, and 90% branches.
- Chromium runs the full mocked-provider browser suite; WebKit runs compatibility checks; mobile Chrome and Safari run responsive checks, plus the two accessibility rules whose answer depends on the viewport.
- Algolia search and Agent Studio are mocked browser-integration boundaries. The suite never claims live-provider validation.
- Lighthouse samples `/`, `/projects`, and `/about` three times on desktop, and those routes plus `/notes` five times on mobile. Accessibility and SEO remain 100; best practices and unexpected console errors gate every route except mobile `/notes`; desktop performance remains at least 98 and mobile at least 92.
- InstantSearch owns query and refinement URL state at `/notes`.
- The notes workspace owns selected-reader state and fires Algolia click events on selection.
- The intake defers its agent transport until a question is submitted.

## Security

The application makes no outbound requests to third-party content. Rules for reintroducing any are in [`SECURITY_RULES.md`](./SECURITY_RULES.md).

`gitleaks`, CodeQL, Semgrep, SonarCloud, dependency auditing, and locked-down CI permissions cover the less glamorous ways software can embarrass its owner.

## Contributing

This is a personal portfolio, not an open requisition for maintainers. Bug reports are welcome.

Pull requests must:

- branch from `main`;
- use Conventional Commits;
- use signed commits;
- include the required RAI attribution footer; and
- clear the repository gates without lowering them.

## License

System Notes uses the [PolyForm Shield License 1.0.0 with supplemental terms](./LICENSE). The supplemental terms narrow the base license: no monetization, no endorsement, and attribution on any substantial reuse. Learn from it, fork it, keep it personal. Do not sell it.

## Author

**Ashley Childress** — [GitHub](https://github.com/anchildress1) · [LinkedIn](https://linkedin.com/in/anchildress1) · [DEV](https://dev.to/anchildress1)
