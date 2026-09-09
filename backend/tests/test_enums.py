import pytest

def test_validation_status_order():
    from app.models.enums import ValidationStatus
    assert ValidationStatus.UNVERIFIED.value == "UNVERIFIED"
    assert ValidationStatus.AI_EXTRACTED.value == "AI_EXTRACTED"
    assert ValidationStatus.EVALUATOR_VERIFIED.value == "EVALUATOR_VERIFIED"

def test_settlement_types():
    from app.models.enums import SettlementType
    vals = {s.value for s in SettlementType}
    assert vals == {"URBAN", "SEMI_URBAN", "RURAL", "TRIBAL"}

def test_connectivity_enums():
    from app.models.enums import ConnectivityRequirement, ConnectivityTier
    assert {c.value for c in ConnectivityRequirement} == {"NONE", "LOW", "MEDIUM", "HIGH"}
    assert {c.value for c in ConnectivityTier} == {"HIGH", "MEDIUM", "LOW", "NONE"}
