from fastapi.testclient import TestClient
from unittest.mock import patch, mock_open

from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"system": "online", "status": "nominal"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_system_doc_success():
    # Mock file existence and content
    with patch("pathlib.Path.exists", return_value=True), \
         patch("builtins.open", mock_open(read_data="# Test Content")):
        
        response = client.get("/system/doc/test.md")
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "# Test Content"
        assert data["format"] == "markdown"
        assert data["path"] == "test.md"

def test_get_system_doc_not_found():
    with patch("pathlib.Path.exists", return_value=False):
        response = client.get("/system/doc/missing.md")
        assert response.status_code == 404
        assert response.json()["error"] == "Document not found"

def test_get_system_doc_traversal_attempt():
    response = client.get("/system/doc/%2E%2E/secret.env")
    assert response.status_code == 400
    assert response.json()["error"] == "Invalid path"

def test_get_system_doc_error_handling():
    # Simulate an exception during file reading
    with patch("pathlib.Path.exists", return_value=True), \
         patch("builtins.open", side_effect=Exception("Disk error")):
        
        response = client.get("/system/doc/fail.md")
        assert response.status_code == 500
        assert "Disk error" in response.json()["error"]
