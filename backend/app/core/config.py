import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeTrack API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "codetrack-super-secret-development-key-2026-secure-jwt-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30         # 30 days
    
    # Database
    # Defaults to SQLite async for zero-configuration instant local development,
    # and smoothly accepts PostgreSQL (e.g. postgresql+asyncpg://user:pass@localhost:5432/codetrack)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./codetrack.db"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "*",
        "http://localhost",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
