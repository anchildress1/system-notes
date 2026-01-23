import pytest
from unittest.mock import MagicMock

# Mock OpenAI Client entirely to avoid actual API calls during tests
@pytest.fixture(autouse=True)
def mock_openai_env(monkeypatch):
    """Automatically set dummy API key for all tests."""
    monkeypatch.setenv("OPENAI_API_KEY", "dummy-test-key")

@pytest.fixture(autouse=True)
def mock_openai_client(monkeypatch):
    """Mock the OpenAI client to prevent initialization errors."""
    mock_client = MagicMock()
    # Mock the chat.completions.create method
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content="Mocked response"))]
    mock_client.chat.completions.create.return_value = mock_completion
    
    # Patch the OpenAI class itself to return our mock client
    monkeypatch.setattr("openai.OpenAI", MagicMock(return_value=mock_client))
