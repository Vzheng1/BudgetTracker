from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Tells pydantic where to find .env file to get environment variables
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    # These are the settings required for the application to run and should map directly to variable names in .env
    # If any of these are missing, the application will fail to start and throw an error
    #   - database_url and secret_key are REQUIRED so must be set
    database_url: str
    secret_key: str
    api_prefix: str = "/api/v1"

    # Google OAuth credentials - Defaults with empty strings so app can start even without them
    #   - These can be set in the .env file as OAuth login will fail until they're set
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"

    # Frontend URL that users are sent to after successful login
    frontend_url: str = "http://localhost:3000"

    # Comma-separated list of allowed CORS origins
    # In production set ALLOWED_ORIGINS=https://your-app.vercel.app,https://other-origin.com
    allowed_origins: str = "http://localhost:3000"

# lru_cache decorator to cache the settings object -> So function only runs once per process + every call after returns cached object
@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()