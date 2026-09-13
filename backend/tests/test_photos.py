import pytest
import io

@pytest.mark.asyncio
async def test_batch_photo_upload_and_selection(client, admin_user, team_user):
    admin_headers = {"Authorization": f"Bearer {admin_user['token']}"}
    team_headers = {"Authorization": f"Bearer {team_user['token']}"}

    # Admin creates event with team_user
    event_resp = await client.post("/api/events", headers=admin_headers, json={
        "name": "Art Exhibition",
        "team_members": [team_user["user"]["_id"]]
    })
    event_id = event_resp.json()["id"]

    # Team member uploads multiple photos in one batch
    files = [
        ("files", ("photo1.jpg", io.BytesIO(b"fake_jpeg_content_1"), "image/jpeg")),
        ("files", ("photo2.png", io.BytesIO(b"fake_png_content_2"), "image/png"))
    ]

    upload_resp = await client.post(
        f"/api/events/{event_id}/photos",
        headers=team_headers,
        files=files
    )
    assert upload_resp.status_code == 200
    data = upload_resp.json()
    assert data["total"] == 2
    assert data["successful"] == 2
    photo_ids = [r["photo"]["id"] for r in data["results"] if r["status"] == "success"]

    # Admin toggles photo selection
    photo_id_to_select = photo_ids[0]
    sel_resp = await client.patch(
        f"/api/photos/{photo_id_to_select}/select",
        headers=admin_headers,
        json={"is_selected": True}
    )
    assert sel_resp.status_code == 200
    assert sel_resp.json()["is_selected"] is True

    # Bulk select remaining photos
    bulk_resp = await client.patch(
        f"/api/events/{event_id}/photos/select",
        headers=admin_headers,
        json={"photo_ids": photo_ids, "is_selected": True}
    )
    assert bulk_resp.status_code == 200
    assert bulk_resp.json()["updated_count"] >= 1

@pytest.mark.asyncio
async def test_photo_rename(client, admin_user, team_user):
    admin_headers = {"Authorization": f"Bearer {admin_user['token']}"}
    team_headers = {"Authorization": f"Bearer {team_user['token']}"}

    # Admin creates event
    event_resp = await client.post("/api/events", headers=admin_headers, json={
        "name": "Graduation Party",
        "team_members": [team_user["user"]["_id"]]
    })
    event_id = event_resp.json()["id"]

    # Upload photo
    files = [("files", ("raw_IMG_001.jpg", io.BytesIO(b"fake_content"), "image/jpeg"))]
    upload_resp = await client.post(f"/api/events/{event_id}/photos", headers=team_headers, files=files)
    photo_id = upload_resp.json()["results"][0]["photo"]["id"]

    # Admin renames photo
    rename_resp = await client.patch(
        f"/api/photos/{photo_id}",
        headers=admin_headers,
        json={"filename": "Valedictorian Speech.jpg"}
    )
    assert rename_resp.status_code == 200
    assert rename_resp.json()["filename"] == "Valedictorian Speech.jpg"

    # Verify updated name in event photo list
    list_resp = await client.get(f"/api/events/{event_id}/photos", headers=admin_headers)
    photos = list_resp.json()
    assert any(p["filename"] == "Valedictorian Speech.jpg" for p in photos)

