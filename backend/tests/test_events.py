import pytest

@pytest.mark.asyncio
async def test_admin_create_event(client, admin_user, team_user):
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    resp = await client.post("/api/events", headers=headers, json={
        "name": "Grand Gala 2026",
        "team_members": [team_user["user"]["_id"]]
    })
    assert resp.status_code == 201
    event = resp.json()
    assert event["name"] == "Grand Gala 2026"
    assert team_user["user"]["_id"] in event["team_members"]

@pytest.mark.asyncio
async def test_team_member_cannot_create_event(client, team_user):
    headers = {"Authorization": f"Bearer {team_user['token']}"}
    resp = await client.post("/api/events", headers=headers, json={
        "name": "Unauthorized Event"
    })
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_event_isolation_for_team_member(client, admin_user, team_user, mock_db):
    # Create an event without assigning team_user
    admin_headers = {"Authorization": f"Bearer {admin_user['token']}"}
    team_headers = {"Authorization": f"Bearer {team_user['token']}"}

    create_resp = await client.post("/api/events", headers=admin_headers, json={
        "name": "Secret VIP Conference",
        "team_members": []
    })
    event_id = create_resp.json()["id"]

    # Team member should get 403 when trying to fetch it
    resp = await client.get(f"/api/events/{event_id}", headers=team_headers)
    assert resp.status_code == 403

    # Now admin assigns the team member
    assign_resp = await client.post(
        f"/api/events/{event_id}/members",
        headers=admin_headers,
        json={"member_ids": [team_user["user"]["_id"]]}
    )
    assert assign_resp.status_code == 200

    # Team member can now access
    resp2 = await client.get(f"/api/events/{event_id}", headers=team_headers)
    assert resp2.status_code == 200
    assert resp2.json()["name"] == "Secret VIP Conference"
