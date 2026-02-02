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
    with patch("os.path.abspath") as mock_abspath, \
         patch("os.path.dirname") as mock_dirname, \
         patch("os.path.join") as mock_join, \
         patch("os.path.commonpath") as mock_commonpath, \
         patch("os.path.isfile") as mock_isfile, \
         patch("builtins.open", mock_open(read_data="# Test Content")):
        
        # Setup path mocks
        mock_abspath.side_effect = lambda p: f"/root/{p}" if not p.startswith("/") else p
        mock_dirname.return_value = "/root/apps/api"
        mock_join.return_value = "/root/apps/api/test.md"
        mock_commonpath.return_value = "/root/apps/api" # Matches root, so valid
        mock_isfile.return_value = True
        
        response = client.get("/system/doc/test.md")
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "# Test Content"

def test_get_system_doc_not_found():
    with patch("os.path.abspath") as mock_abspath, \
         patch("os.path.dirname") as mock_dirname, \
         patch("os.path.join") as mock_join, \
         patch("os.path.commonpath") as mock_commonpath, \
         patch("os.path.isfile") as mock_isfile:
        
        mock_abspath.side_effect = lambda p: f"/root/{p}" if not p.startswith("/") else p
        mock_dirname.return_value = "/root/apps/api"
        mock_join.return_value = "/root/apps/api/missing.md"
        mock_commonpath.return_value = "/root/apps/api"
        mock_isfile.return_value = False # File not found
        
        response = client.get("/system/doc/missing.md")
        assert response.status_code == 404
        assert response.json()["error"] == "Document not found"

def test_get_system_doc_traversal_attempt():
    with patch("os.path.abspath") as mock_abspath, \
         patch("os.path.dirname") as mock_dirname, \
         patch("os.path.join") as mock_join, \
         patch("os.path.commonpath") as mock_commonpath:
        
        mock_abspath.side_effect = lambda p: f"/root/{p}" if not p.startswith("/") else p
        mock_dirname.return_value = "/root/apps/api"
        mock_join.return_value = "/root/secret.env"
        # commonpath returns /root, which is NOT /root/apps/api
        mock_commonpath.return_value = "/root" 
        
        response = client.get("/system/doc/%2E%2E/secret.env")
        assert response.status_code == 400
        assert response.json()["error"] == "Invalid path"

def test_get_system_doc_error_handling():
    with patch("os.path.abspath") as mock_abspath, \
         patch("os.path.dirname") as mock_dirname, \
         patch("os.path.join") as mock_join, \
         patch("os.path.commonpath") as mock_commonpath, \
         patch("os.path.isfile") as mock_isfile, \
         patch("builtins.open", side_effect=Exception("Disk error")):
        
        mock_abspath.side_effect = lambda p: f"/root/{p}" if not p.startswith("/") else p
        mock_dirname.return_value = "/root/apps/api"
        mock_join.return_value = "/root/apps/api/fail.md"
        mock_commonpath.return_value = "/root/apps/api"
        mock_isfile.return_value = True
        
        response = client.get("/system/doc/fail.md")
        assert response.status_code == 500
        assert response.json()["error"] == "Internal server error"
