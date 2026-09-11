import os

from app.ai.base import EvidenceAI
from app.ai.mock import MockAI

_cache: dict = {}


def get_ai_provider() -> EvidenceAI:
    name = (os.environ.get("AI_PROVIDER") or "mock").strip().lower() or "mock"
    api_key = os.environ.get("GEMINI_API_KEY") or ""
    cache_key = (name, api_key) if name == "gemini" else (name, "")
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached
    if name == "gemini":
        from app.ai.gemini import GeminiAI
        provider = GeminiAI(api_key=api_key)
    elif name == "mock":
        provider = MockAI()
    else:
        raise ValueError(
            f"Unknown AI_PROVIDER {name!r}; expected 'mock' or 'gemini'")
    _cache[cache_key] = provider
    return provider
