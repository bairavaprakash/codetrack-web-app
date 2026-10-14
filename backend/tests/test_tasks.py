import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_tasks(authenticated_client: AsyncClient):
    create_res = await authenticated_client.post(
        "/api/v1/tasks/",
        json={
            "title": "Study Dynamic Programming",
            "description": "Solve LeetCode 322 Coin Change and 300 LIS",
            "category": "coding",
            "priority": "high",
            "status": "pending",
            "due_date": "2026-10-15",
            "due_time": "14:00",
            "estimated_minutes": 60,
            "subtasks": [
                {"id": "s1", "title": "Top-down memoization approach", "completed": False},
                {"id": "s2", "title": "Bottom-up tabulation approach", "completed": False},
            ],
        },
    )
    assert create_res.status_code == 201
    task = create_res.json()
    assert task["title"] == "Study Dynamic Programming"
    assert len(task["subtasks"]) == 2
    task_id = task["id"]

    # List tasks
    list_res = await authenticated_client.get("/api/v1/tasks/")
    assert list_res.status_code == 200
    tasks = list_res.json()
    assert len(tasks) >= 1
    assert any(t["id"] == task_id for t in tasks)


@pytest.mark.asyncio
async def test_toggle_task_and_subtasks(authenticated_client: AsyncClient):
    # Create task
    create_res = await authenticated_client.post(
        "/api/v1/tasks/",
        json={
            "title": "Write unit tests for FastAPI",
            "category": "project",
            "priority": "medium",
            "subtasks": [
                {"id": "sub-1", "title": "Auth test", "completed": False},
            ],
        },
    )
    task = create_res.json()
    task_id = task["id"]
    assert task["status"] == "pending"

    # Toggle task status
    toggle_res = await authenticated_client.post(f"/api/v1/tasks/{task_id}/toggle")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "completed"

    # Toggle subtask
    sub_res = await authenticated_client.post(f"/api/v1/tasks/{task_id}/subtasks/sub-1/toggle")
    assert sub_res.status_code == 200
    assert sub_res.json()["subtasks"][0]["completed"] is True


@pytest.mark.asyncio
async def test_duplicate_and_delete_task(authenticated_client: AsyncClient):
    create_res = await authenticated_client.post(
        "/api/v1/tasks/",
        json={"title": "Original Task", "category": "study"},
    )
    task_id = create_res.json()["id"]

    # Duplicate
    dup_res = await authenticated_client.post(f"/api/v1/tasks/{task_id}/duplicate")
    assert dup_res.status_code == 201
    dup_task = dup_res.json()
    assert "Copy" in dup_task["title"]
    assert dup_task["id"] != task_id

    # Delete original
    del_res = await authenticated_client.delete(f"/api/v1/tasks/{task_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = await authenticated_client.get(f"/api/v1/tasks/{task_id}")
    assert get_res.status_code == 404
