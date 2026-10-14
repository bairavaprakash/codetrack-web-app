from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.roadmap import Roadmap, UserRoadmapProgress


async def get_roadmaps(db: AsyncSession, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    roadmaps_result = await db.execute(select(Roadmap).order_by(Roadmap.id))
    roadmaps = list(roadmaps_result.scalars().all())

    user_progress_map = {}
    if user_id:
        progress_result = await db.execute(
            select(UserRoadmapProgress).where(UserRoadmapProgress.user_id == user_id)
        )
        for p in progress_result.scalars().all():
            user_progress_map[p.roadmap_slug] = p

    response_items = []
    for r in roadmaps:
        user_p = user_progress_map.get(r.slug)
        completed_topics = user_p.completed_topics if user_p else []
        pct = user_p.progress_percentage if user_p else 0

        response_items.append({
            "id": r.id,
            "slug": r.slug,
            "title": r.title,
            "language": r.language,
            "description": r.description,
            "icon": r.icon,
            "color": r.color,
            "level": r.level,
            "total_topics": r.total_topics,
            "topics": r.topics,
            "created_at": r.created_at,
            "user_progress_percentage": pct,
            "completed_topics": completed_topics,
        })
    return response_items


async def get_roadmap_by_slug(
    db: AsyncSession, slug: str, user_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    result = await db.execute(select(Roadmap).where(Roadmap.slug == slug))
    r = result.scalar_one_or_none()
    if not r:
        return None

    completed_topics = []
    pct = 0
    if user_id:
        p_res = await db.execute(
            select(UserRoadmapProgress).where(
                UserRoadmapProgress.user_id == user_id,
                UserRoadmapProgress.roadmap_slug == slug
            )
        )
        user_p = p_res.scalar_one_or_none()
        if user_p:
            completed_topics = user_p.completed_topics or []
            pct = user_p.progress_percentage

    return {
        "id": r.id,
        "slug": r.slug,
        "title": r.title,
        "language": r.language,
        "description": r.description,
        "icon": r.icon,
        "color": r.color,
        "level": r.level,
        "total_topics": r.total_topics,
        "topics": r.topics,
        "created_at": r.created_at,
        "user_progress_percentage": pct,
        "completed_topics": completed_topics,
    }


async def toggle_topic_completion(
    db: AsyncSession, user_id: int, slug: str, topic_id: str, set_completed: Optional[bool] = None
) -> UserRoadmapProgress:
    # Verify roadmap exists
    r_result = await db.execute(select(Roadmap).where(Roadmap.slug == slug))
    roadmap = r_result.scalar_one_or_none()

    # Get or create progress
    p_result = await db.execute(
        select(UserRoadmapProgress).where(
            UserRoadmapProgress.user_id == user_id,
            UserRoadmapProgress.roadmap_slug == slug
        )
    )
    progress = p_result.scalar_one_or_none()
    if not progress:
        progress = UserRoadmapProgress(
            user_id=user_id,
            roadmap_slug=slug,
            completed_topics=[],
            current_topic_id=topic_id,
            progress_percentage=0,
        )
        db.add(progress)

    completed = list(progress.completed_topics or [])
    if set_completed is True:
        if topic_id not in completed:
            completed.append(topic_id)
    elif set_completed is False:
        if topic_id in completed:
            completed.remove(topic_id)
    else:
        # Toggle
        if topic_id in completed:
            completed.remove(topic_id)
        else:
            completed.append(topic_id)

    progress.completed_topics = completed
    progress.current_topic_id = topic_id

    total = roadmap.total_topics if (roadmap and roadmap.total_topics > 0) else max(len(completed), 1)
    progress.progress_percentage = int((len(completed) / total) * 100)

    await db.commit()
    await db.refresh(progress)
    return progress
