from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import logging
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse

# Load environment variables
from pathlib import Path
# Load environment variables
# Look for .env in the current directory or parents
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
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
    ],
    allow_origin_regex=r"https://system-notes-ui-800441415595\..*\.run\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Project(BaseModel):
    id: str
    title: str
    description: str
    github_url: Optional[str] = None


@app.get("/")
async def root():
    return {"system": "online", "status": "nominal"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/projects", response_model=List[Project])
async def get_projects():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, "data", "projects.json")
        
        if not os.path.exists(file_path):
             logger.error("projects.json not found")
             return []

        with open(file_path, "r") as f:
            content = json.load(f)
        
        projects = []
        for item in content:
            # Map JSON fields to Project model
            # objectID -> id
            # title -> title
            # summary -> description
            # url -> github_url
            projects.append(Project(
                id=item.get("objectID"),
                title=item.get("title") or item.get("name"),
                description=item.get("summary") or item.get("what_it_is", ""),
                github_url=item.get("url") or item.get("repo_url")
            ))
            
        return projects
    except Exception as e:
        logger.error(f"Error loading projects: {e}")
        return []


@app.get("/system/doc/{doc_path:path}")
async def get_system_doc(doc_path: str):
    try:
        # Security: prevent traversing up and ensure path is within apps/api
        api_root = Path(__file__).resolve().parent
        
        # Join path and resolve it
        # Remove leading slash to prevent absolute path joining
        safe_rel_path = doc_path.lstrip("/")
        target_path = (api_root / safe_rel_path).resolve()
        
        # Verify that the target path is inside the api_root
        # pathlib.Path.is_relative_to() was added in Python 3.9
        if not target_path.is_relative_to(api_root):
             logger.warning(f"Path traversal attempt blocked: {doc_path}")
             return JSONResponse(status_code=400, content={"error": "Invalid path"})
        
        if not target_path.is_file():
             return JSONResponse(status_code=404, content={"error": "Document not found"})
             
        content = target_path.read_text(encoding="utf-8")
            
        return {"content": content, "format": "markdown", "path": doc_path}
    except Exception as e:
        logger.error(f"Error serving doc: {e}")
        # Security: Do not expose raw exception strings to the client
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
