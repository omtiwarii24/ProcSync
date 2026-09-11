import pytest

from app.core.errors import BadRequest
from app.core.rules.evaluation import rank_proposals, weighted_total

WEIGHTS = {
    "impact": 35.0, "cost_effectiveness": 20.0, "technical_maturity": 15.0,
    "operational_readiness": 10.0, "security_compliance": 10.0,
    "user_adoption": 5.0, "scalability": 5.0,
}


def test_weighted_total_exact_arithmetic():
    # Frozen formula: sum(raw/10 * weights[dim]); 8/10 * 35 = 28.0.
    # (Plan prose "2.8" is a decimal slip; formula governs — see task report.)
    scores = [{"dimension": "impact", "raw_score": 8.0}]
    assert weighted_total(scores, WEIGHTS) == pytest.approx(28.0)


def test_weighted_total_multiple_dimensions():
    scores = [
        {"dimension": "impact", "raw_score": 10.0},       # 35/10*10 = 35
        {"dimension": "scalability", "raw_score": 5.0},   # 5/10*5 = 2.5
    ]
    assert weighted_total(scores, WEIGHTS) == pytest.approx(37.5)


def test_weighted_total_unknown_dimension_raises():
    with pytest.raises(BadRequest):
        weighted_total([{"dimension": "vibes", "raw_score": 9.0}], WEIGHTS)


def test_weighted_total_missing_weight_zeroes():
    scores = [{"dimension": "impact", "raw_score": 8.0}]
    assert weighted_total(scores, {}) == pytest.approx(0.0)
    partial = {"impact": 35.0}
    assert weighted_total(scores + [{"dimension": "scalability", "raw_score": 10.0}],
                          partial) == pytest.approx(28.0)


def test_rank_proposals_ordering_and_gate_separation():
    scored = [
        {"proposal_id": 1, "startup_id": 11, "gate": "GATE1",
         "dimension": "impact", "raw_score": 10.0},   # 35
        {"proposal_id": 1, "startup_id": 11, "gate": "GATE2",
         "dimension": "impact", "raw_score": 5.0},    # 17.5
        {"proposal_id": 2, "startup_id": 22, "gate": "GATE1",
         "dimension": "impact", "raw_score": 4.0},    # 14
        {"proposal_id": 2, "startup_id": 22, "gate": "GATE2",
         "dimension": "impact", "raw_score": 4.0},    # 14
    ]
    ranked = rank_proposals(scored, WEIGHTS)
    assert [r["proposal_id"] for r in ranked] == [1, 2]
    assert ranked[0]["gate1_score"] == pytest.approx(35.0)
    assert ranked[0]["gate2_score"] == pytest.approx(17.5)
    assert ranked[0]["total"] == pytest.approx(52.5)
    assert ranked[1]["total"] == pytest.approx(28.0)


def test_rank_proposals_tie_break_by_proposal_id_asc():
    scored = [
        {"proposal_id": 7, "startup_id": 70, "gate": "GATE1",
         "dimension": "impact", "raw_score": 6.0},
        {"proposal_id": 3, "startup_id": 30, "gate": "GATE1",
         "dimension": "impact", "raw_score": 6.0},
    ]
    ranked = rank_proposals(scored, WEIGHTS)
    assert ranked[0]["total"] == pytest.approx(ranked[1]["total"])
    assert [r["proposal_id"] for r in ranked] == [3, 7]


def test_rank_proposals_unknown_gate_raises():
    with pytest.raises(BadRequest):
        rank_proposals([{"proposal_id": 1, "startup_id": 1, "gate": "GATE9",
                         "dimension": "impact", "raw_score": 5.0}], WEIGHTS)
