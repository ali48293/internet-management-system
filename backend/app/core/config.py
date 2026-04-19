import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("COMPANY_NAME", "AD Internet")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./loopers.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_key_dev_only_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "../uploads")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Cloudinary Settings
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

settings = Settings()
