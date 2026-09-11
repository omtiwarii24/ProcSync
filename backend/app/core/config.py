from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:15433/govinnovate"
    test_database_url: str = "postgresql://postgres:postgres@localhost:15433/govinnovate_test"
    jwt_secret: str = "dev-secret-change-me"
    jwt_expire_minutes: int = 480
    ai_provider: str = "mock"
    gemini_api_key: str = ""
    triage_auto_approve_threshold: float = 0.9

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
