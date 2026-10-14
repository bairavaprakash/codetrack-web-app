from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.crud.crud_roadmap import (
    get_roadmap_by_slug,
    get_roadmaps,
    toggle_topic_completion,
)
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapResponse,
    TopicCompleteToggle,
    UserRoadmapProgressResponse,
)

router = APIRouter()


@router.get("/", response_model=List[RoadmapResponse])
async def list_roadmaps(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all available roadmaps with user progress if authenticated."""
    user_id = current_user.id if current_user else None
    roadmaps = await get_roadmaps(db, user_id=user_id)
    return [RoadmapResponse.model_validate(r) for r in roadmaps]


@router.get("/{slug}", response_model=RoadmapResponse)
async def get_roadmap_detail(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a specific roadmap and its syllabus topics."""
    user_id = current_user.id if current_user else None
    roadmap = await get_roadmap_by_slug(db, slug=slug, user_id=user_id)
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Roadmap with slug '{slug}' not found",
        )
    return RoadmapResponse.model_validate(roadmap)


@router.post("/{slug}/topics/{topic_id}/toggle", response_model=UserRoadmapProgressResponse)
async def toggle_topic(
    slug: str,
    topic_id: str,
    body: Optional[TopicCompleteToggle] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle or set the completion status of a topic in a roadmap."""
    set_completed = body.completed if body else None
    progress = await toggle_topic_completion(
        db,
        user_id=current_user.id,
        slug=slug,
        topic_id=topic_id,
        set_completed=set_completed,
    )
    return UserRoadmapProgressResponse.model_validate(progress)
