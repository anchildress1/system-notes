import pytest
import json
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
    # We need to simulate the multi-search response structure: results array corresponding to indices
    # indices: ["projects", "about", "system_docs"]
    
    mock_result_proj = MagicMock()
    mock_result_proj.hits = [{"title": "System Notes Project", "objectID": "1", "_rankingInfo": {"userScore": 100}}]
    
    mock_result_about = MagicMock()
    mock_result_about.hits = []
    
    mock_result_docs = MagicMock()
    mock_result_docs.hits = [{"title": "Doc 1", "_rankingInfo": {"userScore": 60}}]
    
    mock_search_response = MagicMock()
    mock_search_response.results = [mock_result_proj, mock_result_about, mock_result_docs]
    
    async def async_return(*args, **kwargs):
        return mock_search_response
    mock_algolia.search.side_effect = async_return

    response = client.post("/chat", json={"message": "Tell me about System Notes"})
    
    assert response.status_code == 200
    assert response.json()["reply"] == "System Notes is this project."
    
    # Verify Algolia was called
    mock_algolia.search.assert_called_once()


def test_chat_failure_mode_zero_matches(mock_openai, mock_algolia):
    # Simulate search tool call
    tool_call = MagicMock()
    tool_call.function.name = "search_indices"
    tool_call.function.arguments = '{"query": "unknown"}'

    first_response = MagicMock()
    first_response.choices[0].message.tool_calls = [tool_call]
    first_response.choices[0].message.content = None
    
    # Second response (simulated LLM reading the system instruction)
    second_response = MagicMock()
    second_response.choices[0].message.content = "No strong matches. Can you clarify?"

    mock_openai.chat.completions.create.side_effect = [first_response, second_response]
    
    # Mock Zero hits
    mock_result_empty = MagicMock()
    mock_result_empty.hits = []
    
    mock_search_response = MagicMock()
    mock_search_response.results = [mock_result_empty, mock_result_empty, mock_result_empty]
    
    async def async_return(*args, **kwargs):
        return mock_search_response
    mock_algolia.search.side_effect = async_return

    response = client.post("/chat", json={"message": "Search unknown"})
    assert response.status_code == 200
    assert "No strong matches" in response.json()["reply"]


def test_chat_capping_logic(mock_openai, mock_algolia):
    # Simulate search tool call
    tool_call = MagicMock()
    tool_call.function.name = "search_indices"
    tool_call.function.arguments = '{"query": "many projects"}'

    first_response = MagicMock()
    first_response.choices[0].message.tool_calls = [tool_call]
    first_response.choices[0].message.content = None
    
    second_response = MagicMock()
    second_response.choices[0].message.content = "Here are the links."
    
    mock_openai.chat.completions.create.side_effect = [first_response, second_response]
    
    # Mock 5 projects (should cap at 2)
    projects = [{"title": f"Proj {i}", "_rankingInfo": {"userScore": 80}} for i in range(5)]
    mock_result_proj = MagicMock()
    mock_result_proj.hits = projects
    
    # Mock 2 Docs (should cap at 1)
    docs = [{"title": f"Doc {i}", "_rankingInfo": {"userScore": 70}} for i in range(2)]
    mock_result_docs = MagicMock()
    mock_result_docs.hits = docs
    
    mock_result_about = MagicMock()
    mock_result_about.hits = []
    
    mock_search_response = MagicMock()
    mock_search_response.results = [mock_result_proj, mock_result_about, mock_result_docs]
    
    async def async_return(*args, **kwargs):
        return mock_search_response
    mock_algolia.search.side_effect = async_return

    client.post("/chat", json={"message": "Show limits"})
    
    # Inspect the tool output passed back to LLM
    # The last call to openai.create contains the history including tool output
    call_args = mock_openai.chat.completions.create.call_args
    messages = call_args[1]["messages"]
    tool_msg = messages[-1]
    content = json.loads(tool_msg["content"])
    
    # Verify Capping
    assert len(content["links_candidates"]) == 3 # 2 proj + 1 doc
    assert len([link for link in content["links_candidates"] if "Proj" in link["title"]]) == 2
    assert len([link for link in content["links_candidates"] if "Doc" in link["title"]]) == 1


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
