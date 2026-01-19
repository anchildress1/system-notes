from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from openai import OpenAI
import logging
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
# Note: Expects OPENAI_API_KEY environment variable
client = OpenAI()

# Load system prompt
# Load system prompt and context
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Base Prompt
    prompt_path = os.path.join(current_dir, "prompts", "system_prompt.md")
    with open(prompt_path, "r") as f:
        base_prompt = f.read()

    # Dynamic Context (Project Narratives)
    projects_path = os.path.join(current_dir, "prompts", "projects.md")
    with open(projects_path, "r") as f:
        projects_content = f.read()

    # Persona Context
    ashley_path = os.path.join(current_dir, "prompts", "about_ashley.md")
    with open(ashley_path, "r") as f:
        ashley_content = f.read()
        
    SYSTEM_PROMPT = f"{base_prompt}\n\n{ashley_content}\n\n{projects_content}"
    
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
        completion = client.chat.completions.create(
            model="gpt-4o",  # Using gpt-4o as proxy for "GPT 5.2" per user request
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message},
            ],
        )
        reply = completion.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        # Fail-safe behavior: graceful degradation
        return ChatResponse(
            reply="That’s outside what I know right now. This chatbot only knows what Ashley explicitly wired in, and she hasn’t taught me that yet."
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

