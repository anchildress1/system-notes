from fastapi.testclient import TestClient
from unittest.mock import patch, mock_open, MagicMock
from main import app
from pathlib import Path

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
    with patch("main.Path") as mock_path_class:
        mock_api_root = MagicMock(spec=Path)
        mock_target = MagicMock(spec=Path)
        
        # __file__ resolve parent
        mock_path_class.return_value.resolve.return_value.parent = mock_api_root
        
        # api_root / safe_path
        mock_api_root.__truediv__.return_value = mock_target
        mock_target.resolve.return_value = mock_target
        
        mock_target.is_relative_to.return_value = True
        mock_target.exists.return_value = True
        mock_target.is_file.return_value = True
        
        with patch("builtins.open", mock_open(read_data="# Test Content")):
            response = client.get("/system/doc/test.md")
            assert response.status_code == 200
            data = response.json()
            assert data["content"] == "# Test Content"

def test_get_system_doc_not_found():
    with patch("main.Path") as mock_path_class:
        mock_api_root = MagicMock(spec=Path)
        mock_target = MagicMock(spec=Path)
        
        mock_path_class.return_value.resolve.return_value.parent = mock_api_root
        mock_api_root.__truediv__.return_value = mock_target
        mock_target.resolve.return_value = mock_target
        
        mock_target.is_relative_to.return_value = True
        mock_target.exists.return_value = False # Or is_file False
        mock_target.is_file.return_value = False
        
        response = client.get("/system/doc/missing.md")
        assert response.status_code == 404
        assert response.json()["error"] == "Document not found"

def test_get_system_doc_traversal_attempt():
    with patch("main.Path") as mock_path_class:
        mock_api_root = MagicMock(spec=Path)
        mock_target = MagicMock(spec=Path)
        
        mock_path_class.return_value.resolve.return_value.parent = mock_api_root
        mock_api_root.__truediv__.return_value = mock_target
        mock_target.resolve.return_value = mock_target
        
        mock_target.is_relative_to.return_value = False
        
        response = client.get("/system/doc/%2E%2E/secret.env")
        assert response.status_code == 400
        assert response.json()["error"] == "Invalid path"

def test_get_system_doc_error_handling():
    with patch("main.Path") as mock_path_class:
        mock_api_root = MagicMock(spec=Path)
        mock_target = MagicMock(spec=Path)
        
        mock_path_class.return_value.resolve.return_value.parent = mock_api_root
        mock_api_root.__truediv__.return_value = mock_target
        mock_target.resolve.return_value = mock_target
        
        mock_target.is_relative_to.return_value = True
        mock_target.exists.return_value = True
        mock_target.is_file.return_value = True
        
        with patch("builtins.open", side_effect=Exception("Disk error")):
            response = client.get("/system/doc/fail.md")
            assert response.status_code == 500
            assert response.json()["error"] == "Internal server error"
