import pytest
import io

@pytest.mark.asyncio
async def test_gallery_workflow_and_pin_protection(client, admin_user, team_user):
    admin_headers = {"Authorization": f"Bearer {admin_user['token']}"}
    team_headers = {"Authorization": f"Bearer {team_user['token']}"}

    # 1. Admin creates event
    event_resp = await client.post("/api/events", headers=admin_headers, json={
        "name": "Arjun & Priya Wedding",
        "team_members": [team_user["user"]["_id"]]
    })
    event_id = event_resp.json()["id"]

    # 2. Team member tries to publish (Forbidden)
    forbidden_pub = await client.post(
        f"/api/events/{event_id}/gallery",
        headers=team_headers,
        json={"pin": "482917"}
    )
    assert forbidden_pub.status_code == 403

    # 3. Admin tries to publish before selecting photos (400 Bad Request)
    fail_pub = await client.post(
        f"/api/events/{event_id}/gallery",
        headers=admin_headers,
        json={"pin": "482917"}
    )
    assert fail_pub.status_code == 400

    # 4. Upload photo & select it
    files = [("files", ("wedding1.jpg", io.BytesIO(b"wedding_image_data"), "image/jpeg"))]
    upload_res = await client.post(f"/api/events/{event_id}/photos", headers=team_headers, files=files)
    photo_id = upload_res.json()["results"][0]["photo"]["id"]
    await client.patch(f"/api/photos/{photo_id}/select", headers=admin_headers, json={"is_selected": True})

    # 5. Admin publishes gallery
    publish_res = await client.post(
        f"/api/events/{event_id}/gallery",
        headers=admin_headers,
        json={"pin": "482917"}
    )
    assert publish_res.status_code == 200
    pub_data = publish_res.json()
    assert pub_data["is_published"] is True
    assert pub_data["pin"] == "482917"
    slug = pub_data["share_slug"]

    # 6. Customer accesses metadata (unauthenticated) - verifies no photos leaked
    meta_res = await client.get(f"/api/gallery/{slug}")
    assert meta_res.status_code == 200
    meta = meta_res.json()
    assert meta["event_name"] == "Arjun & Priya Wedding"
    assert meta["photo_count"] == 1
    assert "photos" not in meta

    # 7. Customer enters wrong PIN
    wrong_pin_res = await client.post(f"/api/gallery/{slug}/verify-pin", json={"pin": "000000"})
    assert wrong_pin_res.status_code == 401

    # 8. Customer enters correct PIN
    correct_pin_res = await client.post(f"/api/gallery/{slug}/verify-pin", json={"pin": "482917"})
    assert correct_pin_res.status_code == 200
    gallery_view = correct_pin_res.json()
    assert gallery_view["success"] is True
    assert len(gallery_view["photos"]) == 1
    assert gallery_view["photos"][0]["id"] == photo_id
