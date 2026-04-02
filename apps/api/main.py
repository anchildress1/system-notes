from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Annotated, List, Optional
from werkzeug.utils import secure_filename
import os
import json
import logging
import re
import asyncio
import defusedxml.ElementTree as ET
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
import httpx
import time as _time

from pathlib import Path

# Load environment variables from .env in the current directory or parents
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

app = FastAPI(title="System Notes API", version="0.1.0")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _sanitize_log(value: object) -> str:
    """Strip newlines from user-controlled values to prevent log injection (S5145)."""
    return str(value).replace('\n', '\\n').replace('\r', '\\r')

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("Validation error: %s", _sanitize_log(exc.body))
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
        "https://unstable.anchildress1.dev",
    ],
    allow_origin_regex=r"https://system-notes-ui-\d+\..*\.run\.app",
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = _time.perf_counter()
    response = await call_next(request)
    duration_ms = round((_time.perf_counter() - start) * 1000, 1)
    logger.info(
        "%s %s -> %s (%sms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


class TechItem(BaseModel):
    name: str
    role: str


class ProjectBlogLink(BaseModel):
    title: str
    url: str


class Project(BaseModel):
    id: str
    title: str
    status: str = ""
    description: str
    purpose: str = ""
    long_description: str = ""
    outcome: str = ""
    tech: List[TechItem] = []
    repo_url: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    owner: str = ""
    blog_posts: List[ProjectBlogLink] = []
    order_rank: int = 999


@app.get("/")
async def root():
    return {"system": "online", "status": "nominal"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


def _parse_project_item(item: dict) -> Project:
    """Map a raw JSON dict to a Project model — extracted to reduce cognitive complexity (S3776)."""
    return Project(
        id=item.get("objectID", ""),
        title=item.get("name", ""),
        status=item.get("status", ""),
        description=item.get("what_it_is", ""),
        purpose=item.get("why_it_exists", ""),
        long_description=item.get("long_description", ""),
        outcome=item.get("outcome", ""),
        tech=[TechItem(**t) for t in item.get("tech", [])],
        repo_url=item.get("repo_url"),
        image_url=item.get("image_url"),
        image_alt=item.get("image_alt"),
        owner=item.get("owner", ""),
        blog_posts=[ProjectBlogLink(**b) for b in item.get("blog_posts", [])],
        order_rank=item.get("order_rank", 999),
    )


@app.get("/projects", response_model=List[Project])
async def get_projects():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, "data", "projects.json")

    if not os.path.exists(file_path):
        logger.error("projects.json not found")
        return JSONResponse(status_code=500, content={"error": "Projects data unavailable"})

    try:
        raw = await asyncio.to_thread(Path(file_path).read_text, encoding="utf-8")
        content = json.loads(raw)
        projects = [_parse_project_item(item) for item in content]
        projects.sort(key=lambda p: p.order_rank)
        return projects
    except Exception as e:
        logger.error("Error loading projects: %s", e)
        return JSONResponse(status_code=500, content={"error": "Failed to load projects"})


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
             logger.warning("File access blocked (disallowed extension): %s", target_path)
             return JSONResponse(status_code=400, content={"error": "File type not allowed"})

        # Security Rule 1.4: Resolve and Verify Root (Defense in Depth)
        if not target_path.is_relative_to(api_root):
             logger.warning("Path traversal attempt blocked (escaped root)")
             return JSONResponse(status_code=400, content={"error": "Invalid path resolution"})

        if not target_path.is_file():
             return JSONResponse(status_code=404, content={"error": "Document not found"})

        content = await asyncio.to_thread(target_path.read_text, encoding="utf-8")

        return {"content": content, "format": "markdown", "path": "/".join(safe_parts)}
    except Exception as e:
        logger.error("Error serving doc: %s", e)
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
CRAWLY_BASE_URL = "https://crawly.checkmarkdevtools.dev"
CRAWLY_SITEMAP_URL = f"{CRAWLY_BASE_URL}/sitemap.xml"

_blog_cache: dict = {"data": None, "expires": None}


class BlogPost(BaseModel):
    objectID: str
    title: str
    blurb: str = Field(description="Short summary of the blog post")
    fact: str = Field(description="Key insight or takeaway from the post")
    url: Optional[str] = None
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
    logger.info("Fetching sitemap from %s", CRAWLY_SITEMAP_URL)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(CRAWLY_SITEMAP_URL)
            response.raise_for_status()
            root = ET.fromstring(response.text)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}  # NOSONAR(S5332) - XML namespace identifier, not a network request
            urls = [
                loc.text for loc in root.findall(".//sm:loc", ns)
                if loc.text and "/posts/" in loc.text
            ]
            logger.info("Found %s post URLs in sitemap", len(urls))
            return urls
    except Exception as e:
        logger.error("Error fetching sitemap: %s", e)
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
            logger.warning("Failed to parse JSON-LD: %s", e)
            continue
    return None


def extract_meta_content(html: str, name: str) -> Optional[str]:
    pattern = rf'<meta\s+name="{name}"\s+content="([^"]*)"'
    match = re.search(pattern, html, re.IGNORECASE)
    return match.group(1) if match else None


async def fetch_post_content(client: httpx.AsyncClient, url: str) -> Optional[BlogPostInternal]:
    try:
        logger.info("Fetching metadata for %s", url)
        response = await client.get(url)
        response.raise_for_status()
        html = response.text
        json_ld = extract_json_ld(html)
        if not json_ld:
            logger.warning("Skipping %s: No JSON-LD found", url)
            return None

        slug = url.split("/")[-1].replace(".html", "")
        keywords = json_ld.get("keywords", [])
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(",")]

        reading_time = extract_meta_content(html, "reading-time")
        description = json_ld.get("description", "")
        final_url = json_ld.get("mainEntityOfPage", {}).get("@id", url)

        logger.info("Successfully parsed post: %s", slug)

        return BlogPostInternal(
            objectID=f"blog:{slug}",
            title=json_ld.get("headline", ""),
            blurb=description,
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
        logger.warning("Failed to fetch post %s: %s", url, e)
        return None


async def get_all_blog_posts() -> List[BlogPostInternal]:
    global _blog_cache
    now = datetime.now()

    if _blog_cache["data"] and _blog_cache["expires"] and now < _blog_cache["expires"]:
        logger.info("Returning %s posts from cache", len(_blog_cache['data']))
        return _blog_cache["data"]

    logger.info("Cache miss or expired. Fetching fresh blog posts...")
    urls = await fetch_sitemap_urls()

    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [fetch_post_content(client, url) for url in urls]
        results = await asyncio.gather(*tasks)

    posts = [p for p in results if p is not None]
    posts.sort(key=lambda x: x.published_date or "", reverse=True)

    logger.info("Fetched %s valid posts", len(posts))
    if posts:
        _blog_cache["data"] = posts
        _blog_cache["expires"] = now + timedelta(minutes=15)
    return posts


@app.get("/blog/search", response_model=BlogSearchResponse)
async def search_blog_posts(
    q: Annotated[Optional[str], Query(description="Search query to filter posts")] = None,
    tag: Annotated[Optional[str], Query(description="Filter by tag")] = None,
    limit: Annotated[int, Query(ge=1, le=50, description="Maximum results to return")] = 3,
):
    logger.info("Search request: q_present=%s, tag_present=%s, limit=%s", bool(q), bool(tag), limit)

    posts = await get_all_blog_posts()
    logger.info("Total posts available for filtering: %s", len(posts))

    if q:
        q_lower = q.lower()
        posts = [
            p for p in posts
            if q_lower in p.title.lower()
            or q_lower in p.blurb.lower()
            or q_lower in p.fact.lower()
            or any(q_lower in t.lower() for t in p.tags)
        ]
        logger.info("After query filter: %s results", len(posts))

    if tag and isinstance(tag, str):
        tag_lower = tag.lower()
        posts = [p for p in posts if any(tag_lower in t.lower() for t in p.tags)]
        logger.info("After tag filter: %s results", len(posts))

    results = posts[:limit]
    logger.info("Returning %s results", len(results))

    return BlogSearchResponse(
        results=results,
        total=len(posts),
        query=q,
    )
