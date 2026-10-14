import asyncio
import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.initial_data import seed_initial_data
from app.main import app

# Test database: use an in-memory SQLite database with StaticPool
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a fresh database for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """Provide an HTTP client connected to the FastAPI app with test DB override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def authenticated_client(client: AsyncClient):
    """Provide an authenticated test client with an active registered user."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@codetrack.dev",
            "username": "testcoder",
            "password": "SecretPassword123!",
            "full_name": "Test Coder",
        },
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    token = data["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
