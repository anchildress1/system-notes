# AGENTS.md for Algolia files

**Purpose:** AI-specific context for agents working in this repository. Focus on non-obvious implementation details and gotchas.

## Formatting Rules for `algolia_prompt.md`

- Never emphasize with formatting (no bold, italic, etc.)
- Use all caps as section headers
- Keep responses conversational and authentic to Ashley's voice

## Knowledge Graph Architecture

### Index Structure (Current)

The system uses **4 active indices** (as of Jan 2026):

1. **`projects`** - 9 records with visual assets
2. **`facts`** - 27 records extracted from `about.json`
3. **`blog_posts`** - 56 records from sitemap
4. **`artwork`** - 3 digital art pieces (metadata only)

### Deprecated Indices

- **`about`** - Replaced by `facts` index (Jan 2026)
- **`system_docs`** - Kept for blog crawler setup, not actively indexed

### Visual Asset Handling

**Critical Implementation Detail:**

- Project banners are stored in `apps/web/public/projects/`
- Artwork files are in `apps/web/public/artwork/`
- The `build_knowledge_graph.py` script scans these directories to generate metadata
- Images are served at `/projects/{filename}` and `/artwork/{filename}` URLs
- **Image display in Algolia UI requires manual dashboard configuration** - there's no public API endpoint for Agent Studio settings

### Data Flow

```
about.json → extract_facts_from_about() → facts.json
sitemap.xml → fetch_blog_posts_from_sitemap() → blog_posts.json
projects.json + /public/projects/ → enrich_projects_with_visuals() → projects_enriched.json
/public/artwork/ → scan_artwork_directory() → artwork.json
```

## Index Descriptions

### `projects`

**Description:** Software projects with visual assets (banners, thumbnails)
**When to use:** User asks about work, codebases, "what have you built", specific tools
**Key Attributes:** `title`, `aliases`, `tags`, `summary`, `status`, `banner_image`, `thumbnail_url`
**Visual Context:** Always include banner images in responses when available

### `facts`

**Description:** Biographical facts, identity, principles, philosophy extracted from about.json
**When to use:** User asks about Ashley's background, identity, work style, values
**Key Attributes:** `category`, `content`, `tags`, `related_projects`
**Note:** Replaces the old `about` index structure

### `blog_posts`

**Description:** Blog articles from ashleychildress.com with cover images
**When to use:** User asks about writing, articles, specific topics Ashley has written about
**Key Attributes:** `title`, `url`, `published_date`, `cover_image`, `excerpt`
**Visual Context:** Include cover images when displaying blog posts

### `artwork`

**Description:** Digital art pieces with themes and connections to facts/projects
**When to use:** User asks about visual work, art, or when enriching responses with relevant imagery
**Key Attributes:** `title`, `image_url`, `thumbnail_url`, `themes`, `connected_to`
**Note:** Only 3 pieces currently (appalachian_mountains, systems_thinking, transparency)

## Scripts & Maintenance

### `build_knowledge_graph.py`

Regenerates all knowledge graph indices from source data. Run when:

- Adding new artwork to `/public/artwork/`
- Updating `about.json` or `projects.json`
- Blog posts change significantly

### `index_algolia.py`

Uploads indices to Algolia with settings. Processes in order:

1. Projects
2. Facts
3. Artwork
4. Blog posts

### `delete_algolia_indices.py`

Clean slate - deletes all indices. Use before major schema changes.

## Agent Configuration (Manual)

**Algolia Agent Studio** (ID: `11caec4a-abd5-439a-a66a-3c26562de5c1`)

- Dashboard: https://dashboard.algolia.com/apps/EXKENZ9FHJ/agent-studio
- System prompt source: `algolia_prompt.md`
- **No public API** for updating agent config - must use dashboard
- Image display fields must be configured manually in UI settings

## Common Gotchas

1. **Image URLs are relative** - stored as `/projects/banner.jpg`, not full URLs
2. **Artwork metadata only** - actual image files must exist in `/public/artwork/`
3. **Blog post extraction** - relies on sitemap.xml structure, may break if blog platform changes
4. **Connection graph** - built but not actively used in search (future enhancement)
5. **Agent Studio API** - doesn't exist for configuration updates despite being "API-first"
