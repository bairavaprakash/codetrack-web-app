import pytest
from httpx import AsyncClient
from app.initial_data import seed_initial_data


@pytest.mark.asyncio
async def test_roadmaps_and_topic_progress(authenticated_client: AsyncClient, db_session):
    # Seed roadmaps in this test db
    await seed_initial_data(db_session)

    # List roadmaps
    list_res = await authenticated_client.get("/api/v1/roadmaps/")
    assert list_res.status_code == 200
    roadmaps = list_res.json()
    assert len(roadmaps) >= 1
    python_roadmap = next((r for r in roadmaps if r["slug"] == "python"), None)
    assert python_roadmap is not None
    assert python_roadmap["title"] == "Python Roadmap"
    assert len(python_roadmap["topics"]) >= 1

    # Toggle a topic completion
    topic_id = python_roadmap["topics"][0]["id"]
    toggle_res = await authenticated_client.post(
        f"/api/v1/roadmaps/python/topics/{topic_id}/toggle"
    )
    assert toggle_res.status_code == 200
    progress = toggle_res.json()
    assert topic_id in progress["completed_topics"]
    assert progress["progress_percentage"] > 0
