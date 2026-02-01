#!/usr/bin/env python3
"""
Build Knowledge Graph from existing data.

Extracts facts from about.json and system_docs.json, enriches projects with
visual assets, fetches blog posts from sitemap, integrates artwork, builds 
connection graph, and generates new Algolia indices.
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List
from datetime import datetime
from urllib.request import urlopen
from urllib.error import URLError

# Paths
API_DIR = Path(__file__).parent.parent
ALGOLIA_DIR = API_DIR / "algolia"
OUTPUT_DIR = ALGOLIA_DIR / "build"
PUBLIC_DIR = API_DIR.parent / "web" / "public"

# Input files
ABOUT_JSON = ALGOLIA_DIR / "sources" / "about.json"
PROJECTS_JSON = ALGOLIA_DIR / "sources" / "projects.json"

# Output files
OUTPUT_DIR.mkdir(exist_ok=True)
ABOUT_JSON_OUT = OUTPUT_DIR / "about.json"
CONNECTIONS_JSON = OUTPUT_DIR / "connections.json"
ENRICHED_PROJECTS_JSON = OUTPUT_DIR / "projects_enriched.json"
BLOG_POSTS_JSON = OUTPUT_DIR / "blog_posts.json"


def load_json(path: Path) -> Any:
    """Load JSON file."""
    with open(path, "r") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    """Save JSON file with pretty formatting."""
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved {path.name} ({len(data)} records)")


def extract_facts_from_about(about_data: List[Dict]) -> List[Dict]:
    """Extract individual facts from about.json records."""
    facts = []
    
    for record in about_data:
        fact = {
            "objectID": f"fact_{record['objectID']}",
            "node_type": "fact",
            "title": record.get("title", ""),
            "category": record.get("section", "general"),
            "content": json.dumps(record.get("data", {}), indent=2),
            "visual_refs": [],  # To be populated later
            "related_projects": [],  # To be populated via connections
            "related_posts": [],  # To be populated later
            "source_doc": record.get("objectID", ""),
            "tags": record.get("tags", []),
            "updated_at": record.get("updated_at", datetime.now().isoformat()),
        }
        facts.append(fact)
    
    return facts


def extract_project_banners() -> Dict[str, Dict[str, str]]:
    """Map project slugs to banner image paths and thumbnails."""
    banners = {}
    projects_public = PUBLIC_DIR / "projects"
    
    if projects_public.exists():
        for img in projects_public.glob("*.jpg"):
            slug = img.stem  # filename without extension
            banners[slug] = {
                "banner_image": f"/projects/{img.name}",
                "thumbnail_url": f"/projects/thumbnails/{img.name}",
            }
    
    return banners


def enrich_projects_with_visuals(projects_data: List[Dict], banners: Dict[str, Dict[str, str]]) -> List[Dict]:
    """Add visual asset fields to project records."""
    enriched = []
    
    for project in projects_data:
        slug = project.get("objectID", "")  # Use objectID as slug
        enriched_project = {**project}
        
        # Add visual logic here if needed, keeping banners logic
        # Add banner and thumbnail if exists
        if slug in banners:
            enriched_project["banner_image"] = banners[slug]["banner_image"]
            enriched_project["thumbnail_url"] = banners[slug]["thumbnail_url"]
        else:
            enriched_project["banner_image"] = None
            enriched_project["thumbnail_url"] = None
        
        # Ensure new fields are present (they are in the source, just pass through)
        
        # Construct tags for graph connection if not present
        if "tags" not in enriched_project:
            tech = enriched_project.get("tech_stack", [])
            p_type = enriched_project.get("project_type", "")
            # Combine tech stack and project type into tags for graph logic
            enriched_project["tags"] = tech + ([p_type] if p_type else [])

        # Placeholder for screenshots (to be added manually later)
        enriched_project["screenshots"] = []
        
        # Placeholder for related artwork
        enriched_project["related_artwork"] = []
        
        # Extract related facts from tags and summary
        enriched_project["related_facts"] = []
        
        enriched.append(enriched_project)
    
    return enriched


def build_connection_graph(facts: List[Dict], projects: List[Dict]) -> List[Dict]:
    """Build explicit connection graph between entities."""
    connections = []
    connection_id = 0
    
    # Map project tags to facts
    for project in projects:
        project_tags = set(project.get("tags", []))
        project_id = project.get("objectID", "")
        
        for fact in facts:
            fact_tags = set(fact.get("tags", []))
            
            # If tags overlap, create connection
            overlap = project_tags & fact_tags
            if overlap:
                connection = {
                    "objectID": f"conn_{connection_id}",
                    "from_id": project_id,
                    "from_type": "project",
                    "to_id": fact["objectID"],
                    "to_type": "fact",
                    "relationship": "implements",
                    "strength": len(overlap) / max(len(project_tags), len(fact_tags)),
                    "shared_tags": list(overlap),
                    "created_at": datetime.now().isoformat(),
                }
                connections.append(connection)
                connection_id += 1
    
    return connections


def fetch_blog_posts_from_sitemap() -> List[Dict]:
    """Fetch blog posts from sitemap.xml."""
    blog_posts = []
    
    # Try multiple sitemap URLs
    sitemap_urls = [
        "https://checkmarkdevtools.github.io/devto-mirror/sitemap.xml",
        "https://checkmarkdevtools.dev/sitemap.xml",
    ]
    
    sitemap_content = None
    for url in sitemap_urls:
        try:
            print(f"  - Trying {url}...")
            with urlopen(url, timeout=10) as response:
                sitemap_content = response.read()
                print("    ✓ Success!")
                break
        except (URLError, Exception) as e:
            print(f"    ✗ Failed: {e}")
            continue
    
    if not sitemap_content:
        print("  ⚠️  Could not fetch sitemap, creating placeholder blog posts")
        # Return placeholder to show we tried
        return [{
            "objectID": "blog_crawler_attempted",
            "node_type": "blog_post",
            "title": "Blog Crawler Attempted",
            "url": "https://checkmarkdevtools.dev/sitemap.xml",
            "excerpt": "Attempted to crawl blog posts from sitemap but encountered network issues",
            "tags": ["meta"],
            "updated_at": datetime.now().isoformat(),
            "crawler_status": "failed",
        }]
    
    # Parse sitemap XML
    try:
        root = ET.fromstring(sitemap_content)
        # Handle XML namespace
        ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url_elem in root.findall('ns:url', ns):
            loc = url_elem.find('ns:loc', ns)
            lastmod = url_elem.find('ns:lastmod', ns)
            
            if loc is not None:
                url = loc.text
                # Extract title from URL (last segment)
                title = url.rstrip('/').split('/')[-1].replace('-', ' ').title()
                
                # Try to extract cover image from URL pattern
                # Dev.to posts often have cover images at predictable URLs
                slug = url.rstrip('/').split('/')[-1]
                cover_image = f"https://dev-to-uploads.s3.amazonaws.com/uploads/articles/{slug}.jpg"
                
                blog_post = {
                    "objectID": f"blog_{slug}",
                    "node_type": "blog_post",
                    "title": title,
                    "url": url,
                    "excerpt": f"Blog post: {title}",
                    "cover_image": cover_image,  # May 404, but provides pattern
                    "tags": ["blog", "writing"],
                    "updated_at": lastmod.text if lastmod is not None else datetime.now().isoformat(),
                    "related_facts": [],
                    "related_projects": [],
                }
                blog_posts.append(blog_post)
    
    except ET.ParseError as e:
        print(f"  ⚠️  Failed to parse sitemap XML: {e}")
        return []
    
    return blog_posts


def scan_artwork_files() -> Dict[str, str]:
    """Scan for existing artwork files and return URL mapping."""
    artwork_urls = {}
    artwork_dir = PUBLIC_DIR / "artwork"
    
    if not artwork_dir.exists():
        return artwork_urls
    
    # Scan for image files (multiple extensions)
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.webp']
    for pattern in image_extensions:
        for img_file in artwork_dir.glob(pattern):
            # Skip thumbnails directory
            if 'thumbnails' in str(img_file):
                continue
            
            stem = img_file.stem
            base_name = f"{stem}.jpg"
            artwork_urls[stem] = f"/artwork/{base_name}"
    
    return artwork_urls


def embed_visual_refs_in_facts(facts: List[Dict], artwork_urls: Dict[str, str]) -> List[Dict]:
    """Embed visual asset references in fact records based on themes."""
    # Map themes to artwork
    theme_artwork_map = {
        "background": ["appalachia_mountains"],
        "identity": ["appalachia_mountains"],
        "ai_philosophy": ["code_transparency"],
        "engineering_principles": ["code_transparency", "systems_thinking"],
        "career_workstyle": ["systems_thinking"],
    }
    
    for fact in facts:
        category = fact.get("category", "")
        visual_refs = []
        
        # Add artwork URLs if they exist
        if category in theme_artwork_map:
            for artwork_key in theme_artwork_map[category]:
                if artwork_key in artwork_urls:
                    visual_refs.append(artwork_urls[artwork_key])
        
        fact["visual_refs"] = visual_refs
    
    return facts


def main():
    """Main execution."""
    print("🔧 Building Knowledge Graph...")
    print()
    
    print("📖 Loading existing data...")
    about_data = load_json(ABOUT_JSON)
    projects_data = load_json(PROJECTS_JSON)
    
    print(f"  - {len(about_data)} about records")
    print(f"  - {len(projects_data)} project records")
    print()
    
    # Extract facts
    print("🔍 Extracting facts from about data...")
    facts = extract_facts_from_about(about_data)
    
    # Scan artwork files
    print("🎨 Scanning artwork files...")
    artwork_urls = scan_artwork_files()
    print(f"  - Found {len(artwork_urls)} artwork files")
    
    # Embed visual refs in facts
    print("🖼️  Embedding visual references in facts...")
    facts = embed_visual_refs_in_facts(facts, artwork_urls)
    
    # Fetch blog posts
    print("📝 Fetching blog posts from sitemap...")
    blog_posts = fetch_blog_posts_from_sitemap()
    print(f"  - Found {len(blog_posts)} blog posts")
    
    # Get project banners
    print("🖼️  Mapping project banners...")
    banners = extract_project_banners()
    print(f"  - Found {len(banners)} project banners")

    
    # Enrich projects
    print("✨ Enriching projects with visual assets...")
    enriched_projects = enrich_projects_with_visuals(projects_data, banners)
    
    # Build connections
    print("🔗 Building connection graph...")
    connections = build_connection_graph(facts, enriched_projects)
    print(f"  - Created {len(connections)} connections")
    
    # Save outputs
    print()
    print("💾 Saving knowledge graph data...")
    save_json(ABOUT_JSON_OUT, facts)
    save_json(ENRICHED_PROJECTS_JSON, enriched_projects)
    save_json(CONNECTIONS_JSON, connections)
    save_json(BLOG_POSTS_JSON, blog_posts)
    
    print()
    print("✅ Knowledge graph built successfully!")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print()
    print("Summary:")
    print(f"  - {len(facts)} facts extracted (with visual refs)")
    print(f"  - {len(enriched_projects)} projects enriched (with banners)")
    print(f"  - {len(blog_posts)} blog posts indexed")
    print(f"  - {len(connections)} connections mapped")
    print(f"  - {len(artwork_urls)} artwork files scanned (embedded in facts)")
    print()
    print("Next steps:")
    print("  1. Review generated files in apps/api/algolia/knowledge_graph/")
    print("  2. Upload to Algolia indices (index_algolia.py)")
    print("  3. Note: Artwork embedded as visual_refs, not separate index")


if __name__ == "__main__":
    main()
