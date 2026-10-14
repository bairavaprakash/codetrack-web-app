from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubtaskItem(BaseModel):
    id: str
    title: str
    completed: bool = False


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "coding"
    priority: str = "medium"
    status: str = "pending"
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    reminder_time: Optional[str] = None
    language: Optional[str] = None
    is_checklist_item: bool = False
    estimated_minutes: int = 30
    actual_minutes: int = 0
    subtasks: List[SubtaskItem] = Field(default_factory=list)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    reminder_time: Optional[str] = None
    language: Optional[str] = None
    is_checklist_item: Optional[bool] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    subtasks: Optional[List[SubtaskItem]] = None


class TaskResponse(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskFilterParams(BaseModel):
    status: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    is_checklist_item: Optional[bool] = None
    search: Optional[str] = None
