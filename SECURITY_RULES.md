# Security Rules

Strict security rules for the `system-notes` repository. Follow these whenever you change code that fetches remote content, loads files, or resolves paths. Default to deny on any validation failure.

## 1. Outbound Requests

The application contacts one third party, Algolia. The browser sends search and click events and, once a question is submitted, the intake's agent request. The server reads the notes index at request time (`indexNotes`, `indexPulse`). Nothing else leaves the app. Any new outbound request needs a stated reason and must meet these rules.

### Rule 1.1: Treat remote content as untrusted

Index records and agent output are attacker-influenceable. Never render them as HTML, and never follow a URL derived from them without validation.

### Rule 1.2: Fixed origin

Build the host from a validated value (`isValidAppId`), never from user input or remote content. Reject alternate schemes, ports, credentials, and lookalike hosts.

### Rule 1.3: Bounded requests

Every server-side request sets a timeout and tolerates failure by returning empty or partial results — never by throwing into the request path. A raw `fetch` also disables automatic redirects.

### Rule 1.4: Bound remote work

Cap response size and concurrency on any bulk fetch. Keep parsing linear in input size; do not use backtracking-prone patterns over remote content.

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
