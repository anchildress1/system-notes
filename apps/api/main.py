from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict, Union
import os
import json
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
        file_path = os.path.join(current_dir, "algolia", "projects", "projects.json")
        
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
                title=item.get("title"),
                description=item.get("summary", ""),
                github_url=item.get("url")
            ))
            
        return projects
    except Exception as e:
        logger.error(f"Error loading projects: {e}")
        return []


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


