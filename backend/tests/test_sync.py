import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_bulk_offline_sync(authenticated_client: AsyncClient):
    payload = {
        "tasks": [
            {
                "title": "Offline Task 1",
                "category": "coding",
                "priority": "high",
                "subtasks": [{"id": "sub-off-1", "title": "Offline subtask", "completed": False}],
            }
        ],
        "study_sessions": [
            {
                "duration_minutes": 25,
                "session_mode": "focus",
                "language_tag": "Python",
                "notes": "Recorded while offline",
            }
        ],
        "checklist_items": [
            {
                "item_text": "Review pull request offline",
                "date": "2026-10-13",
                "is_completed": True,
            }
        ],
        "completed_topics": [],
    }

    sync_res = await authenticated_client.post("/api/v1/sync/", json=payload)
    assert sync_res.status_code == 200
    data = sync_res.json()
    assert data["status"] == "success"
    assert data["synced_tasks_count"] == 1
    assert data["synced_sessions_count"] == 1
    assert data["synced_checklist_count"] == 1

    # Verify synced task exists in tasks list
    tasks_res = await authenticated_client.get("/api/v1/tasks/")
    assert tasks_res.status_code == 200
    titles = [t["title"] for t in tasks_res.json()]
    assert "Offline Task 1" in titles
