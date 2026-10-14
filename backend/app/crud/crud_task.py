from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskFilterParams, TaskUpdate


async def get_task(db: AsyncSession, task_id: int, user_id: int) -> Optional[Task]:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_tasks(
    db: AsyncSession,
    user_id: int,
    filters: Optional[TaskFilterParams] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Task]:
    query = select(Task).where(Task.user_id == user_id)

    if filters:
        if filters.status:
            query = query.where(Task.status == filters.status)
        if filters.category:
            query = query.where(Task.category == filters.category)
        if filters.priority:
            query = query.where(Task.priority == filters.priority)
        if filters.due_date:
            query = query.where(Task.due_date == filters.due_date)
        if filters.is_checklist_item is not None:
            query = query.where(Task.is_checklist_item == filters.is_checklist_item)
        if filters.search:
            search_pattern = f"%{filters.search.strip()}%"
            query = query.where(Task.title.ilike(search_pattern))

    query = query.order_by(desc(Task.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_task(db: AsyncSession, task_in: TaskCreate, user_id: int) -> Task:
    subtasks_data = [
        {"id": s.id if s.id else str(uuid.uuid4())[:8], "title": s.title, "completed": s.completed}
        for s in task_in.subtasks
    ]
    task = Task(
        user_id=user_id,
        title=task_in.title,
        description=task_in.description,
        category=task_in.category,
        priority=task_in.priority,
        status=task_in.status,
        due_date=task_in.due_date,
        due_time=task_in.due_time,
        reminder_time=task_in.reminder_time,
        language=task_in.language,
        is_checklist_item=task_in.is_checklist_item,
        estimated_minutes=task_in.estimated_minutes,
        actual_minutes=task_in.actual_minutes,
        subtasks=subtasks_data,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task(db: AsyncSession, task: Task, task_in: TaskUpdate) -> Task:
    update_data = task_in.model_dump(exclude_unset=True)
    if "subtasks" in update_data and update_data["subtasks"] is not None:
        update_data["subtasks"] = [
            {"id": s.get("id") or str(uuid.uuid4())[:8], "title": s["title"], "completed": s.get("completed", False)}
            for s in update_data["subtasks"]
        ]
    
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, task: Task) -> None:
    await db.delete(task)
    await db.commit()


async def toggle_task_status(db: AsyncSession, task: Task) -> Task:
    new_status = "completed" if task.status != "completed" else "pending"
    task.status = new_status
    await db.commit()
    await db.refresh(task)
    return task


async def duplicate_task(db: AsyncSession, task: Task) -> Task:
    new_subtasks = [
        {"id": str(uuid.uuid4())[:8], "title": s.get("title", ""), "completed": False}
        for s in (task.subtasks or [])
    ]
    duplicated = Task(
        user_id=task.user_id,
        title=f"{task.title} (Copy)",
        description=task.description,
        category=task.category,
        priority=task.priority,
        status="pending",
        due_date=task.due_date,
        due_time=task.due_time,
        reminder_time=task.reminder_time,
        is_checklist_item=task.is_checklist_item,
        estimated_minutes=task.estimated_minutes,
        actual_minutes=0,
        subtasks=new_subtasks,
    )
    db.add(duplicated)
    await db.commit()
    await db.refresh(duplicated)
    return duplicated


from sqlalchemy.orm.attributes import flag_modified

async def toggle_subtask(db: AsyncSession, task: Task, subtask_id: str) -> Task:
    subtasks = [dict(s) for s in (task.subtasks or [])]
    found = False
    for st in subtasks:
        if str(st.get("id")) == str(subtask_id):
            st["completed"] = not bool(st.get("completed", False))
            found = True
            break
            
    if found:
        # Check if all subtasks are completed, if so mark task completed
        all_completed = len(subtasks) > 0 and all(st.get("completed", False) for st in subtasks)
        if all_completed and task.status != "completed":
            task.status = "completed"
        elif not all_completed and task.status == "completed":
            task.status = "in_progress"
            
        task.subtasks = subtasks
        flag_modified(task, "subtasks")
        await db.commit()
        await db.refresh(task)
        
    return task
