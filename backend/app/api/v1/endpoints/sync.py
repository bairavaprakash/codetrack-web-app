from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.crud.crud_checklist import create_checklist_item
from app.crud.crud_roadmap import toggle_topic_completion
from app.crud.crud_session import create_study_session
from app.crud.crud_task import create_task
from app.models.user import User
from app.schemas.checklist import ChecklistItemCreate
from app.schemas.session import StudySessionCreate
from app.schemas.task import TaskCreate

router = APIRouter()


class SyncPayload(BaseModel):
    tasks: List[TaskCreate] = Field(default_factory=list)
    study_sessions: List[StudySessionCreate] = Field(default_factory=list)
    checklist_items: List[ChecklistItemCreate] = Field(default_factory=list)
    completed_topics: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of {'roadmap_slug': '...', 'topic_id': '...'}"
    )


class SyncResponse(BaseModel):
    synced_tasks_count: int
    synced_sessions_count: int
    synced_checklist_count: int
    synced_topics_count: int
    status: str = "success"


@router.post("/", response_model=SyncResponse, status_code=status.HTTP_200_OK)
async def bulk_sync_offline_data(
    payload: SyncPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reconcile offline drafts, task entries, and study sessions with the server."""
    synced_tasks = 0
    for t_in in payload.tasks:
        await create_task(db, t_in, current_user.id)
        synced_tasks += 1

    synced_sessions = 0
    for s_in in payload.study_sessions:
        await create_study_session(db, s_in, current_user.id)
        synced_sessions += 1

    synced_checklist = 0
    for chk_in in payload.checklist_items:
        await create_checklist_item(db, chk_in, current_user.id)
        synced_checklist += 1

    synced_topics = 0
    for top in payload.completed_topics:
        slug = top.get("roadmap_slug")
        tid = top.get("topic_id")
        if slug and tid:
            await toggle_topic_completion(
                db, current_user.id, slug, tid, set_completed=True
            )
            synced_topics += 1

    return SyncResponse(
        synced_tasks_count=synced_tasks,
        synced_sessions_count=synced_sessions,
        synced_checklist_count=synced_checklist,
        synced_topics_count=synced_topics,
        status="success",
    )
