from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.crud.crud_session import (
    create_study_session,
    get_session_stats,
    get_study_sessions,
)
from app.models.user import User
from app.schemas.session import (
    SessionStatsResponse,
    StudySessionCreate,
    StudySessionResponse,
)

router = APIRouter()


@router.get("/", response_model=List[StudySessionResponse])
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent study and Pomodoro focus sessions for current user."""
    sessions = await get_study_sessions(db, current_user.id, skip=skip, limit=limit)
    return [StudySessionResponse.model_validate(s) for s in sessions]


@router.post("/", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
async def record_session(
    session_in: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a completed study session or Pomodoro cycle."""
    session = await create_study_session(db, session_in, current_user.id)
    return StudySessionResponse.model_validate(session)


@router.get("/stats", response_model=SessionStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated Pomodoro focus time and language distribution statistics."""
    stats = await get_session_stats(db, current_user.id)
    return stats
