from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="System Notes API", version="0.1.0")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js app
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
    # Mock data for now
    return [
        {
            "id": "climate-impact",
            "title": "Climate Impact Forecasting",
            "description": "Lorem ipsum dolor sit amet, consectetur adips...",
            "github_url": "https://github.com/checkMarkDevTools/climate"
        },
        {
            "id": "green-city",
            "title": "Imagining a Green City",
            "description": "Saentjre arinne in Green in GitHub.",
            "github_url": "https://github.com/checkMarkDevTools/green-city"
        }
    ]
