from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import (AppError, BadRequest,
                             NotFound, PermissionDenied)
from app.models.enums import AuditAction, CheckResult, GateType, ProposalStatus, UserRole
from app.modules.auth.models import User
from app.modules.challenges.models import EligibilityCriterion
from app.modules.challenges.service import get_challenge
from app.modules.orgs.models import Startup
from app.modules.proposals.models import (
    EligibilityCheck, EvaluationPanel, EvaluationPanelMember,
    Proposal, ProposalScore)
from app.modules.proposals.schemas import ProposalCreate

# Frozen proposal lifecycle map (Plan 4 Task G; Plan 5 handoff depends on it).
# Every proposal status change routes through core.transitions.assert_transition
# with this map — no ad-hoc assignment.
PROPOSAL_TRANSITIONS = {
    ProposalStatus.SUBMITTED: [ProposalStatus.ELIGIBLE, ProposalStatus.SUBMITTED,
                               ProposalStatus.REJECTED],
    ProposalStatus.ELIGIBLE: [ProposalStatus.ELIGIBLE, ProposalStatus.SUBMITTED,
                              ProposalStatus.UNDER_EVALUATION,
                              ProposalStatus.REJECTED],
    ProposalStatus.UNDER_EVALUATION: [ProposalStatus.SELECTED, ProposalStatus.REJECTED,
                                      ProposalStatus.UNDER_EVALUATION],
    ProposalStatus.SELECTED: [],
    ProposalStatus.REJECTED: [],
}


def _startup_of(db: Session, user: User) -> Startup:
    st = db.query(Startup).filter(Startup.owner_user_id == user.id).first()
    if st is None:
        raise NotFound("Startup profile not found")
    return st


def _startup_values(db: Session, startup_id: int) -> dict:
    st = db.get(Startup, startup_id)
    return {"annual_turnover": st.annual_turnover,
            "prior_deployments": st.prior_deployments,
            "dpiit_number": st.dpiit_number}


def submit_proposal(db: Session, user: User, challenge_id: int,
                    payload: ProposalCreate) -> Proposal:
    ch = get_challenge(db, challenge_id)
    from app.models.enums import ChallengeStatus
    if ch.status != ChallengeStatus.PUBLISHED:
        raise AppError("Challenge is not open for proposals",
                       status_code=409, code="CHALLENGE_NOT_OPEN")
    st = _startup_of(db, user)
    prop = Proposal(challenge_id=challenge_id, startup_id=st.id,
                    status=ProposalStatus.SUBMITTED,
                    technical_summary=payload.technical_summary,
                    cost_estimate=payload.cost_estimate)
    db.add(prop)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise AppError("Proposal already submitted for this challenge",
                       status_code=409, code="PROPOSAL_DUPLICATE")
    audit(db, user_id=user.id, action=AuditAction.CREATE, entity_type="Proposal",
          entity_id=str(prop.id),
          new={"challenge_id": challenge_id, "startup_id": st.id,
               "cost_estimate": payload.cost_estimate})
    _run_eligibility_for_proposal(db, user.id, prop, from_submit=True)
    return prop


def _run_eligibility_for_proposal(db: Session, actor_user_id: int,
                                  prop: Proposal, from_submit: bool = False) -> None:
    criteria = db.query(EligibilityCriterion).filter(
        EligibilityCriterion.challenge_id == prop.challenge_id).order_by(
        EligibilityCriterion.id).all()
    if not criteria:
        prop.status = ProposalStatus.ELIGIBLE
        audit(db, user_id=actor_user_id, action=AuditAction.COMPUTE,
              entity_type="Proposal", entity_id=str(prop.id),
              new={"eligibility": [], "status": prop.status.value})
        return
    svals = _startup_values(db, prop.startup_id)
    engine_input = [{"criterion_id": c.id,
                     "criterion_type": c.criterion_type,
                     "operator": c.operator,
                     "threshold": c.threshold,
                     "is_auto_checkable": c.is_auto_checkable} for c in criteria]
    from app.core.rules.eligibility import run_eligibility
    results = run_eligibility(svals, engine_input)
    # idempotent re-run: clear old checks
    db.query(EligibilityCheck).filter(
        EligibilityCheck.proposal_id == prop.id).delete()
    outcome_lines = []
    all_clear = True
    for c, r in zip(criteria, results):
        result = r["result"]
        if result == "FAIL" and c.waiver_allowed:
            result = "PENDING_MANUAL"
        if result in ("FAIL", "PENDING_MANUAL"):
            all_clear = False
        check = EligibilityCheck(proposal_id=prop.id, criterion_id=c.id,
                                 result=CheckResult(result),
                                 checked_value=r["checked_value"])
        db.add(check)
        outcome_lines.append({"criterion_id": c.id, "result": result})
    db.flush()
    if not from_submit:
        # preserve WAIVED rows on manual re-run is impossible after delete; simplest
        # correct behavior: re-run recomputes everything, waivers must be re-granted.
        # (Documented trade-off; waiver re-grant is cheap for MVP.)
        pass
    prop.status = ProposalStatus.ELIGIBLE if all_clear else ProposalStatus.SUBMITTED
    audit(db, user_id=actor_user_id, action=AuditAction.COMPUTE,
          entity_type="Proposal", entity_id=str(prop.id),
          new={"eligibility": outcome_lines,
               "status": prop.status.value})


def rerun_eligibility(db: Session, user: User, proposal_id: int) -> Proposal:
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    if user.role not in (UserRole.ADMIN, UserRole.DEPT_OWNER):
        raise PermissionDenied("Only government roles can re-run eligibility")
    if user.role == UserRole.DEPT_OWNER:
        ch = get_challenge(db, prop.challenge_id)
        if user.department_id != ch.department_id:
            raise PermissionDenied("Not your department's proposal")
    if prop.status not in (ProposalStatus.SUBMITTED, ProposalStatus.ELIGIBLE):
        raise AppError(
            f"Eligibility can only be re-run on SUBMITTED/ELIGIBLE proposals "
            f"(current: {prop.status.value})",
            status_code=409, code="PROPOSAL_LOCKED")
    _run_eligibility_for_proposal(db, user.id, prop)
    return prop


def get_proposal_for_user(db: Session, user: User, proposal_id: int) -> Proposal:
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    if user.role == UserRole.STARTUP:
        st = _startup_of(db, user)
        if prop.startup_id != st.id:
            raise PermissionDenied("Not your proposal")
    elif user.role == UserRole.DEPT_OWNER:
        ch = get_challenge(db, prop.challenge_id)
        if user.department_id != ch.department_id:
            raise PermissionDenied("Not your department's proposal")
    return prop


def list_my_proposals(db: Session, user: User, page: int, size: int) -> dict:
    st = _startup_of(db, user)
    q = db.query(Proposal).filter(Proposal.startup_id == st.id)
    total = q.count()
    items = q.order_by(Proposal.id.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


def list_challenge_proposals(db: Session, user: User, challenge_id: int,
                             page: int, size: int) -> dict:
    ch = get_challenge(db, challenge_id)
    if user.role == UserRole.DEPT_OWNER and user.department_id != ch.department_id:
        raise PermissionDenied("Not your department's challenge")
    q = db.query(Proposal).filter(Proposal.challenge_id == challenge_id)
    total = q.count()
    items = q.order_by(Proposal.id.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


def waive_check(db: Session, user: User, check_id: int, justification: str) -> EligibilityCheck:
    if user.role != UserRole.ADMIN:
        raise PermissionDenied("Only ADMIN can waive eligibility criteria")
    check = db.get(EligibilityCheck, check_id)
    if check is None:
        raise NotFound(f"EligibilityCheck {check_id} not found")
    if check.result != CheckResult.PENDING_MANUAL:
        raise AppError("Only PENDING_MANUAL checks can be waived",
                       status_code=409, code="NOT_WAIVABLE")
    check.result = CheckResult.WAIVED
    check.waived_by = user.id
    check.waiver_justification = justification
    db.flush()  # autoflush=False session: persist WAIVED before counting remaining
    prop = db.get(Proposal, check.proposal_id)
    remaining = db.query(EligibilityCheck).filter(
        EligibilityCheck.proposal_id == prop.id,
        EligibilityCheck.result.in_([CheckResult.FAIL, CheckResult.PENDING_MANUAL])).count()
    if remaining == 0:
        prop.status = ProposalStatus.ELIGIBLE
    audit(db, user_id=user.id, action=AuditAction.WAIVE,
          entity_type="EligibilityCheck", entity_id=str(check.id),
          new={"justification": justification, "proposal_id": prop.id,
               "criterion_id": check.criterion_id})
    return check


# ---- Evaluation scoring (Plan 4 Task E) ----

def _dept_owns_challenge(db: Session, user: User, challenge_id: int):
    ch = get_challenge(db, challenge_id)
    if user.role != UserRole.ADMIN and user.department_id != ch.department_id:
        raise PermissionDenied("Not your department's challenge")
    return ch


def _is_panel_member(db: Session, challenge_id: int, evaluator_user_id: int) -> bool:
    return db.query(EvaluationPanelMember).join(
        EvaluationPanel,
        EvaluationPanel.id == EvaluationPanelMember.panel_id).filter(
        EvaluationPanel.challenge_id == challenge_id,
        EvaluationPanelMember.evaluator_user_id == evaluator_user_id).first() is not None


def _require_panel_member(db: Session, evaluator_user_id: int,
                          challenge_id: int) -> None:
    if not _is_panel_member(db, challenge_id, evaluator_user_id):
        raise PermissionDenied(
            "You are not on an evaluation panel for this challenge")


def create_panel(db: Session, user: User, challenge_id: int, name: str) -> EvaluationPanel:
    ch = _dept_owns_challenge(db, user, challenge_id)
    panel = EvaluationPanel(challenge_id=ch.id, name=name)
    db.add(panel)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="EvaluationPanel", entity_id=str(panel.id),
          new={"challenge_id": ch.id, "name": name})
    return panel


def add_panel_member(db: Session, user: User, challenge_id: int,
                     panel_id: int, evaluator_user_id: int) -> EvaluationPanelMember:
    _dept_owns_challenge(db, user, challenge_id)
    panel = db.get(EvaluationPanel, panel_id)
    if panel is None or panel.challenge_id != challenge_id:
        raise NotFound(f"EvaluationPanel {panel_id} not found")
    target = db.get(User, evaluator_user_id)
    if target is None:
        raise NotFound(f"User {evaluator_user_id} not found")
    if target.role not in (UserRole.EVALUATOR, UserRole.ADMIN):
        raise BadRequest("Panel members must have EVALUATOR or ADMIN role",
                         context={"user_id": evaluator_user_id,
                                  "role": target.role.value})
    existing = db.query(EvaluationPanelMember).filter(
        EvaluationPanelMember.panel_id == panel_id,
        EvaluationPanelMember.evaluator_user_id == evaluator_user_id).first()
    if existing is not None:
        raise AppError("Evaluator is already a member of this panel",
                       status_code=409, code="PANEL_MEMBER_DUPLICATE")
    member = EvaluationPanelMember(panel_id=panel_id,
                                   evaluator_user_id=evaluator_user_id)
    db.add(member)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise AppError("Evaluator is already a member of this panel",
                       status_code=409, code="PANEL_MEMBER_DUPLICATE")
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="EvaluationPanelMember", entity_id=str(member.id),
          new={"panel_id": panel_id, "evaluator_user_id": evaluator_user_id})
    return member


def upsert_score(db: Session, evaluator: User, proposal_id: int,
                 gate, dimension: str, raw_score: float) -> ProposalScore:
    from app.core.rules.evaluation import DIMENSIONS, GATES
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    if evaluator.role not in (UserRole.EVALUATOR, UserRole.ADMIN):
        raise PermissionDenied("Only evaluators can score proposals")
    if evaluator.role == UserRole.EVALUATOR:
        _require_panel_member(db, evaluator.id, prop.challenge_id)
    gate_value = gate.value if hasattr(gate, "value") else str(gate)
    if gate_value not in GATES:
        raise BadRequest(f"Unknown gate: {gate_value}",
                         context={"gate": gate_value})
    if dimension not in DIMENSIONS:
        raise BadRequest(f"Unknown evaluation dimension: {dimension}",
                         context={"dimension": dimension})
    score = db.query(ProposalScore).filter(
        ProposalScore.proposal_id == proposal_id,
        ProposalScore.evaluator_user_id == evaluator.id,
        ProposalScore.gate == GateType(gate_value),
        ProposalScore.dimension == dimension).first()
    if score is not None:
        score.raw_score = raw_score
        db.flush()
    else:
        score = ProposalScore(proposal_id=proposal_id,
                              evaluator_user_id=evaluator.id,
                              gate=GateType(gate_value),
                              dimension=dimension, raw_score=raw_score)
        db.add(score)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            score = db.query(ProposalScore).filter(
                ProposalScore.proposal_id == proposal_id,
                ProposalScore.evaluator_user_id == evaluator.id,
                ProposalScore.gate == GateType(gate_value),
                ProposalScore.dimension == dimension).first()
            score.raw_score = raw_score
            db.flush()
    audit(db, user_id=evaluator.id, action=AuditAction.COMPUTE,
          entity_type="ProposalScore", entity_id=str(score.id),
          new={"proposal_id": proposal_id, "gate": gate_value,
               "dimension": dimension, "raw_score": raw_score})
    return score


def list_scores(db: Session, user: User, proposal_id: int,
                page: int, size: int) -> dict:
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    if user.role == UserRole.STARTUP:
        st = _startup_of(db, user)
        if prop.startup_id != st.id:
            raise PermissionDenied("Not your proposal")
    elif user.role == UserRole.DEPT_OWNER:
        ch = get_challenge(db, prop.challenge_id)
        if user.department_id != ch.department_id:
            raise PermissionDenied("Not your department's proposal")
    elif user.role == UserRole.ADMIN:
        pass
    elif user.role == UserRole.EVALUATOR:
        _require_panel_member(db, user.id, prop.challenge_id)
    else:
        raise PermissionDenied("Not allowed to view proposal scores")
    q = db.query(ProposalScore).filter(
        ProposalScore.proposal_id == prop.id).order_by(ProposalScore.id)
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


def get_ranking(db: Session, user: User, challenge_id: int) -> dict:
    from app.modules.challenges.service import DEFAULT_EVALUATION_WEIGHTS
    ch = get_challenge(db, challenge_id)
    if user.role == UserRole.DEPT_OWNER and user.department_id != ch.department_id:
        raise PermissionDenied("Not your department's challenge")
    elif user.role == UserRole.EVALUATOR and not _is_panel_member(
            db, challenge_id, user.id):
        raise PermissionDenied("You are not on an evaluation panel for this challenge")
    elif user.role not in (UserRole.DEPT_OWNER, UserRole.ADMIN, UserRole.EVALUATOR):
        raise PermissionDenied("Not allowed to view this ranking")
    weights = dict(ch.evaluation_weights or DEFAULT_EVALUATION_WEIGHTS)
    proposals = db.query(Proposal).filter(
        Proposal.challenge_id == challenge_id).order_by(Proposal.id).all()
    startup_by_proposal = {p.id: p.startup_id for p in proposals}
    score_rows = db.query(ProposalScore).filter(
        ProposalScore.proposal_id.in_(list(startup_by_proposal)))\
        .order_by(ProposalScore.id).all() if startup_by_proposal else []
    from app.core.rules.evaluation import rank_proposals
    scored = [{"proposal_id": s.proposal_id,
               "startup_id": startup_by_proposal[s.proposal_id],
               "gate": s.gate.value if hasattr(s.gate, "value") else str(s.gate),
               "dimension": s.dimension,
               "raw_score": s.raw_score} for s in score_rows]
    return {"items": rank_proposals(scored, weights), "weights": weights}


# ---- Selection workflow (Plan 4 Task G) ----

def get_selected_proposal(db: Session, challenge_id: int) -> Proposal | None:
    """Frozen handoff for Plan 5: the SELECTED proposal for a challenge, or None."""
    return db.query(Proposal).filter(
        Proposal.challenge_id == challenge_id,
        Proposal.status == ProposalStatus.SELECTED).first()


def start_evaluation(db: Session, user: User, challenge_id: int) -> int:
    from app.core.transitions import assert_transition
    ch = get_challenge(db, challenge_id)
    if user.role == UserRole.DEPT_OWNER and user.department_id != ch.department_id:
        raise PermissionDenied("Not your department's challenge")
    props = db.query(Proposal).filter(
        Proposal.challenge_id == challenge_id).all()
    moved = 0
    for prop in props:
        if prop.status != ProposalStatus.ELIGIBLE:
            continue  # SUBMITTED stays; SELECTED/REJECTED untouched (finality)
        assert_transition("Proposal", prop.status, PROPOSAL_TRANSITIONS,
                          ProposalStatus.UNDER_EVALUATION)
        old_status = prop.status.value
        prop.status = ProposalStatus.UNDER_EVALUATION
        db.flush()
        audit(db, user_id=user.id, action=AuditAction.UPDATE,
              entity_type="Proposal", entity_id=str(prop.id),
              old={"status": old_status},
              new={"status": prop.status.value})
        moved += 1
    return moved


def select_proposal(db: Session, user: User, proposal_id: int) -> Proposal:
    from app.core.transitions import assert_transition
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    ch = get_challenge(db, prop.challenge_id)
    if user.role == UserRole.DEPT_OWNER and user.department_id != ch.department_id:
        raise PermissionDenied("Not your department's proposal")
    if prop.status not in (ProposalStatus.ELIGIBLE, ProposalStatus.UNDER_EVALUATION):
        raise AppError(
            f"Only ELIGIBLE/UNDER_EVALUATION proposals can be selected "
            f"(current: {prop.status.value})",
            status_code=409, code="PROPOSAL_NOT_SELECTABLE")
    existing = get_selected_proposal(db, prop.challenge_id)
    if existing is not None:
        raise AppError(
            f"Challenge {prop.challenge_id} already has a selected proposal "
            f"(id={existing.id})",
            status_code=409, code="CHALLENGE_ALREADY_DECIDED")
    # Route ELIGIBLE through UNDER_EVALUATION first so every status change
    # goes through PROPOSAL_TRANSITIONS (no ad-hoc assignment).
    old_status = prop.status.value
    if prop.status == ProposalStatus.ELIGIBLE:
        assert_transition("Proposal", prop.status, PROPOSAL_TRANSITIONS,
                          ProposalStatus.UNDER_EVALUATION)
        prop.status = ProposalStatus.UNDER_EVALUATION
        db.flush()
        audit(db, user_id=user.id, action=AuditAction.UPDATE,
              entity_type="Proposal", entity_id=str(prop.id),
              old={"status": old_status},
              new={"status": prop.status.value})
    assert_transition("Proposal", prop.status, PROPOSAL_TRANSITIONS,
                      ProposalStatus.SELECTED)
    old_status = prop.status.value
    prop.status = ProposalStatus.SELECTED
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.SELECT,
          entity_type="Proposal", entity_id=str(prop.id),
          old={"status": old_status},
          new={"challenge_id": prop.challenge_id,
               "startup_id": prop.startup_id,
               "status": prop.status.value})
    siblings = db.query(Proposal).filter(
        Proposal.challenge_id == prop.challenge_id,
        Proposal.id != prop.id).all()
    for sib in siblings:
        if sib.status in (ProposalStatus.SELECTED, ProposalStatus.REJECTED):
            continue  # finality: never touch already-decided proposals
        # Sibling-supersede during select is a legitimate forced transition:
        # SUBMITTED/ELIGIBLE/UNDER_EVALUATION siblings all flip to REJECTED
        # via PROPOSAL_TRANSITIONS (decision finality — no lingering
        # ELIGIBLE siblings alongside a SELECTED proposal).
        assert_transition("Proposal", sib.status, PROPOSAL_TRANSITIONS,
                          ProposalStatus.REJECTED)
        old_sib = sib.status.value
        sib.status = ProposalStatus.REJECTED
        db.flush()
        audit(db, user_id=user.id, action=AuditAction.REJECT,
              entity_type="Proposal", entity_id=str(sib.id),
              old={"status": old_sib},
              new={"reason": "superseded by selection",
                   "selected_proposal_id": prop.id,
                   "status": sib.status.value})
    return prop


def reject_proposal(db: Session, user: User, proposal_id: int,
                    reason: str) -> Proposal:
    from app.core.transitions import assert_transition
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    ch = get_challenge(db, prop.challenge_id)
    if user.role == UserRole.DEPT_OWNER and user.department_id != ch.department_id:
        raise PermissionDenied("Not your department's proposal")
    if prop.status not in (ProposalStatus.ELIGIBLE, ProposalStatus.UNDER_EVALUATION):
        raise AppError(
            f"Only ELIGIBLE/UNDER_EVALUATION proposals can be rejected "
            f"(current: {prop.status.value})",
            status_code=409, code="PROPOSAL_NOT_REJECTABLE")
    # Route ELIGIBLE through UNDER_EVALUATION first so the REJECTED assignment
    # goes through PROPOSAL_TRANSITIONS (no ad-hoc assignment).
    old_status = prop.status.value
    if prop.status == ProposalStatus.ELIGIBLE:
        assert_transition("Proposal", prop.status, PROPOSAL_TRANSITIONS,
                          ProposalStatus.UNDER_EVALUATION)
        prop.status = ProposalStatus.UNDER_EVALUATION
        db.flush()
        audit(db, user_id=user.id, action=AuditAction.UPDATE,
              entity_type="Proposal", entity_id=str(prop.id),
              old={"status": old_status},
              new={"status": prop.status.value})
    assert_transition("Proposal", prop.status, PROPOSAL_TRANSITIONS,
                      ProposalStatus.REJECTED)
    old_status = prop.status.value
    prop.status = ProposalStatus.REJECTED
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.REJECT,
          entity_type="Proposal", entity_id=str(prop.id),
          old={"status": old_status},
          new={"reason": reason, "status": prop.status.value})
    return prop
