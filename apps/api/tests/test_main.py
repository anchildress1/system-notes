
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
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
