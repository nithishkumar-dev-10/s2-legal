import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import ALLOWED_ORIGINS
from models.database import create_tables
from routers import chat, cases, hearings

# Create DB tables on startup
create_tables()

app = FastAPI(
    title="S2 Legal AI Pro",
    description="Python backend for the S2 Legal AI agent system",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # open for dev; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes FIRST — before static file catch-all
app.include_router(chat.router)
app.include_router(cases.router)
app.include_router(hearings.router)


@app.get("/health")
def health():
    return {"status": "ok", "model": "gemini-2.0-flash", "version": "2.0.0"}


# Serve built React frontend from ../frontend/dist
DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """Serve React SPA for any non-API route."""
        file_path = os.path.join(DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST, "index.html"))
