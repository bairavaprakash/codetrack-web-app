from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ChecklistItemBase(BaseModel):
    item_text: str
    date: str  # YYYY-MM-DD
    is_completed: bool = False
    category: str = "daily"


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemUpdate(BaseModel):
    item_text: Optional[str] = None
    is_completed: Optional[bool] = None
    category: Optional[str] = None


class ChecklistItemResponse(ChecklistItemBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
