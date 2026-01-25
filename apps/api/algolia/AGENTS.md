# AGENTS.md for Algolia files

- When working in `./algolia_prompt.md`:
  - Never emphasize with formatting
  - Use all caps as section headers

## Index Descriptions

These descriptions are designed to help AI agents (like Ruckus) understand _when_ and _why_ to query specific indices.

### `projects`

**Description:** Contains structured data on software projects, portfolios, tools, and experiments built by the author.
**When to use:** Query this index when the user asks about specific work, codebases, repositories, "this project", "what have you built", or technical implementations of specific apps.
**Key Attributes:** `title`, `aliases` (e.g., "hermes agent"), `tags` (e.g., "Next.js", "Python"), `summary`, `status`.

### `about`

**Description:** Contains biographical information, professional work style, career history, identity, and personal context about Ashley.
**When to use:** Query this index when the user asks about the author's background, "who is Ashley", "resume", "work style", "where are you from", or "contact info".
**Key Attributes:** `section` (e.g., "identity", "background"), `data` (key-value pairs of facts).

### `system_docs`

**Description:** Contains indexed chunks of architectural documentation, design patterns, system flows, and technical rationale.
**When to use:** Query this index when the user asks deep-dive technical questions about _how_ the system works, "why was this decision made", "architecture", or specific code patterns not covered by high-level project summaries.
**Key Attributes:** `content` (raw text chunks), `doc_path` (source file), `title` (document section).
