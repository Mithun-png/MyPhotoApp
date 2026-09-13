import pytest

@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register first user (automatically becomes admin)
    reg_resp = await client.post("/api/auth/register", json={
        "name": "First Admin",
        "email": "first@admin.com",
        "password": "Password123",
        "role": "admin"
    })
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

    # Login
    login_resp = await client.post("/api/auth/login", json={
        "email": "first@admin.com",
        "password": "Password123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data

@pytest.mark.asyncio
async def test_login_invalid_credentials(client, admin_user):
    resp = await client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "WrongPassword"
    })
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_get_me(client, admin_user):
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    resp = await client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"
