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
            "language": "Python",
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
    assert task["language"] == "Python"
    assert len(task["subtasks"]) == 2
    task_id = task["id"]

    # List tasks
    list_res = await authenticated_client.get("/api/v1/tasks/")
    assert list_res.status_code == 200
    tasks = list_res.json()
    assert len(tasks) >= 1
    retrieved = next(t for t in tasks if t["id"] == task_id)
    assert retrieved["language"] == "Python"


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


@pytest.mark.asyncio
async def test_unauthenticated_access_denied(client: AsyncClient):
    # GET tasks unauthenticated without header
    res = await client.get("/api/v1/tasks/")
    assert res.status_code in (401, 403)

    # POST task unauthenticated without header
    post_res = await client.post("/api/v1/tasks/", json={"title": "Unauthorized Task"})
    assert post_res.status_code in (401, 403)

    # With invalid bearer token -> 401 Unauthorized
    bad_res = await client.get("/api/v1/tasks/", headers={"Authorization": "Bearer invalid_token_xyz"})
    assert bad_res.status_code == 401


@pytest.mark.asyncio
async def test_task_update_persistence(authenticated_client: AsyncClient):
    create_res = await authenticated_client.post(
        "/api/v1/tasks/",
        json={"title": "Initial Task", "category": "learning", "priority": "low"},
    )
    task_id = create_res.json()["id"]

    # Update task
    update_res = await authenticated_client.put(
        f"/api/v1/tasks/{task_id}",
        json={
            "title": "Updated Task Title",
            "priority": "urgent",
            "language": "TypeScript",
            "due_date": "2026-10-20",
        },
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["title"] == "Updated Task Title"
    assert updated_data["priority"] == "urgent"
    assert updated_data["language"] == "TypeScript"
    assert updated_data["due_date"] == "2026-10-20"

    # Query again to verify persistence
    get_res = await authenticated_client.get(f"/api/v1/tasks/{task_id}")
    assert get_res.status_code == 200
    persisted = get_res.json()
    assert persisted["title"] == "Updated Task Title"
    assert persisted["language"] == "TypeScript"


@pytest.mark.asyncio
async def test_toggle_and_reopen_task(authenticated_client: AsyncClient):
    create_res = await authenticated_client.post(
        "/api/v1/tasks/",
        json={"title": "Reopenable Task", "category": "coding"},
    )
    task_id = create_res.json()["id"]
    assert create_res.json()["status"] == "pending"

    # Complete
    c_res = await authenticated_client.post(f"/api/v1/tasks/{task_id}/toggle")
    assert c_res.status_code == 200
    assert c_res.json()["status"] == "completed"

    # Reopen
    r_res = await authenticated_client.post(f"/api/v1/tasks/{task_id}/toggle")
    assert r_res.status_code == 200
    assert r_res.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient):
    # Register User 1
    u1_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "u1@test.com", "username": "user1", "password": "Password123!"},
    )
    u1_token = u1_reg.json()["access_token"]

    # Register User 2
    u2_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "u2@test.com", "username": "user2", "password": "Password123!"},
    )
    u2_token = u2_reg.json()["access_token"]

    # User 1 creates a task
    client.headers["Authorization"] = f"Bearer {u1_token}"
    create_res = await client.post(
        "/api/v1/tasks/",
        json={"title": "User 1 Private Task", "category": "coding"},
    )
    u1_task_id = create_res.json()["id"]

    # User 2 attempts to read User 1's task
    client.headers["Authorization"] = f"Bearer {u2_token}"
    u2_get = await client.get(f"/api/v1/tasks/{u1_task_id}")
    assert u2_get.status_code == 404

    # User 2 attempts to delete User 1's task
    u2_del = await client.delete(f"/api/v1/tasks/{u1_task_id}")
    assert u2_del.status_code == 404

    # User 2 attempts to toggle User 1's task
    u2_toggle = await client.post(f"/api/v1/tasks/{u1_task_id}/toggle")
    assert u2_toggle.status_code == 404


@pytest.mark.asyncio
async def test_invalid_task_validation(authenticated_client: AsyncClient):
    # Empty payload
    res = await authenticated_client.post("/api/v1/tasks/", json={})
    assert res.status_code == 422

