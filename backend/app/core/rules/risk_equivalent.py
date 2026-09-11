"""Risk-equivalent qualification engine (Plan 4, Task F1; spec §10).

Pure, deterministic, no DB, no AI. Proposes a risk-equivalent reading of a
failed / manually-reviewed eligibility requirement so a HUMAN (EVALUATOR or
ADMIN) can decide ACCEPTED / REJECTED (Task F2 consumes this).

Imports nothing from app.modules or core.rules siblings.
"""

from app.core.errors import BadRequest

SAFEGUARDS_POOL = [
    "milestone-based contracting",
    "phased deployment",
    "smaller initial order",
    "performance checkpoints",
    "pilot-first validation",
    "quarterly financial review",
]

_UNDERLYING = {
    "TURNOVER": "Financial capacity to execute the contract",
    "EXPERIENCE": "Delivery capacity demonstrated by prior deployments",
    "DPIIT": "Independent credential of startup legitimacy",
    "CUSTOM": "Human review required",
}

_SAFEGUARDS = {
    "TURNOVER": [
        "milestone-based contracting",
        "smaller initial order",
        "pilot-first validation",
    ],
    "EXPERIENCE": [
        "pilot-first validation",
        "performance checkpoints",
        "phased deployment",
    ],
    "DPIIT": [
        "milestone-based contracting",
        "phased deployment",
    ],
    "CUSTOM": [],
}


def _evidence_entry(evidence_type: str, source: str, raw) -> dict:
    if isinstance(raw, (list, tuple)):
        value = ", ".join(str(v) for v in raw)
    else:
        value = str(raw)
    return {"type": evidence_type, "source": source, "value": value}


def _evidence_for(ctype: str, profile: dict) -> list[dict]:
    """Alternative-evidence entries sourced ONLY from startup_profile fields."""
    evidence: list[dict] = []
    if ctype == "TURNOVER":
        if profile.get("runway_months") is not None:
            evidence.append(_evidence_entry(
                "runway", "startup_profile.runway_months",
                profile["runway_months"]))
        if profile.get("team_size") is not None:
            evidence.append(_evidence_entry(
                "team", "startup_profile.team_size", profile["team_size"]))
    elif ctype == "EXPERIENCE":
        if profile.get("prior_deployments") is not None:
            evidence.append(_evidence_entry(
                "prior_deployments", "startup_profile.prior_deployments",
                profile["prior_deployments"]))
        if profile.get("sectors") is not None:
            evidence.append(_evidence_entry(
                "sectors", "startup_profile.sectors", profile["sectors"]))
    elif ctype == "DPIIT":
        if profile.get("prior_deployments") is not None:
            evidence.append(_evidence_entry(
                "existing contracts", "startup_profile.prior_deployments",
                profile["prior_deployments"]))
        if profile.get("sectors") is not None:
            evidence.append(_evidence_entry(
                "sectors", "startup_profile.sectors", profile["sectors"]))
    return evidence


def analyze(requirement: dict, startup_profile: dict) -> dict:
    """Analyze one failed requirement against a startup profile.

    requirement keys: criterion_type (str or Enum), operator, threshold,
    checked_value. startup_profile keys: name, annual_turnover,
    runway_months, team_size, prior_deployments, dpiit_number, sectors.

    Unknown criterion_type raises BadRequest (fail-closed).
    """
    raw_type = requirement.get("criterion_type")
    ctype = raw_type.value if hasattr(raw_type, "value") else raw_type
    ctype = str(ctype).upper() if ctype is not None else ""
    if ctype not in _UNDERLYING:
        raise BadRequest(f"Unknown requirement type {raw_type!r}")

    underlying_risk = _UNDERLYING[ctype]
    startup_profile = startup_profile or {}
    alternative_evidence = _evidence_for(ctype, startup_profile)

    threshold = requirement.get("threshold")
    checked = requirement.get("checked_value")

    if ctype == "CUSTOM":
        residual_risk = "HIGH"
        safeguards: list[str] = []
    elif ctype == "DPIIT":
        # DPIIT carries no threshold; the check is registration presence.
        # Fail (unregistered / missing number) -> MEDIUM; satisfied -> LOW.
        dpiit_threshold = threshold if threshold is not None else 1.0
        try:
            passed = checked is not None and float(checked) >= float(dpiit_threshold)
        except (TypeError, ValueError):
            passed = bool(checked)
        if passed:
            residual_risk = "LOW"
            safeguards = []
        else:
            residual_risk = "MEDIUM"
            safeguards = list(_SAFEGUARDS["DPIIT"])
    else:
        # Numeric fail margin: (threshold - checked) / threshold.
        # margin < 0.25 -> MEDIUM else HIGH; satisfied (margin <= 0) -> LOW.
        try:
            margin = ((float(threshold) - float(checked)) / float(threshold)
                      if threshold is not None and float(threshold) != 0
                      and checked is not None else None)
        except (TypeError, ValueError):
            margin = None
        if margin is None:
            residual_risk = "HIGH"  # fail-closed on uncomputable margin
            safeguards = list(_SAFEGUARDS[ctype])
        elif margin <= 0:
            residual_risk = "LOW"
            safeguards = []
        elif margin < 0.25:
            residual_risk = "MEDIUM"
            safeguards = list(_SAFEGUARDS[ctype])
        else:
            residual_risk = "HIGH"
            safeguards = list(_SAFEGUARDS[ctype])

    safeguards_str = ", ".join(safeguards) if safeguards else "none"
    recommendation_note = (
        f"Residual risk is {residual_risk} — enforce "
        f"{len(safeguards)} safeguard(s) ({safeguards_str}) to cover "
        f"'{underlying_risk}'."
    )

    return {
        "underlying_risk": underlying_risk,
        "alternative_evidence": alternative_evidence,
        "residual_risk": residual_risk,
        "safeguards": safeguards,
        "recommendation_note": recommendation_note,
    }
