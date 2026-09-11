from app.models.enums import EvidenceType


def should_auto_approve(confidence, safety_critical,
                        evidence_type_value, threshold=0.9) -> bool:
    """Pure deterministic triage gate (spec section 20, frozen).

    Auto-approve iff confidence >= threshold AND not safety_critical AND
    evidence_type != COST_RECORD. Never raises: unparseable confidence
    means "stay queued".
    """
    try:
        conf = float(confidence)
    except (TypeError, ValueError):
        return False
    if safety_critical:
        return False
    ev = getattr(evidence_type_value, "value", evidence_type_value)
    if ev == EvidenceType.COST_RECORD.value:
        return False
    return conf >= threshold
