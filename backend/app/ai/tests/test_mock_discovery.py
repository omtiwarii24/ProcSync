from app.ai.mock import MockAI

CONTRACT_KEYS = {"name", "website", "sector", "location",
                 "relevance_score", "relevance_evidence"}

WATER_PROBLEM = ("Rural water supply pipeline leakage detection and "
                 "quality monitoring in Maharashtra villages")


def test_mock_discovery_deterministic():
    ai = MockAI()
    first = ai.discover_startups(WATER_PROBLEM, "water")
    second = ai.discover_startups(WATER_PROBLEM, "water")
    assert first == second
    assert 0 < len(first) <= 10
    scores = [item["relevance_score"] for item in first]
    assert all(0.0 <= s <= 1.0 for s in scores)
    assert scores == sorted(scores, reverse=True)
    assert any("water" in item["sector"].lower() for item in first)


def test_mock_discovery_no_match_empty():
    ai = MockAI()
    assert ai.discover_startups("quantum cheese aging", "dairy") == []


def test_provider_contract_shape():
    ai = MockAI()
    results = ai.discover_startups(
        "smart city iot traffic management platform", "iot")
    assert results
    for item in results:
        assert set(item.keys()) == CONTRACT_KEYS
        assert isinstance(item["name"], str) and item["name"]
        assert isinstance(item["website"], str)
        assert isinstance(item["sector"], str)
        assert isinstance(item["location"], str)
        assert isinstance(item["relevance_score"], float)
        assert 0.0 <= item["relevance_score"] <= 1.0
        assert isinstance(item["relevance_evidence"], str)
        assert item["relevance_evidence"]
