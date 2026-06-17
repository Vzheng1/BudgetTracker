from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    database_url: str
    secret_key: str
    api_prefix: str = "/api/v1"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"

    # Frontend
    frontend_url: str = "http://localhost:3000"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()