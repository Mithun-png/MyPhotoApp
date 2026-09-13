import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.models.gallery import (
    GalleryPublishRequest, GalleryPublishResponse,
    PublicGalleryMetaResponse, PinVerifyRequest, PinVerifyResponse
)
from app.models.photo import PhotoResponse
from app.services.gallery_service import hash_pin, verify_pin, generate_share_slug
from app.middleware.auth_middleware import get_current_user, require_admin
from app.middleware.rate_limiter import pin_limiter
from app.database import get_db

router = APIRouter(prefix="/api", tags=["Galleries"])

@router.post("/events/{event_id}/gallery", response_model=GalleryPublishResponse)
async def publish_or_update_gallery(
    event_id: str,
    data: GalleryPublishRequest,
    current_user: dict = Depends(require_admin),
    db = Depends(get_db)
):
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if not data.pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must contain only numeric digits (e.g., 482917)"
        )

    selected_photos_cursor = db.photos.find({"event_id": event_id, "is_selected": True})
    photo_ids = [p["_id"] async for p in selected_photos_cursor]

    if not photo_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish gallery: No photos have been selected by Admin for this event yet."
        )

    pin_hashed = hash_pin(data.pin)
    now = datetime.now(timezone.utc)

    existing_gallery = await db.galleries.find_one({"event_id": event_id})

    if existing_gallery:
        share_slug = existing_gallery["share_slug"]
        gallery_id = existing_gallery["_id"]
        await db.galleries.update_one(
            {"_id": gallery_id},
            {
                "$set": {
                    "pin_hash": pin_hashed,
                    "photo_ids": photo_ids,
                    "is_published": True,
                    "updated_at": now
                }
            }
        )
        published_at = existing_gallery.get("published_at", now)
    else:
        share_slug = generate_share_slug()
        while await db.galleries.find_one({"share_slug": share_slug}):
            share_slug = generate_share_slug()

        gallery_id = str(uuid.uuid4())
        gallery_doc = {
            "_id": gallery_id,
            "event_id": event_id,
            "share_slug": share_slug,
            "pin_hash": pin_hashed,
            "photo_ids": photo_ids,
            "is_published": True,
            "published_at": now,
            "updated_at": now
        }
        await db.galleries.insert_one(gallery_doc)
        published_at = now

    share_url = f"/gallery/{share_slug}"

    return GalleryPublishResponse(
        gallery_id=gallery_id,
        event_id=event_id,
        share_slug=share_slug,
        share_url=share_url,
        pin=data.pin,
        selected_photo_count=len(photo_ids),
        is_published=True,
        published_at=published_at
    )

@router.get("/events/{event_id}/gallery")
async def get_event_gallery(
    event_id: str,
    current_user: dict = Depends(require_admin),
    db = Depends(get_db)
):
    gallery = await db.galleries.find_one({"event_id": event_id})
    if not gallery:
        return {"is_published": False, "gallery": None}

    selected_count = await db.photos.count_documents({"event_id": event_id, "is_selected": True})
    return {
        "is_published": gallery.get("is_published", False),
        "share_slug": gallery.get("share_slug"),
        "share_url": f"/gallery/{gallery.get('share_slug')}",
        "photo_count": len(gallery.get("photo_ids", [])),
        "selected_photo_count": selected_count,
        "published_at": gallery.get("published_at"),
        "updated_at": gallery.get("updated_at")
    }

@router.get("/gallery/{share_slug}", response_model=PublicGalleryMetaResponse)
async def get_public_gallery_meta(share_slug: str, db = Depends(get_db)):
    gallery = await db.galleries.find_one({"share_slug": share_slug, "is_published": True})
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found or is currently private"
        )

    event = await db.events.find_one({"_id": gallery["event_id"]})
    event_name = event["name"] if event else "Special Event"

    return PublicGalleryMetaResponse(
        share_slug=share_slug,
        event_name=event_name,
        photo_count=len(gallery.get("photo_ids", [])),
        published_at=gallery.get("published_at", datetime.now(timezone.utc)),
        is_locked=True
    )

@router.post("/gallery/{share_slug}/verify-pin", response_model=PinVerifyResponse)
async def verify_gallery_pin(
    share_slug: str,
    data: PinVerifyRequest,
    db = Depends(get_db)
):
    pin_limiter.check_slug(share_slug)

    gallery = await db.galleries.find_one({"share_slug": share_slug, "is_published": True})
    if not gallery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gallery not found")

    is_valid = verify_pin(data.pin, gallery["pin_hash"])
    if not is_valid:
        pin_limiter.record_failure(share_slug)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect PIN. Please double check and try again."
        )

    pin_limiter.record_success(share_slug)

    event = await db.events.find_one({"_id": gallery["event_id"]})
    event_name = event["name"] if event else "Event"

    photo_ids = gallery.get("photo_ids", [])
    cursor = db.photos.find({"_id": {"$in": photo_ids}}).sort("created_at", -1)

    photos = []
    async for p in cursor:
        photos.append(PhotoResponse(
            id=p["_id"],
            _id=p["_id"],
            event_id=p["event_id"],
            uploaded_by=p["uploaded_by"],
            filename=p["filename"],
            cloudinary_url=p["cloudinary_url"],
            cloudinary_public_id=p["cloudinary_public_id"],
            file_size=p["file_size"],
            is_selected=p.get("is_selected", True),
            created_at=p["created_at"]
        ))

    return PinVerifyResponse(
        success=True,
        event_name=event_name,
        photo_count=len(photos),
        photos=photos,
        message="Access granted"
    )
