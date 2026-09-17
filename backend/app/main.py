import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, events, photos, galleries

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("photosharing")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Photo Sharing Platform backend...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down Photo Sharing Platform backend...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Collaborative event photo sharing platform with Admin curation and PIN-protected public customer galleries.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev and deployment testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers under /api (canonical) and root / (resilient fallback)
for router in [auth.router, events.router, photos.router, galleries.router]:
    app.include_router(router, prefix="/api")
    app.include_router(router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "version": "1.0.0"
    }
