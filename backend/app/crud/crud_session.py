from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.session import StudySession
from app.models.task import Task
from app.models.user import User
from app.schemas.session import (
    DailyDurationStat,
    LanguageDistributionStat,
    SessionStatsResponse,
    StudySessionCreate,
)


async def create_study_session(
    db: AsyncSession, session_in: StudySessionCreate, user_id: int
) -> StudySession:
    session = StudySession(
        user_id=user_id,
        duration_minutes=session_in.duration_minutes,
        session_mode=session_in.session_mode,
        language_tag=session_in.language_tag,
        task_id=session_in.task_id,
        notes=session_in.notes,
    )
    db.add(session)

    # Update User total_focus_minutes if it was a focus session
    if session_in.session_mode == "focus":
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if user:
            user.total_focus_minutes = (user.total_focus_minutes or 0) + session_in.duration_minutes

    # If linked to a task, increment task actual_minutes
    if session_in.task_id:
        task_res = await db.execute(select(Task).where(Task.id == session_in.task_id))
        task = task_res.scalar_one_or_none()
        if task:
            task.actual_minutes = (task.actual_minutes or 0) + session_in.duration_minutes

    await db.commit()
    await db.refresh(session)
    return session


async def get_study_sessions(
    db: AsyncSession, user_id: int, skip: int = 0, limit: int = 50
) -> List[StudySession]:
    query = (
        select(StudySession)
        .where(StudySession.user_id == user_id)
        .order_by(desc(StudySession.completed_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_session_stats(db: AsyncSession, user_id: int) -> SessionStatsResponse:
    # All focus sessions for user
    res = await db.execute(
        select(StudySession).where(
            StudySession.user_id == user_id,
            StudySession.session_mode == "focus"
        )
    )
    sessions = list(res.scalars().all())

    total_focus_minutes = sum(s.duration_minutes for s in sessions)
    total_sessions_count = len(sessions)

    # Today & Week calculations
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    def to_aware_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    today_focus_minutes = sum(
        s.duration_minutes for s in sessions if to_aware_utc(s.completed_at) >= today_start
    )
    week_focus_minutes = sum(
        s.duration_minutes for s in sessions if to_aware_utc(s.completed_at) >= week_ago
    )

    # Last 7 days daily breakdown
    daily_map: Dict[str, int] = {}
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[day] = 0

    lang_map: Dict[str, int] = {}

    for s in sessions:
        day_str = s.completed_at.strftime("%Y-%m-%d")
        if day_str in daily_map:
            daily_map[day_str] += s.duration_minutes

        lang = s.language_tag or "Other"
        lang_map[lang] = lang_map.get(lang, 0) + s.duration_minutes

    daily_history = [
        DailyDurationStat(date=d, minutes=m) for d, m in daily_map.items()
    ]

    language_distribution = []
    if total_focus_minutes > 0:
        for lang, minutes in lang_map.items():
            pct = round((minutes / total_focus_minutes) * 100, 1)
            language_distribution.append(
                LanguageDistributionStat(language=lang, minutes=minutes, percentage=pct)
            )
    else:
        language_distribution.append(
            LanguageDistributionStat(language="Python", minutes=0, percentage=100.0)
        )

    return SessionStatsResponse(
        total_focus_minutes=total_focus_minutes,
        total_sessions_count=total_sessions_count,
        today_focus_minutes=today_focus_minutes,
        week_focus_minutes=week_focus_minutes,
        daily_history=daily_history,
        language_distribution=language_distribution,
    )
