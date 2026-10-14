from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.crud.crud_task import (
    create_task,
    delete_task,
    duplicate_task,
    get_task,
    get_tasks,
    toggle_subtask,
    toggle_task_status,
    update_task,
)
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskFilterParams,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status (pending, in_progress, completed)"),
    category: Optional[str] = Query(None, description="Filter by category (coding, study, project, bugfix, learning, other)"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high, urgent)"),
    due_date: Optional[str] = Query(None, description="Filter by due date (YYYY-MM-DD)"),
    is_checklist_item: Optional[bool] = Query(None, description="Filter checklist items"),
    search: Optional[str] = Query(None, description="Search task title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all tasks for current user with optional filtering."""
    filters = TaskFilterParams(
        status=status,
        category=category,
        priority=priority,
        due_date=due_date,
        is_checklist_item=is_checklist_item,
        search=search,
    )
    tasks = await get_tasks(db, current_user.id, filters=filters, skip=skip, limit=limit)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def add_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task."""
    task = await create_task(db, task_in, current_user.id)
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_single_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific task."""
    task = await get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def edit_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing task."""
    task = await get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    updated = await update_task(db, task, task_in)
    return TaskResponse.model_validate(updated)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task."""
    task = await get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    await delete_task(db, task)
    return None


@router.post("/{task_id}/toggle", response_model=TaskResponse)
async def toggle_status(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle status between completed and pending."""
    task = await get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    toggled = await toggle_task_status(db, task)
    return TaskResponse.model_validate(toggled)


@router.post("/{task_id}/duplicate", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_existing_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Duplicate an existing task."""
    task = await get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    dup = await duplicate_task(db, task)
    return TaskResponse.model_validate(dup)


@router.post("/{task_id}/subtasks/{subtask_id}/toggle", response_model=TaskResponse)
async def toggle_task_subtask(
    task_id: int,
    subtask_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a subtask completion status."""
    task = await get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    updated = await toggle_subtask(db, task, subtask_id)
    return TaskResponse.model_validate(updated)
