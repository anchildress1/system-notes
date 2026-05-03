import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app, _reset_projects_cache

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clear_cache():
    """Reset the projects in-memory cache before and after every test so
    patches on os.path.exists / Path.read_text are always exercised."""
    _reset_projects_cache()
    yield
    _reset_projects_cache()

MOCK_PROJECTS_JSON = """
[
  {
    "objectID": "project-b",
    "name": "Project B",
    "what_it_is": "Second project description",
    "why_it_exists": "Purpose of project B",
    "long_description": "Long form description of B",
    "outcome": "Outcome of B",
    "status": "Active",
    "owner": "anchildress1",
    "image_url": "/projects/b.jpg",
    "image_alt": "Project B alt text",
    "tech": [{"name": "Python", "role": "Backend"}],
    "blog_posts": [{"title": "Blog Post", "url": "https://example.com/blog"}],
    "repo_url": "https://github.com/example/project-b",
    "order_rank": 20
  },
  {
    "objectID": "project-a",
    "name": "Project A",
    "what_it_is": "First project description",
    "why_it_exists": "Purpose of project A",
    "long_description": "Long form description of A",
    "outcome": "Outcome of A",
    "status": "Active · Deployed",
    "owner": "CheckMarKDevTools",
    "image_url": "/projects/a.jpg",
    "image_alt": "Project A alt text",
    "tech": [{"name": "TypeScript", "role": "Frontend"}],
    "blog_posts": [],
    "repo_url": "https://github.com/example/project-a",
    "order_rank": 10
  }
]
"""

MOCK_MINIMAL_JSON = """
[
  {
    "objectID": "minimal-project",
    "name": "Minimal Project",
    "what_it_is": "A minimal project",
    "repo_url": "https://github.com/example/minimal"
  }
]
"""


def test_get_projects_success():
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_PROJECTS_JSON):
        response = client.get("/projects")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] == "Project A"
        assert "First project description" in data[0]["description"]


def test_get_projects_sorted_by_order_rank():
    """Projects must be returned in ascending order_rank order."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_PROJECTS_JSON):
        response = client.get("/projects")
        assert response.status_code == 200
        data = response.json()
        ranks = [p["order_rank"] for p in data]
        assert ranks == sorted(ranks), "Projects must be sorted by order_rank ascending"


def test_get_projects_full_fields():
    """All display fields must be present in the response."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_PROJECTS_JSON):
        response = client.get("/projects")
        assert response.status_code == 200
        project = response.json()[0]

        assert project["id"] == "project-a"
        assert project["title"] == "Project A"
        assert project["status"] == "Active · Deployed"
        assert project["owner"] == "CheckMarKDevTools"
        assert project["purpose"] == "Purpose of project A"
        assert project["long_description"] == "Long form description of A"
        assert project["outcome"] == "Outcome of A"
        assert project["repo_url"] == "https://github.com/example/project-a"
        assert project["image_url"] == "/projects/a.jpg"
        assert project["image_alt"] == "Project A alt text"
        assert project["tech"] == [{"name": "TypeScript", "role": "Frontend"}]
        assert project["blog_posts"] == []
        assert project["order_rank"] == 10


def test_get_projects_blog_posts():
    """blog_posts field must include title and url."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_PROJECTS_JSON):
        response = client.get("/projects")
        assert response.status_code == 200
        project_b = response.json()[1]

        assert len(project_b["blog_posts"]) == 1
        assert project_b["blog_posts"][0]["title"] == "Blog Post"
        assert project_b["blog_posts"][0]["url"] == "https://example.com/blog"


def test_get_projects_minimal_fields():
    """Projects with only required fields must not raise errors."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_MINIMAL_JSON):
        response = client.get("/projects")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "minimal-project"
        assert data[0]["title"] == "Minimal Project"
        assert data[0]["status"] == ""
        assert data[0]["tech"] == []
        assert data[0]["blog_posts"] == []


def test_get_projects_file_not_found():
    with patch("os.path.exists", return_value=False):
        response = client.get("/projects")
        assert response.status_code == 500
        assert response.json()["error"] == "Projects data unavailable"


def test_get_projects_json_parse_error():
    """Malformed JSON must return 500, not a silent empty list."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value="not valid json"):
        response = client.get("/projects")
        assert response.status_code == 500
        assert response.json()["error"] == "Failed to load projects"


def test_get_projects_sets_cache_control_header():
    """Successful response must carry Cache-Control so Next.js ISR and
    upstream caches can reuse the payload for 5 minutes rather than
    hitting the API on every page render."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_PROJECTS_JSON):
        response = client.get("/projects")
    assert response.status_code == 200
    cc = response.headers.get("cache-control", "")
    assert "public" in cc
    assert "max-age=300" in cc


def test_get_projects_no_cache_control_on_error():
    """Error responses must not carry a Cache-Control header so a transient
    failure is not cached by the client or a CDN."""
    with patch("os.path.exists", return_value=False):
        response = client.get("/projects")
    assert response.status_code == 500
    assert "cache-control" not in response.headers


def test_get_projects_served_from_cache_on_second_call():
    """Second call must return from memory without touching the filesystem."""
    with patch("os.path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value=MOCK_PROJECTS_JSON) as mock_read:
        client.get("/projects")
        client.get("/projects")
        client.get("/projects")
        # read_text called exactly once across all requests
        assert mock_read.call_count == 1
