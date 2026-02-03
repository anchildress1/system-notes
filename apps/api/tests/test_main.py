from fastapi.testclient import TestClient
from unittest.mock import patch
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

# Tests use mocking for pathlib to verify logic without filesystem dependency
# This ensures we test the security controls specifically
@patch("main.Path")
def test_get_system_doc_success(MockPath):
    # Setup the api_root
    mock_root = MockPath.return_value.resolve.return_value.parent
    
    # Setup target path
    mock_target = mock_root.__truediv__.return_value.resolve.return_value
    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = True
    mock_target.read_text.return_value = "# Test Content"
    
    response = client.get("/system/doc/test.md")
    assert response.status_code == 200
    assert response.json()["content"] == "# Test Content"

@patch("main.Path")
def test_get_system_doc_not_found(MockPath):
    mock_root = MockPath.return_value.resolve.return_value.parent
    mock_target = mock_root.__truediv__.return_value.resolve.return_value
    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = False # File not found
    
    response = client.get("/system/doc/missing.md")
    assert response.status_code == 404
    assert response.json()["error"] == "Document not found"

@patch("main.Path")
def test_get_system_doc_traversal_attempt(MockPath):
    mock_root = MockPath.return_value.resolve.return_value.parent
    mock_target = mock_root.__truediv__.return_value.resolve.return_value
    
    # Simulate traversal detection logic
    # We use a simple path to ensure the request reaches the handler, 
    # but the mock forces 'is_relative_to' to be False to test the security check.
    mock_target.is_relative_to.return_value = False
    
    response = client.get("/system/doc/suspicious.env")
    assert response.status_code == 400
    assert response.json()["error"] == "Invalid path"

@patch("main.Path")
def test_get_system_doc_error_handling(MockPath):
    mock_root = MockPath.return_value.resolve.return_value.parent
    mock_target = mock_root.__truediv__.return_value.resolve.return_value
    mock_target.is_relative_to.return_value = True
    mock_target.is_file.return_value = True
    mock_target.read_text.side_effect = Exception("Disk error")
    
    response = client.get("/system/doc/fail.md")
    assert response.status_code == 500
    assert response.json()["error"] == "Internal server error"
