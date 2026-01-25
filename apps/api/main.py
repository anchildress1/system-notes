from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict, Union
import os
import json
from openai import OpenAI
import logging
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from algoliasearch.search.client import SearchClient

# Load environment variables
load_dotenv()

app = FastAPI(title="System Notes API", version="0.1.0")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.body}")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://anchildress1.dev",
        "https://www.anchildress1.dev",
        "https://system-notes-ui-288489184837.us-east1.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
# Note: Expects OPENAI_API_KEY environment variable
client = OpenAI()

# Initialize Algolia client
ALGOLIA_APP_ID = os.getenv("ALGOLIA_APPLICATION_ID")
ALGOLIA_API_KEY = os.getenv("ALGOLIA_ADMIN_API_KEY") 
algolia_client = SearchClient(ALGOLIA_APP_ID, ALGOLIA_API_KEY) if ALGOLIA_APP_ID and ALGOLIA_API_KEY else None


# Load system prompt
# Load system prompt and context
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Load RAG System Prompt
    rag_prompt_path = os.path.join(current_dir, "algolia", "algolia_prompt.md")
    with open(rag_prompt_path, "r") as f:
        SYSTEM_PROMPT = f.read()
    
except FileNotFoundError as e:
    logger.warning(f"File not found during system prompt init: {e}")
    SYSTEM_PROMPT = "You are a helpful assistant."


class Project(BaseModel):
    id: str
    title: str
    description: str
    github_url: Optional[str] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
async def root():
    return {"system": "online", "status": "nominal"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": request.message},
        ]

        # Define tools
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_indices",
                    "description": "Search for projects, about info, or system docs. Use this when the user asks a question that requires factual knowledge.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query string",
                            },
                            "indices": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["projects", "about", "system_docs"],
                                },
                                "description": "List of indices to search. Defaults to all if unspecified.",
                            },
                        },
                        "required": ["query"],
                    },
                },
            }
        ]

        # First LLM call to decide if tools are needed
        completion = client.chat.completions.create(
            model="gpt-4o",  # Using 4o for better tool calling
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        response_message = completion.choices[0].message
        tool_calls = response_message.tool_calls

        if tool_calls:
            # Append assistant's tool call request to history
            messages.append(response_message)

            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                if function_name == "search_indices":
                    query = function_args.get("query")
                    indices_to_search = function_args.get("indices", ["projects", "about", "system_docs"])
                    
                    search_results = {}
                    
                    if algolia_client:
                        try:
                            # Construct multi-search requests
                            requests = [
                                {
                                    "indexName": index_name,
                                    "query": query,
                                    "hitsPerPage": 25,
                                }
                                for index_name in indices_to_search
                            ]
                            
                            # Execute multi-search
                            response = await algolia_client.search({"requests": requests})
                            
                            # Map results back to index names
                            # response.results is a list corresponding to requests
                            if hasattr(response, 'results'):
                                for i, result in enumerate(response.results):
                                    index_name = indices_to_search[i]
                                    search_results[index_name] = result.hits
                            else:
                                search_results = {"error": "Unexpected response format from Algolia"}
                                
                        except Exception as e:
                            logger.error(f"Algolia search error: {e}")
                            search_results = {"error": str(e)}
                    else:
                        search_results = {"error": "Algolia client not initialized"}

                    # Append tool result to history
                    messages.append(
                        {
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": json.dumps(search_results, default=str),
                        }
                    )

            # Second LLM call to generate final answer with tool outputs
            second_completion = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
            )
            reply = second_completion.choices[0].message.content
        else:
            # No tool called (Fast Path)
            reply = response_message.content

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return ChatResponse(
             reply="I seem to be having trouble connecting to my brain. Must be a network glitch."
        )


def parse_projects(content: str) -> List[Project]:
    projects = []
    current_project = {}
    lines = content.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith("## "):
            if current_project:
                projects.append(Project(**current_project))
            current_project = {
                "id": line[3:]
                .strip()
                .lower()
                .replace(" ", "-")
                .replace(".", "")
                .replace("(", "")
                .replace(")", ""),
                "title": line[3:].strip(),
                "description": "",
                "github_url": None,
            }
        elif line.startswith("**Description**"):
            pass  # Skip the header
        elif line.startswith("**") and not line.startswith("**Description**"):
            pass  # Skip other headers for now
        elif current_project and "description" in current_project:
            # Simple heuristic: append to description if not a header
            if not line.startswith("**") and not line.startswith("---"):
                current_project["description"] += line + " "

    if current_project:
        projects.append(Project(**current_project))

    # Clean up descriptions
    for p in projects:
        p.description = p.description.strip()

    return projects


@app.get("/projects", response_model=List[Project])
async def get_projects():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, "prompts", "projects.md")
        with open(file_path, "r") as f:
            content = f.read()
        return parse_projects(content)
    except FileNotFoundError:
        logger.error("projects.md not found")
        return []


@app.get("/about")
async def get_about():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, "prompts", "about_ashley.md")
        with open(file_path, "r") as f:
            content = f.read()
        return {"content": content}
    except FileNotFoundError:
        logger.error("about_ashley.md not found")
        return {"content": "About content not available."}


@app.get("/system/doc/{file_path:path}")
async def get_system_doc(file_path: str) -> Union[List[Any], Dict[str, Any]]:
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.join(current_dir, "algolia")
        # sanitize and join path
        target_path = os.path.abspath(os.path.join(base_dir, file_path))
        
        logger.info(f"Docs Debug - Request: {file_path}")
        logger.info(f"Docs Debug - Base: {base_dir}")
        logger.info(f"Docs Debug - Target: {target_path}")
        logger.info(f"Docs Debug - Exists: {os.path.exists(target_path)}")

        # Security check: ensure target_path is within base_dir
        if not target_path.startswith(base_dir):
            logger.warning(f"Access attempt outside algolia directory: {file_path}")
            raise HTTPException(status_code=403, detail="Access denied")
            
        if not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail="Document not found")
            
        if not os.path.isfile(target_path):
             raise HTTPException(status_code=400, detail="Not a file")

        # Basic extension check - can be expanded
        if not target_path.lower().endswith(('.json', '.md', '.mmd')):
             raise HTTPException(status_code=400, detail="Unsupported file type")

        with open(target_path, "r") as f:
            # Return raw content to preserve line numbers and formatting for the viewer
            return {"content": f.read(), "format": "text", "path": file_path}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving system doc: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

