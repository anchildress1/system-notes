from fastapi.testclient import TestClient
from unittest.mock import patch, mock_open
from main import app

client = TestClient(app)

MOCK_ABOUT_MD = "# About Me\nI am a developer."

def test_get_about_success():
    with patch("builtins.open", mock_open(read_data=MOCK_ABOUT_MD)):
        response = client.get("/about")
        assert response.status_code == 200
        assert response.json() == {"content": MOCK_ABOUT_MD}

def test_get_about_file_not_found():
    with patch("builtins.open", side_effect=FileNotFoundError):
        response = client.get("/about")
        assert response.status_code == 200
        assert response.json() == {"content": "About content not available."}
