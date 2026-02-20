
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from main import app, _blog_cache, extract_json_ld, extract_meta_content
import pytest

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"system": "online", "status": "nominal"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("main.Path")
def test_get_system_doc_success(MockPath):
    # Construct the mock chain carefully
    mock_path_instance = MockPath.return_value
    mock_resolved_root = mock_path_instance.resolve.return_value
    mock_parent = mock_resolved_root.parent

    # Target path resulting from joinpath
    mock_target = MagicMock()
    mock_parent.joinpath.return_value.resolve.return_value = mock_target

    # Configure target behavior
    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = True
    mock_target.read_text.return_value = "# Test Content"
    # Configure name property to satisfy extension check
    mock_target.name = "test.md"

    response = client.get("/system/doc/test.md")
    assert response.status_code == 200
    assert response.json()["content"] == "# Test Content"

@patch("main.Path")
def test_get_system_doc_not_found(MockPath):
    mock_parent = MockPath.return_value.resolve.return_value.parent
    mock_target = MagicMock()
    mock_parent.joinpath.return_value.resolve.return_value = mock_target

    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = False
    mock_target.name = "missing.md"

    response = client.get("/system/doc/missing.md")
    assert response.status_code == 404
    assert response.json()["error"] == "Document not found"

@patch("main.Path")
def test_get_system_doc_traversal_attempt(MockPath):
    mock_parent = MockPath.return_value.resolve.return_value.parent
    mock_target = MagicMock()
    mock_parent.joinpath.return_value.resolve.return_value = mock_target

    # Scenario 1: Traversal via ".."
    # werkzeug.secure_filename("..") -> ignored/empty.
    # "secret.env" remains.
    # target path becomes .../secret.env
    mock_target.name = "secret.env"

    response = client.get("/system/doc/../secret.env")
    assert response.status_code in [400, 404]

    # Scenario 2: Invalid characters
    mock_target.name = "invalid_file.md"
    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = False

    response = client.get("/system/doc/invalid$file.md")
    assert response.status_code == 404
    assert response.json()["error"] == "Document not found"

    # Scenario 3: Safe extension check
    mock_target.name = "safe.py"
    response = client.get("/system/doc/safe.py")
    assert response.status_code == 400
    assert response.json()["error"] == "File type not allowed"

@patch("main.Path")
def test_get_system_doc_error_handling(MockPath):
    mock_parent = MockPath.return_value.resolve.return_value.parent
    mock_target = MagicMock()
    mock_parent.joinpath.return_value.resolve.return_value = mock_target

    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = True
    mock_target.name = "fail.md"
    mock_target.read_text.side_effect = Exception("Disk error")

    response = client.get("/system/doc/fail.md")
    assert response.status_code == 500
    assert response.json()["error"] == "Internal server error"


# --- Blog search test data and fixtures ---

MOCK_SITEMAP = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://crawly.checkmarkdevtools.dev/</loc></url>
  <url><loc>https://crawly.checkmarkdevtools.dev/posts/test-post-123.html</loc></url>
  <url><loc>https://crawly.checkmarkdevtools.dev/posts/another-post-456.html</loc></url>
</urlset>'''

MOCK_POST_HTML = '''<!doctype html><html><head>
<meta name="reading-time" content="5 minutes">
<script type="application/ld+json">
{"@context": "https://schema.org", "@type": "Article", "headline": "Test Post Title",
"description": "This is a test description for the blog post about AI tools.",
"keywords": ["ai", "testing", "devtools"],
"datePublished": "2026-01-15T10:00:00Z",
"mainEntityOfPage": {"@id": "https://dev.to/test/test-post-123"}}
</script>
</head><body><h1>Test Post</h1></body></html>'''


def test_extract_json_ld():
    result = extract_json_ld(MOCK_POST_HTML)
    assert result is not None
    assert result["@type"] == "Article"
    assert result["headline"] == "Test Post Title"


def test_extract_json_ld_no_match():
    result = extract_json_ld("<html><body>No JSON-LD</body></html>")
    assert result is None


def test_extract_meta_content():
    result = extract_meta_content(MOCK_POST_HTML, "reading-time")
    assert result == "5 minutes"


def test_extract_meta_content_no_match():
    result = extract_meta_content(MOCK_POST_HTML, "nonexistent")
    assert result is None


@pytest.fixture(autouse=True)
def clear_blog_cache():
    _blog_cache["data"] = None
    _blog_cache["expires"] = None
    yield
    _blog_cache["data"] = None
    _blog_cache["expires"] = None


def _make_mock_httpx_client(get_side_effect):
    """Create a configured mock httpx.AsyncClient with the given GET side effects."""
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.get = AsyncMock(side_effect=get_side_effect)
    return mock_client


def _make_mock_response(text):
    """Create a mock httpx response with the given text body."""
    resp = MagicMock()
    resp.text = text
    resp.status_code = 200
    resp.raise_for_status = MagicMock()
    return resp


@pytest.fixture
def mock_blog_client():
    """Fixture that patches httpx.AsyncClient and provides a helper to configure responses.

    Usage:
        def test_something(mock_blog_client):
            mock_blog_client([sitemap_resp, post1_resp, post2_resp])
    """
    with patch("main.httpx.AsyncClient") as mock_class:
        def configure(side_effects):
            mock = _make_mock_httpx_client(side_effects)
            mock_class.return_value = mock
            return mock
        yield configure


@pytest.fixture
def standard_blog_responses():
    """Pre-built sitemap + post responses for the common case."""
    sitemap = _make_mock_response(MOCK_SITEMAP)
    post = _make_mock_response(MOCK_POST_HTML)
    return sitemap, post


# --- Blog search tests ---

def test_blog_search_returns_posts(mock_blog_client, standard_blog_responses):
    sitemap, post = standard_blog_responses
    mock_blog_client([sitemap, post, post])

    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "total" in data


def test_blog_search_with_query_filter(mock_blog_client, standard_blog_responses):
    sitemap, post = standard_blog_responses
    mock_blog_client([sitemap, post, post])

    response = client.get("/blog/search?q=AI")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "AI"


def test_blog_search_with_tag_filter(mock_blog_client, standard_blog_responses):
    sitemap, post = standard_blog_responses
    mock_blog_client([sitemap, post, post])

    response = client.get("/blog/search?tag=testing")
    assert response.status_code == 200


def test_blog_search_limit_validation():
    response = client.get("/blog/search?limit=100")
    assert response.status_code == 400

    response = client.get("/blog/search?limit=0")
    assert response.status_code == 400


def test_blog_search_sitemap_failure(mock_blog_client):
    mock_blog_client([Exception("Sitemap unreachable")])

    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert data["results"] == []
    assert data["total"] == 0


def test_blog_search_post_failure(mock_blog_client, standard_blog_responses):
    sitemap, post = standard_blog_responses
    mock_blog_client([sitemap, Exception("Post unreachable"), post])

    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    assert data["total"] == 1


def test_cors_headers_present_on_allowed_origin():
    """CORS should include Access-Control-Allow-Origin for allowed origins."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_cors_restricts_methods():
    """CORS should only allow GET and OPTIONS methods."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    allowed = response.headers.get("access-control-allow-methods", "")
    assert "GET" in allowed
    # POST/PUT/DELETE should not be allowed
    assert "POST" not in allowed
    assert "DELETE" not in allowed


def test_get_system_doc_empty_path():
    """Empty path components should be rejected."""
    response = client.get("/system/doc/")
    # FastAPI returns 404 for unmatched route or 400 for empty path
    assert response.status_code in [307, 400, 404, 405]


def test_blog_search_negative_limit():
    """Negative limit should be rejected by Pydantic validation."""
    response = client.get("/blog/search?limit=-1")
    assert response.status_code == 400


def test_blog_cache_returns_cached_data(mock_blog_client, standard_blog_responses):
    """Second request should hit cache (no new HTTP calls)."""
    sitemap, post = standard_blog_responses
    mock_blog_client([sitemap, post, post])

    # First request populates cache
    response1 = client.get("/blog/search")
    assert response1.status_code == 200

    # Second request should use cache
    response2 = client.get("/blog/search")
    assert response2.status_code == 200
    assert response2.json()["total"] == response1.json()["total"]


def test_extract_json_ld_malformed():
    """Malformed JSON in JSON-LD script tag should return None."""
    html = '<script type="application/ld+json">{ broken json }</script>'
    result = extract_json_ld(html)
    assert result is None


def test_extract_json_ld_non_article_type():
    """JSON-LD with non-Article type should be skipped."""
    html = '<script type="application/ld+json">{"@type": "WebPage", "name": "Test"}</script>'
    result = extract_json_ld(html)
    assert result is None


def test_blog_search_response_shape(mock_blog_client, standard_blog_responses):
    sitemap, post = standard_blog_responses
    mock_blog_client([sitemap, post, post])

    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0

    first_result = data["results"][0]
    expected_keys = {"objectID", "title", "blurb", "fact", "tags", "projects", "category", "signal", "url"}
    assert set(first_result.keys()) == expected_keys

    # Explicitly check for exclusion of internal fields
    assert "url" in first_result
    assert "published_date" not in first_result
    assert "reading_time" not in first_result

    # Verify user-requested field mappings
    assert first_result["projects"] == ["DEV Blog"]
    assert first_result["blurb"] == "https://dev.to/test/test-post-123"
    assert first_result["fact"] == "This is a test description for the blog post about AI tools."
    assert first_result["url"] == "https://dev.to/test/test-post-123"
