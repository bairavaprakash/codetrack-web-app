from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class StudySessionBase(BaseModel):
    duration_minutes: int
    session_mode: str = "focus"  # focus, short_break, long_break
    language_tag: str = "Python"
    task_id: Optional[int] = None
    notes: Optional[str] = None


class StudySessionCreate(StudySessionBase):
    pass


class StudySessionResponse(StudySessionBase):
    id: int
    user_id: int
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyDurationStat(BaseModel):
    date: str
    minutes: int


class LanguageDistributionStat(BaseModel):
    language: str
    minutes: int
    percentage: float


class SessionStatsResponse(BaseModel):
    total_focus_minutes: int
    total_sessions_count: int
    today_focus_minutes: int
    week_focus_minutes: int
    daily_history: List[DailyDurationStat]
    language_distribution: List[LanguageDistributionStat]
