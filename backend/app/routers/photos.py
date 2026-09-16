import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.models.photo import (
    PhotoResponse, PhotoSelectRequest, PhotoUpdateRequest, BulkSelectRequest,
    BatchUploadResponse, UploadResultItem
)
from app.services.cloudinary_service import upload_photo, delete_photo
from app.middleware.auth_middleware import get_current_user, require_admin
from app.database import get_db

router = APIRouter(prefix="/api", tags=["Photos"])

@router.post("/events/{event_id}/photos", response_model=BatchUploadResponse)
async def upload_photos(
    event_id: str,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if current_user["role"] != "admin" and current_user["_id"] not in event.get("team_members", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not assigned to upload photos for this event"
        )

    results = []
    successful_count = 0
    failed_count = 0

    for file in files:
        filename = file.filename or "photo.jpg"
        if not file.content_type or not file.content_type.startswith("image/"):
            results.append(UploadResultItem(
                filename=filename,
                status="error",
                error="Invalid file type. Only image files are permitted."
            ))
            failed_count += 1
            continue

        try:
            content = await file.read()
            upload_res = await upload_photo(content, filename, event_id)

            photo_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            photo_doc = {
                "_id": photo_id,
                "event_id": event_id,
                "uploaded_by": current_user["_id"],
                "filename": filename,
                "storage_location": upload_res["url"],
                "cloudinary_url": upload_res["url"],
                "cloudinary_public_id": upload_res["public_id"],
                "file_size": upload_res["file_size"],
                "is_selected": False,
                "created_at": now
            }

            await db.photos.insert_one(photo_doc)

            photo_resp = PhotoResponse(
                id=photo_id,
                _id=photo_id,
                event_id=event_id,
                uploaded_by=current_user["_id"],
                uploader_name=current_user.get("name"),
                filename=filename,
                storage_location=upload_res["url"],
                cloudinary_url=upload_res["url"],
                cloudinary_public_id=upload_res["public_id"],
                file_size=upload_res["file_size"],
                is_selected=False,
                created_at=now
            )

            results.append(UploadResultItem(
                filename=filename,
                status="success",
                photo=photo_resp
            ))
            successful_count += 1

        except Exception as e:
            results.append(UploadResultItem(
                filename=filename,
                status="error",
                error=f"Upload failed: {str(e)}"
            ))
            failed_count += 1

    return BatchUploadResponse(
        total=len(files),
        successful=successful_count,
        failed=failed_count,
        results=results
    )

@router.get("/events/{event_id}/photos", response_model=List[PhotoResponse])
async def list_event_photos(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if current_user["role"] != "admin" and current_user["_id"] not in event.get("team_members", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have access to this event's photos"
        )

    query = {"event_id": event_id}
    if current_user["role"] != "admin":
        query["uploaded_by"] = current_user["_id"]

    cursor = db.photos.find(query).sort("created_at", -1)

    users_cursor = db.users.find({}, {"_id": 1, "name": 1})
    user_map = {}
    async for u in users_cursor:
        user_map[u["_id"]] = u.get("name", "User")

    photos = []
    async for doc in cursor:
        photos.append(PhotoResponse(
            id=doc["_id"],
            _id=doc["_id"],
            event_id=doc["event_id"],
            uploaded_by=doc["uploaded_by"],
            uploader_name=user_map.get(doc["uploaded_by"], "Team Member"),
            filename=doc["filename"],
            storage_location=doc.get("storage_location", doc.get("cloudinary_url")),
            cloudinary_url=doc["cloudinary_url"],
            cloudinary_public_id=doc["cloudinary_public_id"],
            file_size=doc["file_size"],
            is_selected=doc.get("is_selected", False),
            created_at=doc["created_at"]
        ))
    return photos

@router.patch("/photos/{photo_id}/select", response_model=PhotoResponse)
async def toggle_photo_selection(
    photo_id: str,
    data: PhotoSelectRequest,
    current_user: dict = Depends(require_admin),
    db = Depends(get_db)
):
    photo = await db.photos.find_one({"_id": photo_id})
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    await db.photos.update_one(
        {"_id": photo_id},
        {"$set": {"is_selected": data.is_selected}}
    )

    uploader = await db.users.find_one({"_id": photo["uploaded_by"]})

    return PhotoResponse(
        id=photo_id,
        _id=photo_id,
        event_id=photo["event_id"],
        uploaded_by=photo["uploaded_by"],
        uploader_name=uploader.get("name") if uploader else "Unknown",
        filename=photo["filename"],
        storage_location=photo.get("storage_location", photo.get("cloudinary_url")),
        cloudinary_url=photo["cloudinary_url"],
        cloudinary_public_id=photo["cloudinary_public_id"],
        file_size=photo["file_size"],
        is_selected=data.is_selected,
        created_at=photo["created_at"]
    )

@router.patch("/events/{event_id}/photos/select")
async def bulk_select_photos(
    event_id: str,
    data: BulkSelectRequest,
    current_user: dict = Depends(require_admin),
    db = Depends(get_db)
):
    result = await db.photos.update_many(
        {"_id": {"$in": data.photo_ids}, "event_id": event_id},
        {"$set": {"is_selected": data.is_selected}}
    )
    return {
        "event_id": event_id,
        "updated_count": result.modified_count,
        "is_selected": data.is_selected
    }

@router.patch("/photos/{photo_id}", response_model=PhotoResponse)
@router.patch("/photos/{photo_id}/rename", response_model=PhotoResponse)
async def update_photo_name(
    photo_id: str,
    data: PhotoUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    photo = await db.photos.find_one({"_id": photo_id})
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    if current_user["role"] != "admin" and photo.get("uploaded_by") != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only administrators or the uploader can edit the photo name"
        )

    cleaned_name = data.filename.strip()
    if not cleaned_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename cannot be empty")

    await db.photos.update_one(
        {"_id": photo_id},
        {"$set": {"filename": cleaned_name}}
    )

    uploader = await db.users.find_one({"_id": photo["uploaded_by"]})

    return PhotoResponse(
        id=photo_id,
        _id=photo_id,
        event_id=photo["event_id"],
        uploaded_by=photo["uploaded_by"],
        uploader_name=uploader.get("name") if uploader else "Unknown",
        filename=cleaned_name,
        storage_location=photo.get("storage_location", photo.get("cloudinary_url")),
        cloudinary_url=photo["cloudinary_url"],
        cloudinary_public_id=photo["cloudinary_public_id"],
        file_size=photo["file_size"],
        is_selected=photo.get("is_selected", False),
        created_at=photo["created_at"]
    )

@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_photo(
    photo_id: str,
    current_user: dict = Depends(require_admin),
    db = Depends(get_db)
):
    photo = await db.photos.find_one({"_id": photo_id})
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    await delete_photo(photo["cloudinary_public_id"])
    await db.photos.delete_one({"_id": photo_id})
    return None
