from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.crud.crud_checklist import (
    create_checklist_item,
    delete_checklist_item,
    get_checklist_item_by_id,
    get_checklist_items,
    toggle_checklist_item,
    update_checklist_item,
)
from app.models.user import User
from app.schemas.checklist import (
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistItemUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[ChecklistItemResponse])
async def list_checklist_items(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get checklist items for a given date."""
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    items = await get_checklist_items(db, current_user.id, date=target_date)
    return [ChecklistItemResponse.model_validate(it) for it in items]


@router.post("/", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_checklist_item(
    item_in: ChecklistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new checklist item."""
    item = await create_checklist_item(db, item_in, current_user.id)
    return ChecklistItemResponse.model_validate(item)


@router.put("/{item_id}", response_model=ChecklistItemResponse)
async def edit_checklist_item(
    item_id: int,
    item_in: ChecklistItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a checklist item."""
    item = await get_checklist_item_by_id(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")
    updated = await update_checklist_item(db, item, item_in)
    return ChecklistItemResponse.model_validate(updated)


@router.post("/{item_id}/toggle", response_model=ChecklistItemResponse)
async def toggle_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle checklist item completed status."""
    item = await get_checklist_item_by_id(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")
    toggled = await toggle_checklist_item(db, item)
    return ChecklistItemResponse.model_validate(toggled)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a checklist item."""
    item = await get_checklist_item_by_id(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")
    await delete_checklist_item(db, item)
    return None
