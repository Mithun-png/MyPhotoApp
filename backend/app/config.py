import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    PROJECT_NAME: str = "Photo Sharing Platform"
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "photosharing"
    
    JWT_SECRET: str = "super-secret-key-for-jwt-signing-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60 * 24  # 24 hours
    
    CLOUDINARY_CLOUD_NAME: str = "demo"
    CLOUDINARY_API_KEY: str = "123456789012345"
    CLOUDINARY_API_SECRET: str = "abcdefghijklmnopqrstuvwxyz"
    
    PIN_MAX_ATTEMPTS: int = 5
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

settings = Settings()
