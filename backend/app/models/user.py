from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    streak: Mapped[int] = mapped_column(Integer, default=1)
    total_focus_minutes: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    study_sessions: Mapped[List["StudySession"]] = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    roadmap_progress: Mapped[List["UserRoadmapProgress"]] = relationship("UserRoadmapProgress", back_populates="user", cascade="all, delete-orphan")
    checklist_items: Mapped[List["DailyChecklist"]] = relationship("DailyChecklist", back_populates="user", cascade="all, delete-orphan")
