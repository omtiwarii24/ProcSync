"""Unit tests for the risk-equivalent pure engine (Plan 4, Task F1)."""

import pytest

from app.core.errors import BadRequest
from app.core.rules.risk_equivalent import analyze
from app.models.enums import CriterionType

PROFILE = {
    "name": "AquaPure",
    "annual_turnover": 60.0,
    "runway_months": 18,
    "team_size": 12,
    "prior_deployments": 3,
    "dpiit_number": None,
    "sectors": ["water", "agri"],
}


def _req(ctype, threshold, checked):
    return {"criterion_type": ctype, "operator": "GTE",
            "threshold": threshold, "checked_value": checked}


def test_turnover_fail_close_margin_medium():
    out = analyze(_req("TURNOVER", 100.0, 90.0), PROFILE)
    assert out["underlying_risk"] == "Financial capacity to execute the contract"
    assert out["residual_risk"] == "MEDIUM"
    assert out["safeguards"] == ["milestone-based contracting",
                                 "smaller initial order",
                                 "pilot-first validation"]
    assert "MEDIUM" in out["recommendation_note"]
    assert str(len(out["safeguards"])) in out["recommendation_note"]


def test_experience_fail_wide_margin_high():
    out = analyze(_req("EXPERIENCE", 10.0, 2.0), PROFILE)
    assert out["underlying_risk"] == \
        "Delivery capacity demonstrated by prior deployments"
    assert out["residual_risk"] == "HIGH"
    assert out["safeguards"] == ["pilot-first validation",
                                 "performance checkpoints",
                                 "phased deployment"]


def test_dpiit_fail_medium():
    out = analyze(_req("DPIIT", None, 0.0), PROFILE)
    assert out["underlying_risk"] == "Independent credential of startup legitimacy"
    assert out["residual_risk"] == "MEDIUM"
    assert out["safeguards"] == ["milestone-based contracting",
                                 "phased deployment"]


def test_custom_always_high_empty_alternatives():
    out = analyze(_req("CUSTOM", None, None), PROFILE)
    assert out["underlying_risk"] == "Human review required"
    assert out["residual_risk"] == "HIGH"
    assert out["alternative_evidence"] == []
    assert out["safeguards"] == []


def test_margin_boundary_below_threshold():
    # margin exactly 0.24 -> MEDIUM
    out = analyze(_req("TURNOVER", 100.0, 76.0), PROFILE)
    assert out["residual_risk"] == "MEDIUM"


def test_margin_boundary_above_threshold():
    # margin exactly 0.26 -> HIGH
    out = analyze(_req("TURNOVER", 100.0, 74.0), PROFILE)
    assert out["residual_risk"] == "HIGH"


def test_unknown_type_raises_badrequest():
    with pytest.raises(BadRequest, match="Unknown requirement type"):
        analyze(_req("NOPE", 1.0, 0.0), PROFILE)


def test_determinism_same_input_identical_output():
    req = _req("TURNOVER", 100.0, 80.0)
    assert analyze(req, PROFILE) == analyze(req, PROFILE)


def test_turnover_evidence_from_profile_fields():
    out = analyze(_req("TURNOVER", 100.0, 80.0), PROFILE)
    by_type = {e["type"]: e for e in out["alternative_evidence"]}
    assert by_type["runway"]["value"] == "18"
    assert by_type["runway"]["source"] == "startup_profile.runway_months"
    assert by_type["team"]["value"] == "12"


def test_experience_and_dpiit_evidence_fields():
    exp = analyze(_req("EXPERIENCE", 10.0, 8.0), PROFILE)
    by_type = {e["type"]: e for e in exp["alternative_evidence"]}
    assert by_type["prior_deployments"]["value"] == "3"
    assert by_type["sectors"]["value"] == "water, agri"

    dpiit = analyze(_req("DPIIT", None, 0.0), PROFILE)
    by_type = {e["type"]: e for e in dpiit["alternative_evidence"]}
    assert by_type["existing contracts"]["value"] == "3"
    assert by_type["sectors"]["value"] == "water, agri"


def test_criterion_type_enum_accepted():
    out = analyze(_req(CriterionType.TURNOVER, 100.0, 80.0), PROFILE)
    assert out["residual_risk"] == "MEDIUM"


def test_output_shape_keys():
    out = analyze(_req("TURNOVER", 100.0, 50.0), PROFILE)
    assert set(out) == {"underlying_risk", "alternative_evidence",
                        "residual_risk", "safeguards", "recommendation_note"}
    assert out["residual_risk"] in ("LOW", "MEDIUM", "HIGH")
    for e in out["alternative_evidence"]:
        assert set(e) == {"type", "source", "value"}
