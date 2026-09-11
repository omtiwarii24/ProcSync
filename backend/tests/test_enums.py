from app.models.enums import (
    AuditAction, ConnectivityTier, ConstraintType, DecisionLabel, DomainTag,
    EvidenceType, ITMaturity, Portal, PowerReliability, SettlementType,
    TerrainType, UserRole, ValidationStatus,
)


def test_user_roles_exactly_seven():
    vals = {r.value for r in UserRole}
    assert vals == {
        "STARTUP", "DEPT_OWNER", "PILOT_MANAGER", "EVALUATOR",
        "PROCUREMENT_AUTHORITY", "FINANCE", "ADMIN",
    }


def test_portal_values():
    assert Portal.A.value == "A"
    assert Portal.B.value == "B"


def test_decision_exactly_four():
    vals = {d.value for d in DecisionLabel}
    assert vals == {"STOP", "ADAPT", "REVALIDATE", "SCALE"}
    assert len(DecisionLabel) == 4


def test_domain_tags():
    assert DomainTag.WATER.value == "water"
    assert DomainTag.OTHER.value == "other"


def test_evidence_and_validation():
    assert EvidenceType.KPI_MEASUREMENT.value == "KPI_MEASUREMENT"
    assert ValidationStatus.UNVERIFIED.value == "UNVERIFIED"
    assert ValidationStatus.AI_EXTRACTED.value == "AI_EXTRACTED"
    assert ValidationStatus.EVALUATOR_VERIFIED.value == "EVALUATOR_VERIFIED"
    assert ValidationStatus.REJECTED.value == "REJECTED"


def test_context_profile_enums():
    assert ConnectivityTier.HIGH.value == "HIGH"
    assert PowerReliability.INTERMITTENT.value == "INTERMITTENT"
    assert ITMaturity.MEDIUM.value == "MEDIUM"
    assert SettlementType.TRIBAL.value == "TRIBAL"
    assert TerrainType.COASTAL.value == "COASTAL"
    assert ConstraintType.DATA_ACCESS.value == "DATA_ACCESS"


def test_audit_actions_nonempty():
    assert AuditAction.CREATE.value == "CREATE"
    assert AuditAction.AUTHORIZE.value == "AUTHORIZE"
    assert AuditAction.RESOLVE.value == "RESOLVE"
