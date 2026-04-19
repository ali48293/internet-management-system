import cloudinary
import cloudinary.uploader
from app.core.config import settings
import os
import uuid

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_file(file, folder: str) -> str:
    """
    Uploads a file to Cloudinary and returns the secure URL.
    If Cloudinary is not configured (e.g. in dev), it falls back to local storage if possible,
    but for this project we'll prioritize Cloudinary for production.
    """
    if not settings.CLOUDINARY_API_KEY:
        # Fallback for development if needed, but we'll print a warning
        print("WARNING: Cloudinary is not configured. Falling back to local storage mock.")
        return f"/static/{folder}/{uuid.uuid4()}"

    try:
        # Use filename as public_id (optional, uuid is safer)
        public_id = f"{folder}/{uuid.uuid4()}"
        
        # Determine resource type (image, raw, etc.)
        # Cloudinary handles this automatically if we use 'auto'
        upload_result = cloudinary.uploader.upload(
            file.file,
            public_id=public_id,
            folder=f"{settings.PROJECT_NAME.lower().replace(' ', '_')}/{folder}",
            resource_type="auto"
        )
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        raise e
