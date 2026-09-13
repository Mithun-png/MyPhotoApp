from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.photo import PhotoResponse

class GalleryPublishRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=8, description="Numeric PIN for gallery protection")

class GalleryPublishResponse(BaseModel):
    gallery_id: str
    event_id: str
    share_slug: str
    share_url: str
    pin: str
    selected_photo_count: int
    is_published: bool
    published_at: datetime

class PublicGalleryMetaResponse(BaseModel):
    share_slug: str
    event_name: str
    photo_count: int
    published_at: datetime
    is_locked: bool = True

class PinVerifyRequest(BaseModel):
    pin: str

class PinVerifyResponse(BaseModel):
    success: bool
    event_name: str
    photo_count: int
    photos: List[PhotoResponse]
    message: Optional[str] = None
