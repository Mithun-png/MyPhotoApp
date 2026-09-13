from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class PhotoResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    _id: Optional[str] = None
    event_id: str
    uploaded_by: str
    uploader_name: Optional[str] = None
    filename: str
    cloudinary_url: str
    cloudinary_public_id: str
    file_size: int
    is_selected: bool = False
    created_at: datetime

class PhotoSelectRequest(BaseModel):
    is_selected: bool

class PhotoUpdateRequest(BaseModel):
    filename: str

class BulkSelectRequest(BaseModel):
    photo_ids: List[str]
    is_selected: bool

class UploadResultItem(BaseModel):
    filename: str
    status: str  # "success" or "error"
    photo: Optional[PhotoResponse] = None
    error: Optional[str] = None

class BatchUploadResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[UploadResultItem]
