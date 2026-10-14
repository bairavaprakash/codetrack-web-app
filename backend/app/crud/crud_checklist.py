from typing import List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.checklist import DailyChecklist
from app.schemas.checklist import ChecklistItemCreate, ChecklistItemUpdate


async def get_checklist_items(
    db: AsyncSession, user_id: int, date: Optional[str] = None
) -> List[DailyChecklist]:
    query = select(DailyChecklist).where(DailyChecklist.user_id == user_id)
    if date:
        query = query.where(DailyChecklist.date == date)
    query = query.order_by(DailyChecklist.id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_checklist_item_by_id(
    db: AsyncSession, item_id: int, user_id: int
) -> Optional[DailyChecklist]:
    result = await db.execute(
        select(DailyChecklist).where(
            DailyChecklist.id == item_id,
            DailyChecklist.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_checklist_item(
    db: AsyncSession, item_in: ChecklistItemCreate, user_id: int
) -> DailyChecklist:
    item = DailyChecklist(
        user_id=user_id,
        date=item_in.date,
        item_text=item_in.item_text,
        is_completed=item_in.is_completed,
        category=item_in.category,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def update_checklist_item(
    db: AsyncSession, item: DailyChecklist, item_in: ChecklistItemUpdate
) -> DailyChecklist:
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def toggle_checklist_item(
    db: AsyncSession, item: DailyChecklist
) -> DailyChecklist:
    item.is_completed = not item.is_completed
    await db.commit()
    await db.refresh(item)
    return item


async def delete_checklist_item(db: AsyncSession, item: DailyChecklist) -> None:
    await db.delete(item)
    await db.commit()
