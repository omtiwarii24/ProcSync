import os

import pytest

from app.ai.base import AIProviderUnavailable
from app.ai.factory import get_ai_provider
from app.ai.gemini import GeminiAI
from app.ai.mock import MockAI
from app.ai.seed_index import SEED_INDEX

CONTRACT_KEYS = {"name", "website", "sector", "location",
                 "relevance_score", "relevance_evidence"}


def test_factory_returns_mock(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "mock")
    provider = get_ai_provider()
    assert isinstance(provider, MockAI)
    for method in ("discover_startups", "embed", "extract",
                   "compare_contexts", "draft_explanation"):
        assert callable(getattr(provider, method))


def test_factory_gemini_without_key(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    provider = get_ai_provider()
    assert isinstance(provider, GeminiAI)
    with pytest.raises(AIProviderUnavailable):
        provider.discover_startups("water leakage detection", "water")


def test_gemini_methods_implemented_no_key(monkeypatch):
    # Methods are implemented now (Plan 6); without a key they fail as
    # AIProviderUnavailable, never NotImplementedError.
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    provider = get_ai_provider()
    with pytest.raises(AIProviderUnavailable):
        provider.embed(["text"])
    with pytest.raises(AIProviderUnavailable):
        provider.extract("some evidence", "budget")
    with pytest.raises(AIProviderUnavailable):
        provider.compare_contexts({}, {})
    with pytest.raises(AIProviderUnavailable):
        provider.draft_explanation({})


def test_seed_index_twelve_entries():
    assert len(SEED_INDEX) == 12
    required = {"name", "website", "sector", "location", "keywords", "description"}
    for entry in SEED_INDEX:
        assert required <= set(entry.keys())
        assert isinstance(entry["keywords"], list) and entry["keywords"]
        assert all(isinstance(k, str) and k for k in entry["keywords"])
    websites = [e["website"] for e in SEED_INDEX]
    assert len(websites) == len(set(websites))
    names = [e["name"] for e in SEED_INDEX]
    assert len(names) == len(set(names))
    assert sum(1 for e in SEED_INDEX if "water" in e["sector"].lower()) >= 4


def test_mock_embed_deterministic():
    ai = MockAI()
    v1 = ai.embed(["water pipeline leakage"])[0]
    v2 = ai.embed(["water pipeline leakage"])[0]
    assert v1 == v2
    assert len(v1) == 768
    assert all(isinstance(x, float) for x in v1)
    v3 = ai.embed(["crop advisory drone"])[0]
    assert v3 != v1
    assert ai.embed([]) == []


def test_mock_extract_and_compare():
    ai = MockAI()
    text = ("The district approved a budget of Rs 5,00,00,000 for FY 2024-25 "
            "under the Jal Jeevan Mission scheme.")
    out = ai.extract(text, "budget")
    assert set(out.keys()) == {"extracted_data", "confidence", "source_span"}
    assert isinstance(out["extracted_data"], dict)
    assert out["extracted_data"]["amounts"] == ["50000000"]
    assert out["extracted_data"]["fiscal_years"] == ["FY 2024-25"]
    assert isinstance(out["confidence"], float)
    assert 0.0 <= out["confidence"] <= 1.0
    assert isinstance(out["source_span"], str) and out["source_span"]

    scores = ai.compare_contexts(
        {"connectivity_tier": "MEDIUM", "settlement_type": "RURAL"},
        {"connectivity_tier": "MEDIUM", "settlement_type": "URBAN"},
    )
    assert isinstance(scores, dict) and scores
    assert all(isinstance(v, float) and 0.0 <= v <= 1.0
               for v in scores.values())
    assert scores["connectivity_tier"] == 1.0
    assert scores["settlement_type"] == 0.0

    explanation = ai.draft_explanation(
        {"decision": "ELIGIBLE", "score": 0.8, "reasons": ["tier match"]})
    assert isinstance(explanation, str)
    assert "ELIGIBLE" in explanation


@pytest.mark.skipif(not os.environ.get("GEMINI_API_KEY"),
                    reason="GEMINI_API_KEY not set")
def test_gemini_live_discovery():
    ai = GeminiAI(api_key=os.environ["GEMINI_API_KEY"])
    results = ai.discover_startups(
        "Rural water supply pipeline leakage detection in Maharashtra", "water")
    assert isinstance(results, list)
    assert len(results) <= 10
    scores = [r["relevance_score"] for r in results]
    assert scores == sorted(scores, reverse=True)
    for item in results:
        assert set(item.keys()) == CONTRACT_KEYS
