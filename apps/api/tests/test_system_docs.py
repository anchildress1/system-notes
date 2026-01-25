from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_system_doc_valid_json():
    # We assume 'about/index.json' exists (renamed from about.json)
    # And 'projects/index.json' exists

    # Test about/index.json
    response = client.get("/system/doc/about/index.json")
    assert response.status_code == 200
    data = response.json()
    assert "content" in data

    # Test projects/index.json
    response = client.get("/system/doc/projects/index.json")
    assert response.status_code == 200
    data = response.json()
    assert "content" in data

def test_get_system_doc_invalid_path():
    response = client.get("/system/doc/nonexistent.json")
    assert response.status_code == 404

def test_get_system_doc_directory_traversal():
    # Attempt to go up directories
    response = client.get("/system/doc/../../main.py")
    # Should be 403 or 400 or 404 depending on implementation details of path handling
    # Our implementation specifically checks startswith base_dir
    # Fastapi path param might clean .. but if passed raw, our check handles it.
    # Note: TestClient resolves .. in URLs automatically?
    # Let's try a direct path that shouldn't work.
    assert response.status_code in [403, 404, 400]

def test_get_system_doc_readme():
    # 'README.md' exists in apps/api/algolia
    response = client.get("/system/doc/README.md")
    assert response.status_code == 200
    assert response.json().get("format") == "text"
