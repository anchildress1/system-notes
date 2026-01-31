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
OUTPUT_DIR = ALGOLIA_DIR / "knowledge_graph"
PUBLIC_DIR = API_DIR.parent / "web" / "public"

# Input files
ABOUT_JSON = ALGOLIA_DIR / "about" / "index.json"
SYSTEM_DOCS_JSON = ALGOLIA_DIR / "system_docs.json"
PROJECTS_DIR = ALGOLIA_DIR / "projects"

# Blog sitemap
BLOG_SITEMAP_URL = "https://checkmarkdevtools.dev/sitemap.xml"

# Output files
OUTPUT_DIR.mkdir(exist_ok=True)
FACTS_JSON = OUTPUT_DIR / "facts.json"
ARTWORK_JSON = OUTPUT_DIR / "artwork.json"
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
        
        # Add banner and thumbnail if exists
        if slug in banners:
            enriched_project["banner_image"] = banners[slug]["banner_image"]
            enriched_project["thumbnail_url"] = banners[slug]["thumbnail_url"]
        else:
            enriched_project["banner_image"] = None
            enriched_project["thumbnail_url"] = None
        
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


def scan_artwork_directory() -> List[Dict]:
    """Scan for existing artwork files and create records."""
    artwork = []
    artwork_dir = PUBLIC_DIR / "artwork"
    
    # If artwork directory doesn't exist, create placeholder structure
    if not artwork_dir.exists():
        print("  ℹ️  No artwork directory found, will create placeholders")
        return create_placeholder_artwork()
    
    # Scan for image files (multiple extensions)
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.webp']
    for pattern in image_extensions:
        for img_file in artwork_dir.glob(pattern):
            # Skip thumbnails directory
            if 'thumbnails' in str(img_file):
                continue
                
            # Extract metadata from filename (e.g., "appalachian_mountains.jpg")
            stem = img_file.stem
            parts = stem.split('_')
            
            # Always use .jpg for URLs (compressed format)
            base_name = f"{stem}.jpg"
            
            artwork_record = {
                "objectID": f"artwork_{stem}",
                "node_type": "artwork",
                "title": " ".join(parts).title(),
                "medium": "digital",
                "date": datetime.now().strftime("%Y-%m"),
                "theme": parts,  # Use filename parts as themes
                "image_url": f"/artwork/{base_name}",
                "thumbnail_url": f"/artwork/thumbnails/{base_name}",
                "related_facts": [],
                "related_projects": [],
                "description": f"Digital artwork: {' '.join(parts).title()}",
                "tags": ["art", "digital"] + parts,
                "updated_at": datetime.fromtimestamp(img_file.stat().st_mtime).isoformat(),
            }
            artwork.append(artwork_record)
    
    # If no artwork found, create placeholders
    if not artwork:
        return create_placeholder_artwork()
    
    return artwork


def create_placeholder_artwork() -> List[Dict]:
    """Create placeholder artwork records for key themes."""
    artwork = [
        {
            "objectID": "artwork_appalachia_mountains",
            "node_type": "artwork",
            "title": "Appalachian Mountains",
            "medium": "digital",
            "date": "2024-01",
            "theme": ["appalachia", "mountains", "identity", "background"],
            "image_url": "/artwork/appalachia_mountains.jpg",
            "thumbnail_url": "/artwork/thumbnails/appalachia_mountains.jpg",
            "related_facts": ["fact_about.background", "fact_about.identity"],
            "related_projects": ["system-notes"],
            "description": "Digital representation of Appalachian mountain themes and identity connection",
            "tags": ["art", "appalachia", "personal", "identity"],
            "updated_at": "2024-01-01T00:00:00Z",
            "placeholder": True,
        },
        {
            "objectID": "artwork_code_transparency",
            "node_type": "artwork",
            "title": "Code Transparency & Attribution",
            "medium": "digital",
            "date": "2025-01",
            "theme": ["attribution", "transparency", "ai", "visibility"],
            "image_url": "/artwork/code_transparency.jpg",
            "thumbnail_url": "/artwork/thumbnails/code_transparency.jpg",
            "related_facts": ["fact_about.ai_philosophy", "fact_about.engineering_principles"],
            "related_projects": ["rai-lint"],
            "description": "Abstract visualization of AI attribution and code transparency principles",
            "tags": ["art", "ai", "attribution", "engineering"],
            "updated_at": "2025-01-01T00:00:00Z",
            "placeholder": True,
        },
        {
            "objectID": "artwork_systems_thinking",
            "node_type": "artwork",
            "title": "Systems Thinking",
            "medium": "digital",
            "date": "2025-06",
            "theme": ["systems", "architecture", "engineering", "structure"],
            "image_url": "/artwork/systems_thinking.jpg",
            "thumbnail_url": "/artwork/thumbnails/systems_thinking.jpg",
            "related_facts": ["fact_about.engineering_principles", "fact_about.career_workstyle"],
            "related_projects": ["system-notes"],
            "description": "Visual representation of systems-first engineering approach",
            "tags": ["art", "systems", "engineering", "architecture"],
            "updated_at": "2025-06-01T00:00:00Z",
            "placeholder": True,
        },
    ]
    
    return artwork


def main():
    """Main execution."""
    print("🔧 Building Knowledge Graph...")
    print()
    
    # Load existing data
    print("📖 Loading existing data...")
    about_data = load_json(ABOUT_JSON)
    system_docs_data = load_json(SYSTEM_DOCS_JSON)
    
    # Load projects data
    projects_data_file = ALGOLIA_DIR / "projects" / "projects.json"
    
    if projects_data_file.exists():
        projects_data = load_json(projects_data_file)
    else:
        print(f"⚠️  Projects data file not found at {projects_data_file}, using system_docs project records")
        projects_data = [r for r in system_docs_data if r.get("node_type") == "project"]
    
    print(f"  - {len(about_data)} about records")
    print(f"  - {len(system_docs_data)} system doc records")
    print(f"  - {len(projects_data)} project records")
    print()
    
    # Extract facts
    print("🔍 Extracting facts from about data...")
    facts = extract_facts_from_about(about_data)
    
    # Fetch blog posts
    print("📝 Fetching blog posts from sitemap...")
    blog_posts = fetch_blog_posts_from_sitemap()
    print(f"  - Found {len(blog_posts)} blog posts")
    
    # Get project banners
    print("🖼️  Mapping project banners...")
    banners = extract_project_banners()
    print(f"  - Found {len(banners)} project banners")
    
    # Scan artwork
    print("🎨 Scanning artwork directory...")
    artwork = scan_artwork_directory()
    print(f"  - Found {len(artwork)} artwork pieces")
    
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
    save_json(FACTS_JSON, facts)
    save_json(ENRICHED_PROJECTS_JSON, enriched_projects)
    save_json(CONNECTIONS_JSON, connections)
    save_json(ARTWORK_JSON, artwork)
    save_json(BLOG_POSTS_JSON, blog_posts)
    
    print()
    print("✅ Knowledge graph built successfully!")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print()
    print("Summary:")
    print(f"  - {len(facts)} facts extracted")
    print(f"  - {len(enriched_projects)} projects enriched")
    print(f"  - {len(blog_posts)} blog posts indexed")
    print(f"  - {len(artwork)} artwork pieces catalogued")
    print(f"  - {len(connections)} connections mapped")
    print()
    print("Next steps:")
    print("  1. Review generated files in apps/api/algolia/knowledge_graph/")
    print("  2. Add your digital artwork to apps/web/public/artwork/")
    print("  3. Re-run script to pick up artwork files")
    print("  4. Upload to Algolia indices")


if __name__ == "__main__":
    main()
