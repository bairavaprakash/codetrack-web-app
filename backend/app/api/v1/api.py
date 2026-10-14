from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    checklist,
    roadmaps,
    sessions,
    sync,
    tasks,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(roadmaps.router, prefix="/roadmaps", tags=["Roadmaps"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Study Sessions"])
api_router.include_router(checklist.router, prefix="/checklist", tags=["Checklist"])
api_router.include_router(sync.router, prefix="/sync", tags=["Offline Sync"])
