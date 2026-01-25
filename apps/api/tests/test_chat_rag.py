import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def mock_openai():
    with patch("main.client") as mock:
        yield mock

@pytest.fixture
def mock_algolia():
    with patch("main.algolia_client") as mock:
        yield mock

def test_chat_fast_path(mock_openai):
    # Simulate greeting where no tool is called
    mock_completion = MagicMock()
    mock_completion.choices[0].message.tool_calls = None
    mock_completion.choices[0].message.content = "Hi there!"
    mock_openai.chat.completions.create.return_value = mock_completion

    response = client.post("/chat", json={"message": "Hi"})
    assert response.status_code == 200
    assert response.json()["reply"] == "Hi there!"

def test_chat_search_path(mock_openai, mock_algolia):
    # Simulate search tool call
    tool_call = MagicMock()
    tool_call.id = "call_123"
    tool_call.function.name = "search_indices"
    tool_call.function.arguments = '{"query": "system notes", "indices": ["projects"]}'

    # First response: Tool call
    first_response = MagicMock()
    first_response.choices[0].message.tool_calls = [tool_call]
    first_response.choices[0].message.content = None

    # Second response: Final answer
    second_response = MagicMock()
    second_response.choices[0].message.content = "System Notes is this project."

    mock_openai.chat.completions.create.side_effect = [first_response, second_response]

    # Mock Algolia search result
    # response.results needs to be a list of objects with .hits property
    mock_result = MagicMock()
    mock_result.hits = [{"title": "System Notes"}]
    
    mock_search_response = MagicMock()
    mock_search_response.results = [mock_result]
    
    mock_algolia.search.return_value = mock_search_response

    # Since main.py uses await, we need the mock return value to be awaitable if it wasn't mocked as AsyncMock automatically
    # But usually MagicMock isn't awaitable. We should use AsyncMock if possible or simulate it.
    # However, patch("main.algolia_client") creates a MagicMock.
    # To fix await in main.py call: await algolia_client.search(...)
    # We need mock_algolia.search to be an AsyncMock or return a future.
    # We can use AsyncMock explicitly in the fixture or here.

    # Let's verify if main.py imports SearchClient which is a class.
    # The fixture mocks the instance 'algolia_client'.
    
    # We need to make sure search returns an awaitable.
    async def async_return(*args, **kwargs):
        return mock_search_response
    mock_algolia.search.side_effect = async_return

    response = client.post("/chat", json={"message": "Tell me about System Notes"})
    
    assert response.status_code == 200
    assert response.json()["reply"] == "System Notes is this project."
    
    # Verify Algolia was called
    mock_algolia.search.assert_called_once()


def test_chat_algolia_error_handling(mock_openai, mock_algolia):
    # Simulate search tool call
    tool_call = MagicMock()
    tool_call.function.name = "search_indices"
    tool_call.function.arguments = '{"query": "fail"}'

    first_response = MagicMock()
    first_response.choices[0].message.tool_calls = [tool_call]
    
    second_response = MagicMock()
    second_response.choices[0].message.content = "I found nothing due to error."

    mock_openai.chat.completions.create.side_effect = [first_response, second_response]
    
    # Simulate Algolia error
    # To raise exception in async call
    async def async_raise(*args, **kwargs):
        raise Exception("Algolia down")
    
    mock_algolia.search.side_effect = async_raise

    response = client.post("/chat", json={"message": "Search broken"})
    
    assert response.status_code == 200
    # Steps: 
    # 1. LLM requests tool
    # 2. Tool execution catches exception and returns error JSON
    # 3. LLM sees error JSON and generates reply
    # We verify that main.py didn't crash
