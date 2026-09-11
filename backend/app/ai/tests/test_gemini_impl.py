import json
import os
import types

import pytest

from app.ai import gemini as gemini_mod
from app.ai.base import AIProviderUnavailable
from app.ai.gemini import GeminiAI

LIVE = pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY"), reason="GEMINI_API_KEY not set")


class _FakeResponse:
    def __init__(self, text):
        self.text = text


class _FakeModel:
    def __init__(self, text=None, exc=None):
        self._text = text
        self._exc = exc

    def generate_content(self, prompt):
        if self._exc is not None:
            raise self._exc
        return _FakeResponse(self._text)


def _install_fake_genai(monkeypatch, model=None, embed_result=None, embed_exc=None,
                        record=None):
    fake = types.SimpleNamespace()
    fake.configure = lambda **kwargs: None

    def _model_factory(*args, **kwargs):
        if record is not None:
            record["args"] = args
            record["kwargs"] = kwargs
        return model

    def _embed_content(**kwargs):
        if record is not None:
            record["embed_kwargs"] = kwargs
        if embed_exc is not None:
            raise embed_exc
        return embed_result

    fake.GenerativeModel = _model_factory
    fake.embed_content = _embed_content
    monkeypatch.setattr(gemini_mod, "genai", fake)
    return fake


def _ai():
    return GeminiAI(api_key="test-key")


# ---- extract ----

def test_extract_kpi_happy_path(monkeypatch):
    record = {}
    payload = {"extracted_data": {"actual": 12.5, "unit": "households"},
               "confidence": 0.92,
               "source_span": "12.5 households connected"}
    _install_fake_genai(monkeypatch, model=_FakeModel(text=json.dumps(payload)),
                        record=record)
    out = _ai().extract("12.5 households connected in Q1", "KPI_MEASUREMENT")
    assert set(out.keys()) == {"extracted_data", "confidence", "source_span"}
    assert out["extracted_data"]["actual"] == 12.5
    assert out["extracted_data"]["unit"] == "households"
    assert out["extracted_data"]["_spans"] == {
        "actual": "12.5 households connected",
        "unit": "12.5 households connected"}
    assert isinstance(out["confidence"], float)
    assert 0.0 <= out["confidence"] <= 1.0
    assert isinstance(out["source_span"], str) and out["source_span"]
    assert record["kwargs"].get("generation_config", {}).get(
        "response_mime_type") == "application/json"


@pytest.mark.parametrize("raw,expected", [(1.7, 1.0), (-0.3, 0.0)])
def test_extract_confidence_clamped(monkeypatch, raw, expected):
    payload = {"extracted_data": {"actual": 3, "unit": "km"},
               "confidence": raw, "source_span": "3 km laid"}
    _install_fake_genai(monkeypatch, model=_FakeModel(text=json.dumps(payload)))
    out = _ai().extract("3 km laid", "KPI_MEASUREMENT")
    assert out["confidence"] == expected


def test_extract_malformed_json(monkeypatch):
    _install_fake_genai(monkeypatch, model=_FakeModel(text="not json{{{"))
    with pytest.raises(AIProviderUnavailable):
        _ai().extract("some text", "REPORT")


def test_extract_sdk_raises(monkeypatch):
    _install_fake_genai(monkeypatch, model=_FakeModel(exc=RuntimeError("boom")))
    with pytest.raises(AIProviderUnavailable):
        _ai().extract("some text", "REPORT")


def test_extract_kpi_missing_actual(monkeypatch):
    payload = {"extracted_data": {"unit": "households"},
               "confidence": 0.8, "source_span": "households"}
    _install_fake_genai(monkeypatch, model=_FakeModel(text=json.dumps(payload)))
    with pytest.raises(AIProviderUnavailable):
        _ai().extract("households", "KPI_MEASUREMENT")


def test_extract_kpi_non_numeric_actual(monkeypatch):
    payload = {"extracted_data": {"actual": "twelve", "unit": "households"},
               "confidence": 0.8, "source_span": "twelve households"}
    _install_fake_genai(monkeypatch, model=_FakeModel(text=json.dumps(payload)))
    with pytest.raises(AIProviderUnavailable):
        _ai().extract("twelve households", "KPI_MEASUREMENT")


@LIVE
def test_extract_live():
    ai = GeminiAI(api_key=os.environ["GEMINI_API_KEY"])
    out = ai.extract(
        "In Q1 FY 2024-25, 12.5 lakh households were connected to piped water.",
        "KPI_MEASUREMENT")
    assert set(out.keys()) == {"extracted_data", "confidence", "source_span"}
    assert isinstance(out["extracted_data"].get("_spans"), dict)


# ---- embed ----

def test_embed_happy_path(monkeypatch):
    record = {}
    _install_fake_genai(
        monkeypatch,
        embed_result={"embedding": [[0.1] * 768, [0.2] * 768]},
        record=record)
    vectors = _ai().embed(["water pipeline", "crop advisory"])
    assert len(vectors) == 2
    for vec in vectors:
        assert len(vec) == 768
        assert all(isinstance(x, float) for x in vec)
    assert record["embed_kwargs"].get("model") == "text-embedding-004"


def test_embed_wrong_dims(monkeypatch):
    _install_fake_genai(monkeypatch, embed_result={"embedding": [[0.1] * 100]})
    with pytest.raises(AIProviderUnavailable):
        _ai().embed(["water pipeline"])


def test_embed_sdk_raises(monkeypatch):
    _install_fake_genai(monkeypatch, embed_exc=RuntimeError("boom"))
    with pytest.raises(AIProviderUnavailable):
        _ai().embed(["water pipeline"])


def test_embed_empty_list(monkeypatch):
    _install_fake_genai(monkeypatch, embed_result={"embedding": []})
    assert _ai().embed([]) == []


@LIVE
def test_embed_live():
    ai = GeminiAI(api_key=os.environ["GEMINI_API_KEY"])
    vectors = ai.embed(["rural water supply pipeline leakage"])
    assert len(vectors) == 1
    assert len(vectors[0]) == 768


# ---- compare_contexts ----

def test_compare_happy_path(monkeypatch):
    record = {}
    payload = {"problem": 0.9, "technology": 1.5, "infrastructure": -0.2,
               "data": 0.4, "environment": 0.7}
    _install_fake_genai(monkeypatch, model=_FakeModel(text=json.dumps(payload)),
                        record=record)
    scores = _ai().compare_contexts({"a": 1}, {"a": 2})
    assert set(scores.keys()) == {"problem", "technology", "infrastructure",
                                  "data", "environment"}
    assert all(isinstance(v, float) and 0.0 <= v <= 1.0
               for v in scores.values())
    assert scores["technology"] == 1.0
    assert scores["infrastructure"] == 0.0
    assert record["kwargs"].get("generation_config", {}).get(
        "response_mime_type") == "application/json"


def test_compare_malformed_json(monkeypatch):
    _install_fake_genai(monkeypatch, model=_FakeModel(text="{oops"))
    with pytest.raises(AIProviderUnavailable):
        _ai().compare_contexts({"a": 1}, {"a": 1})


def test_compare_missing_dimension(monkeypatch):
    payload = {"problem": 0.5, "technology": 0.5}
    _install_fake_genai(monkeypatch, model=_FakeModel(text=json.dumps(payload)))
    with pytest.raises(AIProviderUnavailable):
        _ai().compare_contexts({"a": 1}, {"a": 1})


def test_compare_sdk_raises(monkeypatch):
    _install_fake_genai(monkeypatch, model=_FakeModel(exc=RuntimeError("boom")))
    with pytest.raises(AIProviderUnavailable):
        _ai().compare_contexts({"a": 1}, {"a": 1})


@LIVE
def test_compare_live():
    ai = GeminiAI(api_key=os.environ["GEMINI_API_KEY"])
    scores = ai.compare_contexts(
        {"terrain": "rural hilly", "connectivity": "low"},
        {"terrain": "rural hilly", "connectivity": "high"})
    assert set(scores.keys()) == {"problem", "technology", "infrastructure",
                                  "data", "environment"}


# ---- draft_explanation ----

def test_draft_happy_path(monkeypatch):
    _install_fake_genai(
        monkeypatch, model=_FakeModel(text="  Decision: SCALE (score 0.85).  "))
    out = _ai().draft_explanation({"decision": "SCALE", "score": 0.85})
    assert isinstance(out, str)
    assert out == "Decision: SCALE (score 0.85)."


def test_draft_sdk_raises(monkeypatch):
    _install_fake_genai(monkeypatch, model=_FakeModel(exc=RuntimeError("boom")))
    with pytest.raises(AIProviderUnavailable):
        _ai().draft_explanation({"decision": "SCALE"})


def test_draft_empty_text(monkeypatch):
    _install_fake_genai(monkeypatch, model=_FakeModel(text="   "))
    with pytest.raises(AIProviderUnavailable):
        _ai().draft_explanation({"decision": "SCALE"})


@LIVE
def test_draft_live():
    ai = GeminiAI(api_key=os.environ["GEMINI_API_KEY"])
    out = ai.draft_explanation(
        {"decision": "SCALE", "score": 0.85, "reasons": ["pilot met KPI"]})
    assert isinstance(out, str) and out
