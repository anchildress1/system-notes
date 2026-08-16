[![CI](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/anchildress1/system-notes/actions/workflows/ci.yml) [![Quality Gate](https://img.shields.io/sonar/alert_status/anchildress1_system-notes?server=https%3A%2F%2Fsonarcloud.io&logo=sonarqubecloud)](https://sonarcloud.io/summary/new_code?id=anchildress1_system-notes) ![License](https://img.shields.io/badge/License-PolyForm%20Shield%201.0.0-blue)

<!-- prettier-ignore-start -->
<!--START_SECTION:rai-badge-->

![AI attribution](https://img.shields.io/badge/AI%20attribution-69%25%20since%202026--01-C03070?style=flat)

<!--END_SECTION:rai-badge-->
<!-- prettier-ignore-end -->

_That badge is [rai-commit-badge](https://github.com/anchildress1/rai-commit-badge) scoring this repo's own git history. Dependabot and release automation remain in the denominator, because flattering math is still flattering math._

# System Notes

A searchable record of Ashley Childress's engineering decisions, constraints, failures, and working rules. The evidence is the interface.

## What ships

- **Index**: Algolia InstantSearch over the notes corpus, with query and facet state in the URL.
- **Notes**: In-place card flips for fast context and durable `/notes/[id]` pages for the full record.
- **Projects**: One complete directory of current work, retired tools, archived experiments, and deliberate dead ends.
- **About**: A short professional record backed by counts derived from the project registry.
- **Machine-readable context**: Structured project data, sitemap output, and `/site.jsonld`.
- **Hard gates**: Unit coverage, Playwright, axe, Lighthouse, secret scanning, and dependency auditing.

## Stack

| Layer       | Tools                                             |
| ----------- | ------------------------------------------------- |
| Application | Next.js, React, TypeScript                        |
| Search      | Algolia, React InstantSearch                      |
| Interface   | CSS Modules, CSS custom properties, `react-icons` |
| Images      | `sharp`, build-time responsive variants           |
| Testing     | Vitest, Testing Library, Playwright, axe-core     |
| Delivery    | Cloud Run, GitHub Actions, Release Please         |

[Read the architecture](./ARCHITECTURE.md).

## Local development

```bash
make setup
make dev
```

Run the complete local gate before handing work over:

```bash
make ai-checks
```

Responsive image variants are generated before build and test targets. No separate ritual sacrifice is required.

## Environment

Keep these values in a local `.env` file. Any `NEXT_PUBLIC_*` value is shipped to the browser; use a search-only Algolia key.

| Variable                                | Required | Purpose                                                        |
| --------------------------------------- | -------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_ALGOLIA_APPLICATION_ID`    | Yes      | Algolia application queried by the browser and note pages      |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`    | Yes      | Search-only API key                                            |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME` | No       | Index name; defaults to `system-notes`                         |
| `NEXT_PUBLIC_BASE_URL`                  | No       | Canonical origin for metadata, sitemap, and JSON-LD            |
| `ANALYZE`                               | No       | Enables the bundle report when running `npm run build:analyze` |

Admin and write-scoped keys belong outside this app. Giving one a `NEXT_PUBLIC_` prefix is how a quiet afternoon becomes an incident report.

## Quality bar

- Accessibility, best-practices, and SEO Lighthouse scores must remain at 100.
- Desktop performance must remain at or above 98; mobile at or above 92.
- Unit coverage floors are enforced in `vitest.config.ts`.
- InstantSearch owns query, facet, and page URL state.
- Note cards own only their local flip state and fire Algolia click events when opened.
- Reduced-motion users get a face swap instead of a 3D rotation.

## Security

The DEV aggregation route treats the remote sitemap and every linked page as hostile input. It accepts only credential-free same-origin `/posts/` URLs, refuses redirects, and bounds body sizes, URL count, concurrency, and request time. See [`SECURITY_RULES.md`](./SECURITY_RULES.md).

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

System Notes uses the [PolyForm Shield License 1.0.0](./LICENSE). Learn from it, fork it, keep it personal. Do not sell it.

## Author

**Ashley Childress** — [GitHub](https://github.com/anchildress1) · [LinkedIn](https://linkedin.com/in/anchildress1) · [DEV](https://dev.to/anchildress1)
