from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    language: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="code")
    color: Mapped[str] = mapped_column(String(20), default="#38bdf8")
    level: Mapped[str] = mapped_column(String(50), default="Beginner to Advanced")
    total_topics: Mapped[int] = mapped_column(Integer, default=0)
    topics: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserRoadmapProgress(Base):
    __tablename__ = "user_roadmap_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    roadmap_slug: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    completed_topics: Mapped[List[str]] = mapped_column(JSON, default=list)
    current_topic_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="roadmap_progress")
