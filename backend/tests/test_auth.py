import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@codetrack.dev",
            "username": "alice_dev",
            "password": "StrongPassword123!",
            "full_name": "Alice Developer",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@codetrack.dev"
    assert data["user"]["username"] == "alice_dev"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@codetrack.dev",
        "username": "user1",
        "password": "Password123!",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    payload2 = {
        "email": "duplicate@codetrack.dev",
        "username": "user2",
        "password": "Password123!",
    }
    res2 = await client.post("/api/v1/auth/register", json=payload2)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success_and_refresh(client: AsyncClient):
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "bob@codetrack.dev",
            "username": "bob_coder",
            "password": "MySecretPassword123!",
        },
    )

    # Login with username
    login_res = await client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "bob_coder",
            "password": "MySecretPassword123!",
        },
    )
    assert login_res.status_code == 200
    tokens = login_res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    # Refresh token
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_res.status_code == 200
    refreshed_tokens = refresh_res.json()
    assert "access_token" in refreshed_tokens


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "charlie@codetrack.dev",
            "username": "charlie_dev",
            "password": "CorrectPassword123!",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "charlie_dev",
            "password": "WrongPassword!",
        },
    )
    assert login_res.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(authenticated_client: AsyncClient):
    res = await authenticated_client.get("/api/v1/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "testuser@codetrack.dev"
    assert "total_tasks" in data
    assert "total_focus_minutes" in data
