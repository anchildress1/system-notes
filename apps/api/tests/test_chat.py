from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


def test_chat_endpoint_contract_success():
    """
    Test that the /chat endpoint follows the contract:
    - Input: {"message": "string"}
    - Output: {"reply": "string"}
    """
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_message = MagicMock()
    mock_message.content = "This is a mocked response."
    mock_choice.message = mock_message
    mock_completion.choices = [mock_choice]

    with patch("main.client.chat.completions.create", return_value=mock_completion):
        response = client.post("/chat", json={"message": "Hello"})

        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert data["reply"] == "This is a mocked response."


def test_chat_endpoint_validation_error():
    """
    Test strict contract enforcement (validation error on missing field).
    """
    response = client.post("/chat", json={})  # Missing 'message'
    assert response.status_code == 400


def test_chat_endpoint_failsafe():
    """
    Test that the endpoint gracefully handles OpenAI errors (fail-safe).
    """
    with patch(
        "main.client.chat.completions.create", side_effect=Exception("OpenAI Down")
    ):
        response = client.post("/chat", json={"message": "Hello"})

        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "outside what I know" in data["reply"]
