from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:15433/pilotbridge"
    gemini_api_key: str = ""
    embedding_model: str = "text-embedding-004"
    chat_model: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"

settings = Settings()
