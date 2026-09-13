import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.event import EventCreate, EventResponse, AddMembersRequest
from app.middleware.auth_middleware import get_current_user, require_admin
from app.database import get_db

router = APIRouter(prefix="/api/events", tags=["Events"])

async def enrich_event(event: dict, db) -> EventResponse:
    event_id = event["_id"]
    photo_count = await db.photos.count_documents({"event_id": event_id})
    selected_count = await db.photos.count_documents({"event_id": event_id, "is_selected": True})
    gallery = await db.galleries.find_one({"event_id": event_id})
    
    is_published = gallery.get("is_published", False) if gallery else False
    gallery_slug = gallery.get("share_slug") if (gallery and is_published) else None

    return EventResponse(
        id=event_id,
        _id=event_id,
        name=event["name"],
        created_by=event["created_by"],
        team_members=event.get("team_members", []),
        created_at=event["created_at"],
        photo_count=photo_count,
        selected_photo_count=selected_count,
        is_gallery_published=is_published,
        gallery_slug=gallery_slug
    )

@router.get("", response_model=list[EventResponse])
async def list_events(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    if current_user["role"] == "admin":
        cursor = db.events.find().sort("created_at", -1)
    else:
        cursor = db.events.find({"team_members": current_user["_id"]}).sort("created_at", -1)

    events = []
    async for event in cursor:
        enriched = await enrich_event(event, db)
        events.append(enriched)
    return events

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(data: EventCreate, current_user: dict = Depends(require_admin), db = Depends(get_db)):
    event_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    new_event = {
        "_id": event_id,
        "name": data.name,
        "created_by": current_user["_id"],
        "team_members": data.team_members,
        "created_at": now
    }
    await db.events.insert_one(new_event)
    return await enrich_event(new_event, db)

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if current_user["role"] != "admin" and current_user["_id"] not in event.get("team_members", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not assigned to this event"
        )

    return await enrich_event(event, db)

@router.post("/{event_id}/members", response_model=EventResponse)
async def add_team_members(event_id: str, data: AddMembersRequest, current_user: dict = Depends(require_admin), db = Depends(get_db)):
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    current_members = set(event.get("team_members", []))
    current_members.update(data.member_ids)

    await db.events.update_one(
        {"_id": event_id},
        {"$set": {"team_members": list(current_members)}}
    )
    updated_event = await db.events.find_one({"_id": event_id})
    return await enrich_event(updated_event, db)

@router.delete("/{event_id}/members/{user_id}", response_model=EventResponse)
async def remove_team_member(event_id: str, user_id: str, current_user: dict = Depends(require_admin), db = Depends(get_db)):
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    current_members = [m for m in event.get("team_members", []) if m != user_id]
    await db.events.update_one(
        {"_id": event_id},
        {"$set": {"team_members": current_members}}
    )
    updated_event = await db.events.find_one({"_id": event_id})
    return await enrich_event(updated_event, db)
