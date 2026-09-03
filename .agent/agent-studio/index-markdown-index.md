Paste into the **index description** for `markdown-index` in Agent Studio.
Rewritten from Algolia's generated draft, which described this as a tool for
content creators and editors. Nobody drafts here; it is a machine-readable mirror
of published writing, read by an agent answering a stranger.

Attribute names verified against a live record. The earlier draft named three of
them wrongly: the prose is `content` (not `text`), the summary is `description`
(not `blurb`), and the locale is `language` (not `lang`).

Two additions that change behavior rather than describe it: a record is a
section rather than an article, so several share one `url`; and `content` holds
raw markdown, including links to third parties that are not citations for this
work.

---

**markdown-index**

**What this index contains:**
1 record = one section of a published article. An article is split across many records, ordered by `part`.

**Which industry or industries it serves:**
Software engineering. Technical writing on AI systems, guardrails, and delivery practice.

**Who would use this index:**
An AI agent answering on Ashley Childress's behalf, and AI systems citing her published writing. This is a mirror of her technical articles, built so machines can index and quote them accurately. Not an editorial tool; nobody is drafting or revising here.

**Primary use cases:**

- **Passage retrieval:** given a described problem, find the section that argues the relevant point, then cite the article it belongs to. This is the dominant use case.
- **Search:** across article title, section heading, and section content.
- **Content discovery:** locating which article covers a topic at all.

**Define precisely what a single record represents:**
One section of one article, roughly a heading and the prose beneath it. It is a fragment, not a document. Several records share the same `title` and `url` and differ only by `heading`, `part` and `content`. A section carries an argument; the article carries the thesis.

**Most relevant attributes:**

| Attribute     | Role                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `content`     | searchable: the section's prose, in **raw markdown**; the primary text to match against |
| `title`       | searchable: the article's title, repeated on every one of its sections                  |
| `heading`     | searchable, filterable: the section's own heading. On `part` 0 this equals `title`      |
| `part`        | section order within the article, zero-based; consecutive parts are adjacent prose      |
| `url`         | the article's public link; **the identity of the source, not of the record**            |
| `objectID`    | `url` and `part` joined as `url#part`; unique per section, not per article              |
| `description` | the article's summary, repeated across its sections                                     |
| `author`      | article author; always the same person, so it distinguishes nothing                     |
| `created_at`  | publication time as a **Unix epoch integer in seconds**, not a date string              |
| `language`    | filterable: article language                                                            |

**Reading `content` safely:**
`content` is markdown, not plain prose. It carries heading markers, blockquotes, code fences and inline links. Strip that markup before quoting a passage. Links inside `content` point at other people's articles, profiles and sources cited by the article; they are never citations for Ashley's own work. The only link that identifies this source is `url`.

**Multi-valued facets and hierarchical category patterns:**
None. No facets are multi-valued and there is no category hierarchy. `title`, `url`, `description` and `author` repeat across every section of the same article, so they behave as grouping keys rather than as distinguishing values.

**Any language/locale behavior:**
English (`en`), plurals ignored during search.
