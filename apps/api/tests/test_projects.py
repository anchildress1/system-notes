from fastapi.testclient import TestClient
from unittest.mock import patch, mock_open
from main import app

client = TestClient(app)

MOCK_PROJECTS_JSON = """
[
  {
    "objectID": "1",
    "name": "Project One",
    "what_it_is": "A test project description",
    "repo_url": "http://example.com"
  }
]
"""

def test_get_projects_success():
    with patch("builtins.open", mock_open(read_data=MOCK_PROJECTS_JSON)):
        response = client.get("/projects")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Project One"
        assert "test project description" in data[0]["description"].lower()

def test_get_projects_file_not_found():
    with patch("builtins.open", side_effect=FileNotFoundError):
        response = client.get("/projects")
        assert response.status_code == 200 # It returns empty list on error per main.py logic
        assert response.json() == []

def test_parse_projects_logic():
    # Test specific parsing logic if needed, but integration test covers it mostly.
    # We can test detailed parsing if the main.py logic is complex.
    pass
