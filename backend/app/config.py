from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "dayflow"
    app_env: str = "development"
    debug: bool = True

    database_url: str = Field(
        ...,
        description="PostgreSQL connection URL (Neon). Required.",
    )
    test_database_url: str | None = Field(
        default=None,
        description="Optional isolated PostgreSQL URL for pytest.",
    )

    jwt_secret: str = Field(
        ...,
        description="JWT signing secret. Required — set via environment.",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default=60,
        validation_alias=AliasChoices(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "JWT_EXPIRE_MINUTES",
        ),
    )

    frontend_url: str = "http://localhost:5173"
    email_provider: str = "console"  # console | brevo
    email_verification_expire_hours: int = 24
    brevo_api_key: str | None = Field(default=None, description="Brevo (Sendinblue) API key")
    brevo_sender_email: str | None = Field(
        default=None,
        description="Verified sender email in your Brevo account",
    )
    brevo_sender_name: str = "WorkNest HRMS"
    standard_work_hours_per_day: float = 8.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
