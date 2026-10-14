import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_record_study_session_and_stats(authenticated_client: AsyncClient):
    # Record a focus session
    create_res = await authenticated_client.post(
        "/api/v1/sessions/",
        json={
            "duration_minutes": 25,
            "session_mode": "focus",
            "language_tag": "Python",
            "notes": "Solved 2 graph problems",
        },
    )
    assert create_res.status_code == 201
    session = create_res.json()
    assert session["duration_minutes"] == 25
    assert session["language_tag"] == "Python"

    # Record another session in TypeScript
    await authenticated_client.post(
        "/api/v1/sessions/",
        json={
            "duration_minutes": 25,
            "session_mode": "focus",
            "language_tag": "TypeScript",
            "notes": "Built React Native screen",
        },
    )

    # Get stats
    stats_res = await authenticated_client.get("/api/v1/sessions/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_focus_minutes"] >= 50
    assert stats["total_sessions_count"] >= 2
    assert len(stats["language_distribution"]) >= 2
