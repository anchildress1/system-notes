Paste into the **index description** for `system-notes` in Agent Studio.
Rewritten from Algolia's generated draft, which described this as an internal
project-tracking index for developers and project managers. It is a public
portfolio corpus read by an agent answering a stranger.

`blurb` and `deleted_at` are deliberately absent: `blurb` is retired, and
`deleted_at` is applied by the transformer before records reach the index, so
the agent never encounters one.

---

**system-notes**

**What this index contains:**
1 record = one filed note: a decision, principle, working practice, architectural choice, award, or blog post, written at the time it happened.

**Which industry or industries it serves:**
Software engineering. Specifically AI systems, guardrails, and failure-tested delivery.

**Who would use this index:**
An AI agent answering on Ashley Childress's behalf, and readers of her public portfolio. Not an internal team, and not a project-tracking tool — this is one engineer's public record of how and why decisions were made. Queries arrive as a stranger's problem, not as a known note title.

**Primary use cases:**

- **Evidence retrieval:** given a described problem, find the filed notes bearing on the same failure or risk. This is the dominant use case and the one to optimize for.
- **Search:** across title, fact, projects and tags.
- **Filtering:** narrow by category, project, or tag when the reader already knows what they are after.
- **Highlighting:** title, fact and projects, to show which words matched.

**Define precisely what a single record represents:**
One decision and its reasoning. Not a summary of a project, and not a task — a record of a choice, a constraint, or a result that could later be defended or falsified. A project has many records; a record belongs to one or more projects but is never scoped to them.

**Most relevant attributes:**

| Attribute                         | Role                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `title`                           | searchable — the claim the note makes                                                              |
| `fact`                            | searchable — the note's reasoning; the substance, and the primary text to match against            |
| `content`                         | searchable — extended body where present                                                           |
| `projects`                        | searchable, filterable, **multi-valued** — systems the note came out of                            |
| `category`                        | searchable, filterable — one of: Architecture, Awards, Blog, Decision, Note, Principle, Work Style |
| `tags.lvl0`                       | filterable, multi-valued — primary topic                                                           |
| `tags.lvl1`                       | searchable, filterable, multi-valued — secondary topic                                             |
| `signal`                          | ranking weight; higher means more load-bearing                                                     |
| `url`                             | source link where the note has a public one                                                        |
| `created_at` / `created_at_epoch` | when filed; epoch for sorting                                                                      |
| `updated_at` / `updated_at_epoch` | last revision                                                                                      |

**Multi-valued facets and hierarchical category patterns:**
`projects`, `tags.lvl0` and `tags.lvl1` are all multi-valued; a note commonly spans several projects and several topics. `tags.lvl0` / `tags.lvl1` form a two-level hierarchy where `lvl1` values are prefixed by their `lvl0` parent. `category` is single-valued and flat.

**Any language/locale behavior:**
English only. Plurals ignored, English stop words removed.
