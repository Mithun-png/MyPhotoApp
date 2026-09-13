import logging
import uuid
import base64
import cloudinary
import cloudinary.uploader
from app.config import settings

logger = logging.getLogger("photosharing.cloudinary")

# Configure Cloudinary if credentials are provided
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_CLOUD_NAME != "demo":
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

async def upload_photo(file_bytes: bytes, filename: str, event_id: str) -> dict:
    """
    Uploads a photo to Cloudinary.
    Falls back gracefully if using placeholder/offline credentials.
    """
    folder = f"photosharing/events/{event_id}"
    
    # If genuine Cloudinary credentials exist
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_CLOUD_NAME != "demo":
        try:
            result = cloudinary.uploader.upload(
                file_bytes,
                folder=folder,
                resource_type="image",
                use_filename=True,
                unique_filename=True
            )
            return {
                "url": result.get("secure_url", result.get("url")),
                "public_id": result.get("public_id"),
                "file_size": result.get("bytes", len(file_bytes))
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            raise RuntimeError(f"Cloud storage upload failed: {str(e)}")

    # Standalone / Offline / Mock Fallback for local testing or demo mode:
    # Generates a data URI or structured mock URL
    mock_id = f"{folder}/{uuid.uuid4().hex[:12]}_{filename}"
    mime = "image/jpeg"
    if filename.lower().endswith(".png"):
        mime = "image/png"
    elif filename.lower().endswith(".webp"):
        mime = "image/webp"
        
    data_uri = f"data:{mime};base64,{base64.b64encode(file_bytes).decode('utf-8')}"
    return {
        "url": data_uri,
        "public_id": mock_id,
        "file_size": len(file_bytes)
    }

async def delete_photo(public_id: str) -> bool:
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_CLOUD_NAME != "demo":
        try:
            res = cloudinary.uploader.destroy(public_id)
            return res.get("result") == "ok"
        except Exception as e:
            logger.error(f"Cloudinary destroy error: {e}")
            return False
    return True
