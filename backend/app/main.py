import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.db.seed import seed_database
from backend.app.routers import trackers, reports, config_deliveries
from backend.app.services.synthesizer import synthesis_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed initial mock data and configurations
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Weekly Report Agent API",
    description="Autonomous weekly reporting agent for engineering teams",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(trackers.router)
app.include_router(reports.router)
app.include_router(config_deliveries.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "weekly-report-agent",
        "openai_configured": synthesis_service.is_llm_available(),
        "model": synthesis_service.model if synthesis_service.is_llm_available() else "deterministic-fallback",
    }


# Serve frontend assets
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
frontend_assets = os.path.join(frontend_dist, "assets")

if os.path.exists(frontend_assets):
    app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "name": "Weekly Report Agent API",
        "status": "online",
        "health": "/api/health",
        "docs": "/docs",
    }
