from typing import Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email.lower().strip()))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username.strip()))
    return result.scalar_one_or_none()


async def get_user_by_username_or_email(db: AsyncSession, identifier: str) -> Optional[User]:
    cleaned = identifier.strip().lower()
    result = await db.execute(
        select(User).where(
            or_(
                User.email == cleaned,
                User.username == identifier.strip()
            )
        )
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower().strip(),
        username=user_in.username.strip(),
        hashed_password=hashed_pwd,
        full_name=getattr(user_in, "full_name", None),
        avatar_url=getattr(user_in, "avatar_url", None),
        streak=1,
        total_focus_minutes=0,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, identifier: str, password: str) -> Optional[User]:
    user = await get_user_by_username_or_email(db, identifier)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data.pop("password"))
    if "email" in update_data and update_data["email"]:
        update_data["email"] = update_data["email"].lower().strip()
    
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    return user
