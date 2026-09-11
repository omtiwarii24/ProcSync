from app.core.config import settings


def test_settings_loaded():
    assert settings.database_url.startswith("postgresql://")
    assert settings.jwt_secret  # non-empty
    assert settings.ai_provider in ("gemini", "mock")


def test_jwt_expire_default():
    assert settings.jwt_expire_minutes == 480  # 8h, spec §5
