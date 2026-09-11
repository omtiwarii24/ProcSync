from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, NotFound, PermissionDenied
from app.core.rules.risk_equivalent import analyze
from app.models.audit import utcnow
from app.models.enums import (AuditAction, CheckResult, ProposalStatus,
                              RiskEquivalentDecision, UserRole)
from app.modules.auth.models import User
from app.modules.challenges.models import Challenge, EligibilityCriterion
from app.modules.orgs.models import Startup
from app.modules.proposals.models import EligibilityCheck, Proposal
from app.modules.riskqual.models import RiskEquivalentAnalysis


def _get_proposal(db: Session, proposal_id: int) -> Proposal:
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    return prop


def _get_challenge(db: Session, challenge_id: int) -> Challenge:
    ch = db.get(Challenge, challenge_id)
    if ch is None:
        raise NotFound(f"Challenge {challenge_id} not found")
    return ch


def _startup_profile(db: Session, startup_id: int) -> dict:
    st = db.get(Startup, startup_id)
    if st is None:
        raise NotFound(f"Startup {startup_id} not found")
    return {
        "name": st.name,
        "annual_turnover": st.annual_turnover,
        "runway_months": st.runway_months,
        "team_size": st.team_size,
        "prior_deployments": st.prior_deployments,
        "dpiit_number": st.dpiit_number,
        "sectors": st.sectors,
    }


def _assert_generate_allowed(db: Session, user: User, prop: Proposal) -> None:
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.DEPT_OWNER:
        ch = _get_challenge(db, prop.challenge_id)
        if user.department_id != ch.department_id:
            raise PermissionDenied("Not your department's proposal")
        return
    raise PermissionDenied(
        "Only department owners and admins can generate risk analyses")


def _assert_visible(db: Session, user: User, prop: Proposal) -> None:
    # Mirrors proposals.service.get_proposal_for_user visibility.
    if user.role == UserRole.STARTUP:
        st = db.query(Startup).filter(
            Startup.owner_user_id == user.id).first()
        if st is None:
            raise NotFound("Startup profile not found")
        if prop.startup_id != st.id:
            raise PermissionDenied("Not your proposal")
    elif user.role == UserRole.DEPT_OWNER:
        ch = _get_challenge(db, prop.challenge_id)
        if user.department_id != ch.department_id:
            raise PermissionDenied("Not your department's proposal")


def _apply_engine_result(row: RiskEquivalentAnalysis, result: dict) -> None:
    row.underlying_risk = result["underlying_risk"]
    row.alternative_evidence = result["alternative_evidence"]
    row.residual_risk = result["residual_risk"]
    row.safeguards = result["safeguards"]


def generate_for_proposal(db: Session, user: User,
                          proposal_id: int) -> list[RiskEquivalentAnalysis]:
    prop = _get_proposal(db, proposal_id)
    _assert_generate_allowed(db, user, prop)
    pending = db.query(EligibilityCheck).filter(
        EligibilityCheck.proposal_id == prop.id,
        EligibilityCheck.result == CheckResult.PENDING_MANUAL).order_by(
        EligibilityCheck.id).all()
    profile = _startup_profile(db, prop.startup_id)
    out: list[RiskEquivalentAnalysis] = []
    for check in pending:
        crit = db.get(EligibilityCriterion, check.criterion_id)
        if crit is None:
            raise NotFound(
                f"EligibilityCriterion {check.criterion_id} not found")
        requirement = {
            "criterion_type": crit.criterion_type,
            "operator": crit.operator,
            "threshold": crit.threshold,
            "checked_value": check.checked_value,
        }
        result = analyze(requirement, profile)
        existing = db.query(RiskEquivalentAnalysis).filter(
            RiskEquivalentAnalysis.proposal_id == prop.id,
            RiskEquivalentAnalysis.criterion_id == crit.id).first()
        if existing is not None:
            if existing.human_decision != RiskEquivalentDecision.PENDING:
                out.append(existing)
                continue
            _apply_engine_result(existing, result)
            db.flush()
            out.append(existing)
        else:
            row = RiskEquivalentAnalysis(
                proposal_id=prop.id, criterion_id=crit.id,
                underlying_risk=result["underlying_risk"],
                alternative_evidence=result["alternative_evidence"],
                residual_risk=result["residual_risk"],
                safeguards=result["safeguards"],
                human_decision=RiskEquivalentDecision.PENDING)
            db.add(row)
            try:
                with db.begin_nested():
                    db.flush()
            except IntegrityError:
                row = db.query(RiskEquivalentAnalysis).filter(
                    RiskEquivalentAnalysis.proposal_id == prop.id,
                    RiskEquivalentAnalysis.criterion_id == crit.id).first()
                if row.human_decision == RiskEquivalentDecision.PENDING:
                    _apply_engine_result(row, result)
                    db.flush()
            out.append(row)
    audit(db, user_id=user.id, action=AuditAction.COMPUTE,
          entity_type="RiskEquivalentAnalysis", entity_id=str(prop.id),
          new={"generated": len(out)})
    return out


def list_analyses(db: Session, user: User,
                  proposal_id: int) -> list[RiskEquivalentAnalysis]:
    prop = _get_proposal(db, proposal_id)
    _assert_visible(db, user, prop)
    return db.query(RiskEquivalentAnalysis).filter(
        RiskEquivalentAnalysis.proposal_id == prop.id).order_by(
        RiskEquivalentAnalysis.id).all()


def decide(db: Session, user: User, analysis_id: int,
           decision: str, note: str) -> RiskEquivalentAnalysis:
    if user.role not in (UserRole.EVALUATOR, UserRole.ADMIN):
        raise PermissionDenied(
            "Only evaluators and admins can decide risk analyses")
    row = db.get(RiskEquivalentAnalysis, analysis_id)
    if row is None:
        raise NotFound(f"RiskEquivalentAnalysis {analysis_id} not found")
    if row.human_decision == RiskEquivalentDecision.ACCEPTED:
        raise AppError("Risk analysis has already been decided",
                       status_code=409, code="RISK_ANALYSIS_DECIDED")
    if row.human_decision == RiskEquivalentDecision.REJECTED:
        if user.role != UserRole.ADMIN:
            raise AppError("Risk analysis has already been decided",
                           status_code=409, code="RISK_ANALYSIS_DECIDED")
        # ADMIN re-decide falls through to the normal ACCEPTED/REJECTED logic
    elif row.human_decision != RiskEquivalentDecision.PENDING:
        raise AppError("Risk analysis has already been decided",
                       status_code=409, code="RISK_ANALYSIS_DECIDED")
    if decision == "ACCEPTED":
        check = db.query(EligibilityCheck).filter(
            EligibilityCheck.proposal_id == row.proposal_id,
            EligibilityCheck.criterion_id == row.criterion_id).first()
        if check is None:
            raise NotFound("Linked eligibility check not found")
        if check.result == CheckResult.WAIVED:
            raise AppError("Linked check is already waived",
                           status_code=409, code="NOT_WAIVABLE")
        if check.result != CheckResult.PENDING_MANUAL:
            raise AppError("Only PENDING_MANUAL checks can be waived",
                           status_code=409, code="NOT_WAIVABLE")
        check.result = CheckResult.WAIVED
        check.waived_by = user.id
        check.waiver_justification = (
            f"Risk-equivalent accepted (analysis {row.id}): {note}")
        db.flush()  # persist WAIVED before counting remaining
        prop = db.get(Proposal, row.proposal_id)
        remaining = db.query(EligibilityCheck).filter(
            EligibilityCheck.proposal_id == prop.id,
            EligibilityCheck.result.in_(
                [CheckResult.FAIL, CheckResult.PENDING_MANUAL])).count()
        if remaining == 0:
            prop.status = ProposalStatus.ELIGIBLE
        row.human_decision = RiskEquivalentDecision.ACCEPTED
        row.decided_by = user.id
        row.decided_at = utcnow()
        audit(db, user_id=user.id, action=AuditAction.WAIVE,
              entity_type="RiskEquivalentAnalysis", entity_id=str(row.id),
              new={"decision": "ACCEPTED", "proposal_id": row.proposal_id,
                   "criterion_id": row.criterion_id, "note": note})
    else:  # REJECTED
        row.human_decision = RiskEquivalentDecision.REJECTED
        row.decided_by = user.id
        row.decided_at = utcnow()
        audit(db, user_id=user.id, action=AuditAction.REJECT,
              entity_type="RiskEquivalentAnalysis", entity_id=str(row.id),
              new={"decision": "REJECTED", "proposal_id": row.proposal_id,
                   "criterion_id": row.criterion_id, "note": note})
    return row
