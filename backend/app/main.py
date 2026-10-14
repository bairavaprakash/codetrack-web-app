from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.initial_data import seed_initial_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize tables and seed default roadmaps and demo user
    await seed_initial_data()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade REST API backend for CodeTrack - Daily Task Planner, Reminders, and Coding Learning App",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "api_docs": "/docs",
        "endpoints": f"{settings.API_V1_STR}",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "codetrack-backend",
        "database": "connected",
    }
