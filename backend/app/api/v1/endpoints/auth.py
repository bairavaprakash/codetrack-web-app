from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.crud.crud_user import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    update_user,
)
from app.models.checklist import DailyChecklist
from app.models.roadmap import UserRoadmapProgress
from app.models.task import Task
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    Token,
)
from app.schemas.user import UserProfileStats, UserResponse, UserUpdate

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    existing_email = await get_user_by_email(db, user_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    existing_username = await get_user_by_username(db, user_in.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose another.",
        )

    user = await create_user(db, user_in)
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with username/email and password."""
    user = await authenticate_user(db, login_data.username_or_email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    payload_in: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a new access token using a valid refresh token."""
    payload = decode_token(payload_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload.get("sub", 0))
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active or exists.",
        )

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserProfileStats)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get profile information and aggregate statistics for the current user."""
    # Tasks count
    total_tasks_res = await db.execute(
        select(func.count(Task.id)).where(Task.user_id == current_user.id)
    )
    total_tasks = total_tasks_res.scalar() or 0

    completed_tasks_res = await db.execute(
        select(func.count(Task.id)).where(
            Task.user_id == current_user.id, Task.status == "completed"
        )
    )
    completed_tasks = completed_tasks_res.scalar() or 0

    # Active roadmaps count
    roadmaps_res = await db.execute(
        select(func.count(UserRoadmapProgress.id)).where(
            UserRoadmapProgress.user_id == current_user.id,
            UserRoadmapProgress.progress_percentage > 0,
        )
    )
    active_roadmaps_count = roadmaps_res.scalar() or 0

    # Today checklist
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_chk_res = await db.execute(
        select(DailyChecklist).where(
            DailyChecklist.user_id == current_user.id,
            DailyChecklist.date == today_str
        )
    )
    today_items = list(today_chk_res.scalars().all())
    today_total_checklist = len(today_items)
    today_completed_checklist = sum(1 for it in today_items if it.is_completed)

    return UserProfileStats(
        user=UserResponse.model_validate(current_user),
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        active_roadmaps_count=active_roadmaps_count,
        total_focus_minutes=current_user.total_focus_minutes or 0,
        today_completed_checklist=today_completed_checklist,
        today_total_checklist=today_total_checklist,
    )


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile info."""
    updated = await update_user(db, current_user, user_in)
    return UserResponse.model_validate(updated)
