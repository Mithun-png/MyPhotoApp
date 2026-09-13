from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class EventBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    team_members: List[str] = Field(default_factory=list)

class EventCreate(EventBase):
    pass

class EventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    _id: Optional[str] = None
    name: str
    created_by: str
    team_members: List[str] = Field(default_factory=list)
    created_at: datetime
    photo_count: Optional[int] = 0
    selected_photo_count: Optional[int] = 0
    is_gallery_published: Optional[bool] = False
    gallery_slug: Optional[str] = None

class AddMembersRequest(BaseModel):
    member_ids: List[str]
