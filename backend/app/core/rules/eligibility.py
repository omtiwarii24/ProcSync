"""Deterministic eligibility checks — pure functions, no DB, no AI (spec §9)."""

OPS = {
    "GTE": lambda v, t: v is not None and t is not None and v >= t,
    "LTE": lambda v, t: v is not None and t is not None and v <= t,
    "EQ": lambda v, t: v is not None and t is not None and v == t,
}


def run_eligibility(startup_values: dict, criteria: list[dict]) -> list[dict]:
    results = []
    for c in criteria:
        ctype = c["criterion_type"].value if hasattr(c["criterion_type"], "value") \
            else c["criterion_type"]
        if not c.get("is_auto_checkable", True) or ctype == "CUSTOM":
            results.append({"criterion_id": c["criterion_id"],
                            "result": "PENDING_MANUAL", "checked_value": None})
            continue
        if ctype == "TURNOVER":
            value = float(startup_values.get("annual_turnover", 0.0))
        elif ctype == "EXPERIENCE":
            value = float(startup_values.get("prior_deployments", 0))
        elif ctype == "DPIIT":
            value = 1.0 if startup_values.get("dpiit_number") else 0.0
        else:
            results.append({"criterion_id": c["criterion_id"],
                            "result": "PENDING_MANUAL", "checked_value": None})
            continue
        op = c["operator"].value if hasattr(c["operator"], "value") else c["operator"]
        threshold = c.get("threshold")
        if ctype == "DPIIT" and threshold is None:
            # DPIIT criteria carry no threshold; the check is registration
            # presence (1.0 = registered). Without this default a None
            # threshold can never satisfy GTE (unmarked brief bug #3).
            threshold = 1.0
        passed = OPS[op](value, threshold)
        results.append({"criterion_id": c["criterion_id"],
                        "result": "PASS" if passed else "FAIL",
                        "checked_value": value})
    return results
