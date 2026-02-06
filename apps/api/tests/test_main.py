
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
    # assert response.json()["error"] == "File type not allowed"

    # Scenario 2: Invalid characters
    # "invalid$file.md" -> "invalid_file.md"
    # We simulate that this sanitized file does not exist
    # Re-setup mock target for new call flow if needed, but it's the same object chain logic
    # BUT since we are in the same test function and client is reused, we modify the SAME mock object
    
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


@patch("main.httpx.AsyncClient")
def test_blog_search_returns_posts(mock_client_class):
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    sitemap_response = MagicMock()
    sitemap_response.text = MOCK_SITEMAP
    sitemap_response.raise_for_status = MagicMock()
    
    post_response = MagicMock()
    post_response.text = MOCK_POST_HTML
    post_response.raise_for_status = MagicMock()
    
    mock_client.get = AsyncMock(side_effect=[sitemap_response, post_response, post_response])
    mock_client_class.return_value = mock_client
    
    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "total" in data


@patch("main.httpx.AsyncClient")
def test_blog_search_with_query_filter(mock_client_class):
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    sitemap_response = MagicMock()
    sitemap_response.text = MOCK_SITEMAP
    sitemap_response.raise_for_status = MagicMock()
    
    post_response = MagicMock()
    post_response.text = MOCK_POST_HTML
    post_response.raise_for_status = MagicMock()
    
    mock_client.get = AsyncMock(side_effect=[sitemap_response, post_response, post_response])
    mock_client_class.return_value = mock_client
    
    response = client.get("/blog/search?q=AI")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "AI"


@patch("main.httpx.AsyncClient")
def test_blog_search_with_tag_filter(mock_client_class):
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    sitemap_response = MagicMock()
    sitemap_response.text = MOCK_SITEMAP
    sitemap_response.raise_for_status = MagicMock()
    
    post_response = MagicMock()
    post_response.text = MOCK_POST_HTML
    post_response.raise_for_status = MagicMock()
    
    mock_client.get = AsyncMock(side_effect=[sitemap_response, post_response, post_response])
    mock_client_class.return_value = mock_client
    
    response = client.get("/blog/search?tag=testing")
    assert response.status_code == 200


def test_blog_search_limit_validation():
    response = client.get("/blog/search?limit=100")
    assert response.status_code == 400
    
    response = client.get("/blog/search?limit=0")
    assert response.status_code == 400


@patch("main.httpx.AsyncClient")
def test_blog_search_sitemap_failure(mock_client_class):
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    # Simulate exception when fetching sitemap
    mock_client.get = AsyncMock(side_effect=Exception("Sitemap unreachable"))
    mock_client_class.return_value = mock_client
    
    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert data["results"] == []
    assert data["total"] == 0


@patch("main.httpx.AsyncClient")
def test_blog_search_post_failure(mock_client_class):
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    sitemap_response = MagicMock()
    sitemap_response.text = MOCK_SITEMAP
    sitemap_response.raise_for_status = MagicMock()
    
    # First post fails, second succeeds
    post_response = MagicMock()
    post_response.text = MOCK_POST_HTML
    post_response.raise_for_status = MagicMock()
    
    mock_client.get = AsyncMock(side_effect=[
        sitemap_response, 
        Exception("Post unreachable"), 
        post_response
    ])
    mock_client_class.return_value = mock_client
    
    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    # One post should be skipped, one succeeded
    # But wait, MOCK_SITEMAP has 2 post URLs.
    # We mock side_effect for 3 calls: sitemap, post1, post2.
    # If post1 fails, we expect post2 to be processed.
    assert len(data["results"]) == 1
    assert data["total"] == 1


@patch("main.httpx.AsyncClient")
def test_blog_search_response_shape(mock_client_class):
    # Verify that the response strictly matches the index.json shape
    # i.e., NO url, published_date, or reading_time
    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    sitemap_response = MagicMock()
    sitemap_response.text = MOCK_SITEMAP
    sitemap_response.raise_for_status = MagicMock()
    
    post_response = MagicMock()
    post_response.text = MOCK_POST_HTML
    post_response.raise_for_status = MagicMock()
    
    mock_client.get = AsyncMock(side_effect=[sitemap_response, post_response, post_response])
    mock_client_class.return_value = mock_client
    
    response = client.get("/blog/search")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    
    first_result = data["results"][0]
    expected_keys = {"objectID", "title", "blurb", "fact", "tags", "projects", "category", "signal"}
    assert set(first_result.keys()) == expected_keys
    
    # Explicitly check for exclusion of internal fields
    assert "url" not in first_result
    assert "published_date" not in first_result
    assert "reading_time" not in first_result

    # Verify user-requested field mappings
    assert first_result["projects"] == ["DEV Blog"]
    assert first_result["blurb"] == "https://dev.to/test/test-post-123"
    assert first_result["fact"] == "This is a test description for the blog post about AI tools."

