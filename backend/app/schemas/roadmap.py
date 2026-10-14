from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TopicObjective(BaseModel):
    id: str
    title: str
    completed: bool = False


class TopicDetail(BaseModel):
    id: str
    title: str
    stage: str
    description: str
    objectives: List[str] = Field(default_factory=list)
    codeExample: Optional[str] = None
    practiceTasks: List[str] = Field(default_factory=list)
    resources: List[Dict[str, str]] = Field(default_factory=list)


class RoadmapBase(BaseModel):
    slug: str
    title: str
    language: str
    description: str
    icon: str = "code"
    color: str = "#38bdf8"
    level: str = "Beginner to Advanced"
    total_topics: int = 0
    topics: List[Dict[str, Any]] = Field(default_factory=list)


class RoadmapCreate(RoadmapBase):
    pass


class RoadmapResponse(RoadmapBase):
    id: int
    created_at: datetime
    user_progress_percentage: Optional[int] = 0
    completed_topics: Optional[List[str]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class UserRoadmapProgressResponse(BaseModel):
    roadmap_slug: str
    completed_topics: List[str]
    current_topic_id: Optional[str] = None
    progress_percentage: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TopicCompleteToggle(BaseModel):
    topic_id: str
    completed: Optional[bool] = None  # None means toggle
