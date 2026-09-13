import pytest
import pytest_asyncio
import mongomock_motor
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db, db_instance
from app.services.auth_service import hash_password, create_access_token

@pytest_asyncio.fixture(autouse=True)
async def mock_db():
    # Setup fresh in-memory mock client per test
    mock_client = mongomock_motor.AsyncMongoMockClient()
    mock_database = mock_client["test_photosharing"]
    db_instance.client = mock_client
    db_instance.db = mock_database

    async def override_get_db():
        return mock_database

    app.dependency_overrides[get_db] = override_get_db
    yield mock_database
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_cloudinary_service(monkeypatch):
    from unittest.mock import AsyncMock
    mock_upload = AsyncMock(return_value={
        "url": "https://res.cloudinary.com/ec6m3tld/image/upload/v1/test/photo.jpg",
        "public_id": "photosharing/events/test/mock_id",
        "file_size": 2048
    })
    mock_delete = AsyncMock(return_value=True)
    monkeypatch.setattr("app.routers.photos.upload_photo", mock_upload)
    monkeypatch.setattr("app.routers.photos.delete_photo", mock_delete)
    monkeypatch.setattr("app.services.cloudinary_service.upload_photo", mock_upload)
    monkeypatch.setattr("app.services.cloudinary_service.delete_photo", mock_delete)
    yield

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def admin_user(mock_db):
    user = {
        "_id": "admin-123",
        "name": "Admin Tester",
        "email": "admin@test.com",
        "password_hash": hash_password("AdminPass123"),
        "role": "admin",
        "created_at": "2026-09-06T12:00:00Z"
    }
    await mock_db.users.insert_one(user)
    token = create_access_token({"sub": "admin-123", "role": "admin", "email": "admin@test.com"})
    return {"user": user, "token": token}

@pytest_asyncio.fixture
async def team_user(mock_db):
    user = {
        "_id": "team-456",
        "name": "Team Photographer",
        "email": "team@test.com",
        "password_hash": hash_password("TeamPass123"),
        "role": "team_member",
        "created_at": "2026-09-06T12:00:00Z"
    }
    await mock_db.users.insert_one(user)
    token = create_access_token({"sub": "team-456", "role": "team_member", "email": "team@test.com"})
    return {"user": user, "token": token}
