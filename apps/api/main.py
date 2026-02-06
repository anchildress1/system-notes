from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from werkzeug.utils import secure_filename
import os
import json
import logging
import re
import asyncio
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
import httpx

# Load environment variables
from pathlib import Path
# Load environment variables
# Look for .env in the current directory or parents
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

app = FastAPI(title="System Notes API", version="0.1.0")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.body}")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://anchildress1.dev",
        "https://www.anchildress1.dev",
    ],
    allow_origin_regex=r"https://system-notes-ui-800441415595\..*\.run\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Project(BaseModel):
    id: str
    title: str
    description: str
    github_url: Optional[str] = None


@app.get("/")
async def root():
    return {"system": "online", "status": "nominal"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/projects", response_model=List[Project])
async def get_projects():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, "data", "projects.json")
        
        if not os.path.exists(file_path):
             logger.error("projects.json not found")
             return []

        with open(file_path, "r") as f:
            content = json.load(f)
        
        projects = []
        for item in content:
            # Map JSON fields to Project model
            # objectID -> id
            # title -> title
            # summary -> description
            # url -> github_url
            projects.append(Project(
                id=item.get("objectID"),
                title=item.get("title") or item.get("name"),
                description=item.get("summary") or item.get("what_it_is", ""),
                github_url=item.get("url") or item.get("repo_url")
            ))
            
        return projects
    except Exception as e:
        logger.error(f"Error loading projects: {e}")
        return []


@app.get("/system/doc/{doc_path:path}")
async def get_system_doc(doc_path: str):
    try:
        # Security Rule: Use Library Sanitization (Werkzeug)
        # We split the path user provided and sanitize each component.
        # secure_filename() ensures no component contains separators or traversal chars ('..')
        parts = doc_path.split("/")
        safe_parts = [secure_filename(part) for part in parts if part and part not in (".", "..")]
        
        # If the resulting path list is empty (e.g. user sent "///" or ".."), return error
        if not safe_parts:
             return JSONResponse(status_code=400, content={"error": "Invalid path components"})

        # Reconstruct path using pathlib, anchored to api_root
        api_root = Path(__file__).resolve().parent
        target_path = api_root.joinpath(*safe_parts).resolve()
        
        # Security Rule 2.1: Safe Extensions Only
        # Check the *resolved* path's extension/name just to be sure, although secure_filename handles strictness.
        ALLOWED_EXTENSIONS = {".md", ".json", ".txt"}
        if not any(str(target_path.name).endswith(ext) for ext in ALLOWED_EXTENSIONS):
             logger.warning(f"File access blocked (disallowed extension): {target_path}")
             return JSONResponse(status_code=400, content={"error": "File type not allowed"})
             
        # Security Rule 1.4: Resolve and Verify Root (Defense in Depth)
        if not target_path.is_relative_to(api_root):
             logger.warning(f"Path traversal attempt blocked (escaped root): {doc_path}")
             return JSONResponse(status_code=400, content={"error": "Invalid path resolution"})
        
        if not target_path.is_file():
             return JSONResponse(status_code=404, content={"error": "Document not found"})
             
        content = target_path.read_text(encoding="utf-8")
            
        return {"content": content, "format": "markdown", "path": "/".join(safe_parts)}
    except Exception as e:
        logger.error(f"Error serving doc: {e}")
        return JSONResponse(status_code=500, content={"error": "Internal server error"})


CRAWLY_BASE_URL = "https://crawly.checkmarkdevtools.dev"
CRAWLY_SITEMAP_URL = f"{CRAWLY_BASE_URL}/sitemap.xml"

_blog_cache: dict = {"data": None, "expires": None}


class BlogPost(BaseModel):
    objectID: str
    title: str
    blurb: str = Field(description="Short summary of the blog post")
    fact: str = Field(description="Key insight or takeaway from the post")
    tags: List[str] = []
    projects: List[str] = []
    category: str = "Blog"
    signal: int = Field(default=3, ge=1, le=5)


class BlogPostInternal(BlogPost):
    url: str
    published_date: Optional[str] = None
    reading_time: Optional[str] = None


class BlogSearchResponse(BaseModel):
    results: List[BlogPost]
    total: int
    query: Optional[str] = None


async def fetch_sitemap_urls() -> List[str]:
    logger.info(f"Fetching sitemap from {CRAWLY_SITEMAP_URL}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(CRAWLY_SITEMAP_URL)
            response.raise_for_status()
            root = ET.fromstring(response.text)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            urls = [
                loc.text for loc in root.findall(".//sm:loc", ns)
                if loc.text and "/posts/" in loc.text
            ]
            logger.info(f"Found {len(urls)} post URLs in sitemap")
            return urls
    except Exception as e:
        logger.error(f"Error fetching sitemap: {e}")
        return []


def extract_json_ld(html: str) -> Optional[dict]:
    pattern = r'<script type="application/ld\+json">\s*(\{[^<]+\})\s*</script>'
    matches = re.findall(pattern, html, re.DOTALL)
    for match in matches:
        try:
            data = json.loads(match)
            if data.get("@type") == "Article":
                return data
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON-LD: {e}")
            continue
    return None


def extract_meta_content(html: str, name: str) -> Optional[str]:
    pattern = rf'<meta\s+name="{name}"\s+content="([^"]*)"'
    match = re.search(pattern, html, re.IGNORECASE)
    return match.group(1) if match else None


async def fetch_post_content(client: httpx.AsyncClient, url: str) -> Optional[BlogPostInternal]:
    try:
        logger.info(f"Fetching metadata for {url}")
        response = await client.get(url)
        response.raise_for_status()
        html = response.text
        json_ld = extract_json_ld(html)
        if not json_ld:
            logger.warning(f"Skipping {url}: No JSON-LD found")
            return None

        slug = url.split("/")[-1].replace(".html", "")
        keywords = json_ld.get("keywords", [])
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(",")]

        reading_time = extract_meta_content(html, "reading-time")
        description = json_ld.get("description", "")
        final_url = json_ld.get("mainEntityOfPage", {}).get("@id", url)
        
        logger.info(f"Successfully parsed post: {slug}")

        return BlogPostInternal(
            objectID=f"blog:{slug}",
            title=json_ld.get("headline", ""),
            blurb=final_url,
            fact=description,
            tags=keywords,
            projects=["DEV Blog"],
            category="Blog",
            signal=3,
            url=final_url,
            published_date=json_ld.get("datePublished"),
            reading_time=reading_time,
        )
    except Exception as e:
        logger.warning(f"Failed to fetch post {url}: {e}")
        return None


async def get_all_blog_posts() -> List[BlogPostInternal]:
    global _blog_cache
    now = datetime.now()

    if _blog_cache["data"] and _blog_cache["expires"] and now < _blog_cache["expires"]:
        logger.info(f"Returning {len(_blog_cache['data'])} posts from cache")
        return _blog_cache["data"]

    logger.info("Cache miss or expired. Fetching fresh blog posts...")
    urls = await fetch_sitemap_urls()
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [fetch_post_content(client, url) for url in urls]
        results = await asyncio.gather(*tasks)
        
    posts = [p for p in results if p is not None]

    logger.info(f"Fetched {len(posts)} valid posts")
    _blog_cache["data"] = posts
    _blog_cache["expires"] = now + timedelta(minutes=15)
    return posts


@app.get("/blog/search", response_model=BlogSearchResponse)
async def search_blog_posts(
    q: Optional[str] = Query(None, description="Search query to filter posts"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results to return"),
):
    logger.info(f"Search request: q='{q}', tag='{tag}', limit={limit}")
    
    posts = await get_all_blog_posts()
    logger.info(f"Total posts available for filtering: {len(posts)}")

    if q:
        q_lower = q.lower()
        posts = [
            p for p in posts
            if q_lower in p.title.lower()
            or q_lower in p.blurb.lower()
            or q_lower in p.fact.lower()
            or any(q_lower in t.lower() for t in p.tags)
        ]
        logger.info(f"After query filter: {len(posts)} results")

    if tag and isinstance(tag, str):
        tag_lower = tag.lower()
        posts = [p for p in posts if any(tag_lower in t.lower() for t in p.tags)]
        logger.info(f"After tag filter: {len(posts)} results")

    results = posts[:limit]
    logger.info(f"Returning {len(results)} results")
    
    return BlogSearchResponse(
        results=results,
        total=len(posts),
        query=q,
    )
