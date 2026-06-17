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

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()