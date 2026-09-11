"""Deterministic weighted evaluation scoring — pure functions, no DB, no AI (Plan 4 §Task E).

Dimension keys (frozen): impact, cost_effectiveness, technical_maturity,
operational_readiness, security_compliance, user_adoption, scalability.
Gate values (frozen): GATE1, GATE2.
"""

from app.core.errors import BadRequest

DIMENSIONS = (
    "impact",
    "cost_effectiveness",
    "technical_maturity",
    "operational_readiness",
    "security_compliance",
    "user_adoption",
    "scalability",
)

GATES = ("GATE1", "GATE2")


def _gate_value(gate) -> str:
    return gate.value if hasattr(gate, "value") else str(gate)


def weighted_total(scores: list[dict], weights: dict) -> float:
    """Sum of raw/10 * weights[dim] over each score dict {dimension, raw_score}.

    Unknown dimension raises BadRequest; missing weight contributes 0.
    """
    total = 0.0
    for s in scores:
        dim = s["dimension"]
        if dim not in DIMENSIONS:
            raise BadRequest(f"Unknown evaluation dimension: {dim}",
                             context={"dimension": dim})
        total += (s["raw_score"] / 10.0) * float(weights.get(dim, 0.0) or 0.0)
    return total


def rank_proposals(scored: list[dict], weights: dict) -> list[dict]:
    """Rank proposals from flat score rows.

    Input rows: {proposal_id, startup_id, gate, dimension, raw_score}.
    Output: [{proposal_id, startup_id, gate1_score, gate2_score, total}]
    sorted total desc, ties by proposal_id asc. Pure, no DB.
    """
    per_proposal: dict[int, dict] = {}
    for row in scored:
        pid = row["proposal_id"]
        entry = per_proposal.setdefault(pid, {
            "proposal_id": pid,
            "startup_id": row["startup_id"],
            "gate1": [],
            "gate2": [],
        })
        gate = _gate_value(row["gate"])
        if gate == "GATE1":
            entry["gate1"].append(row)
        elif gate == "GATE2":
            entry["gate2"].append(row)
        else:
            raise BadRequest(f"Unknown gate: {gate}", context={"gate": gate})
    ranked = []
    for entry in per_proposal.values():
        g1 = weighted_total(entry["gate1"], weights)
        g2 = weighted_total(entry["gate2"], weights)
        ranked.append({
            "proposal_id": entry["proposal_id"],
            "startup_id": entry["startup_id"],
            "gate1_score": g1,
            "gate2_score": g2,
            "total": g1 + g2,
        })
    ranked.sort(key=lambda r: (-r["total"], r["proposal_id"]))
    return ranked
