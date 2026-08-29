# Security Rules

Strict security rules for the `system-notes` repository. Follow these whenever you change code that fetches remote content, loads files, or resolves paths. Default to deny on any validation failure.

## 1. Outbound Fetch / SSRF Prevention (if outbound fetching is reintroduced)

The application makes no outbound requests to third-party content today; the route that did was removed with the feature. If any is introduced, these become mandatory.

### Rule 1.1: Treat remote content as untrusted

Sitemap `<loc>` entries and post HTML are attacker-influenceable. Never follow a URL derived from them without validation.

### Rule 1.2: Exact-origin allowlist

Only fetch URLs whose origin exactly matches the sitemap origin and whose path starts with `/posts/`. Reject alternate schemes, ports, credentials, lookalike hosts, and every validation failure.

### Rule 1.3: Bounded requests

Every outbound fetch must set a timeout (`AbortSignal.timeout`), disable automatic redirects, and tolerate failure by returning empty or partial results — never by throwing into the request path.

### Rule 1.4: Bound remote work

- Cap the sitemap at 1 MB and each post response at 2 MB.
- Process at most 50 unique post URLs with no more than five concurrent post fetches.
- Keep parsing linear in input size; do not use backtracking-prone patterns over remote content.

## 2. Path Traversal Prevention (if local file serving is added)

No local file serving exists today. If any is introduced, these become mandatory:

### Rule 2.1: No direct user input in path construction

Validate all user-provided path strings _before_ using them in any path join or resolve.

### Rule 2.2: Ban ".."

Explicitly reject any input containing `..` before any filesystem operation or path resolution.

### Rule 2.3: Strict allowlist for filenames (when possible)

Map user input to known allowed filenames/IDs rather than accepting raw paths. If raw paths are unavoidable, enforce a strict character set (e.g. `^[a-zA-Z0-9_./-]+$`).

### Rule 2.4: Resolve and verify root

Resolve the final path to an absolute path, then verify it stays within the intended sandbox directory before use.

### Rule 2.5: Safe extensions only

When serving static content or docs, whitelist allowed extensions (`.md`, `.json`, `.txt`) and never serve `.env`, `.sh`, `.yml`, or source files.

## 3. Review Process

- Any change touching outbound fetches or file access must be reviewed against these rules.
- `gitleaks` secret scanning and automated security scanners must pass.
