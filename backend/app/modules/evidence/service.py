import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.ai.base import AIProviderUnavailable
from app.ai.factory import get_ai_provider
from app.core.audit import audit
from app.core.config import settings
from app.core.errors import (AIProviderError, AppError, BadRequest, NotFound,
                             PermissionDenied)
from app.core.rules.triage import should_auto_approve
from app.models.enums import AuditAction, UserRole, ValidationStatus
from app.modules.auth.models import User
from app.modules.evidence.models import EvidenceItem, Validation
from app.modules.execution.models import KPI, Milestone
from app.modules.orgs.models import Startup
from app.modules.pilots.models import Pilot

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_INLINE_BYTES = 50 * 1024
UPLOAD_ROOT = Path(__file__).resolve().parents[3] / "uploads"


def _assert_visible(db: Session, user: User, pilot: Pilot) -> Pilot:
    """Local mirror of the frozen pilot-visibility policy, plus EVALUATOR.

    Visible to: assigned pilot manager, owning-dept DEPT_OWNER, ADMIN,
    proposal-owner STARTUP, and any EVALUATOR (validation paths).
    Everyone else gets existence-hiding 404.
    """
    if user.role in (UserRole.ADMIN, UserRole.EVALUATOR):
        return pilot
    if pilot.pilot_manager_id is not None and user.id == pilot.pilot_manager_id:
        return pilot
    if (user.role == UserRole.DEPT_OWNER
            and user.department_id is not None
            and user.department_id == pilot.department_id):
        return pilot
    if user.role == UserRole.STARTUP:
        st = db.query(Startup).filter(
            Startup.owner_user_id == user.id).first()
        if st is not None and st.id == pilot.startup_id:
            return pilot
    raise NotFound(f"Pilot {pilot.id} not found")


def _get_visible_pilot(db: Session, user: User, pilot_id: int) -> Pilot:
    pilot = db.get(Pilot, pilot_id)
    if pilot is None:
        raise NotFound(f"Pilot {pilot_id} not found")
    return _assert_visible(db, user, pilot)


def _get_visible_evidence(db: Session, user: User,
                          evidence_id: int) -> EvidenceItem:
    ev = db.get(EvidenceItem, evidence_id)
    if ev is None:
        raise NotFound(f"Evidence {evidence_id} not found")
    pilot = db.get(Pilot, ev.pilot_id)
    if pilot is None:
        raise NotFound(f"Evidence {evidence_id} not found")
    _assert_visible(db, user, pilot)
    return ev


def _require_startup_owner(db: Session, user: User, pilot: Pilot) -> Startup:
    st = db.query(Startup).filter(Startup.owner_user_id == user.id).first()
    if st is None or st.id != pilot.startup_id:
        raise PermissionDenied(
            "Only the pilot's startup can upload evidence")
    return st


def _paginate(q, page: int, size: int) -> dict:
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


def upload_evidence(db: Session, user: User, pilot_id: int, content: bytes,
                    filename: str, evidence_type, title: str,
                    milestone_id: int | None = None,
                    kpi_id: int | None = None,
                    safety_critical: bool = False) -> EvidenceItem:
    pilot = _get_visible_pilot(db, user, pilot_id)
    _require_startup_owner(db, user, pilot)
    if safety_critical:
        raise AppError("Startups cannot set safety_critical",
                       status_code=400, code="SAFETY_CRITICAL_FORBIDDEN")
    if len(content) > MAX_FILE_BYTES:
        raise AppError("File exceeds the 10MB upload limit",
                       status_code=413, code="FILE_TOO_LARGE")
    if not title or not title.strip():
        raise BadRequest("title must not be empty")
    if len(title) > 255:
        raise BadRequest("title must be at most 255 characters")

    inherited_safety = False
    if milestone_id is not None:
        ms = db.get(Milestone, milestone_id)
        if ms is None or ms.pilot_id != pilot.id:
            raise NotFound(f"Milestone {milestone_id} not found")
        inherited_safety = bool(ms.safety_critical)
    if kpi_id is not None:
        kpi = db.get(KPI, kpi_id)
        if kpi is None or kpi.pilot_id != pilot.id:
            raise NotFound(f"KPI {kpi_id} not found")

    safe_name = Path(filename or "upload.bin").name or "upload.bin"
    dest_dir = UPLOAD_ROOT / str(pilot.id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{uuid.uuid4().hex}_{safe_name}"
    dest.write_bytes(content)

    ev = EvidenceItem(
        pilot_id=pilot.id,
        milestone_id=milestone_id,
        kpi_id=kpi_id,
        evidence_type=evidence_type,
        title=title.strip(),
        file_path=str(dest),
        uploaded_by=user.id,
        status=ValidationStatus.UNVERIFIED,
        safety_critical=inherited_safety,
    )
    db.add(ev)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="EvidenceItem", entity_id=str(ev.id),
          new={"pilot_id": pilot.id, "evidence_type": ev.evidence_type.value,
               "title": ev.title, "milestone_id": milestone_id,
               "kpi_id": kpi_id,
               "safety_critical": inherited_safety})
    return ev


def list_evidence(db: Session, user: User, pilot_id: int, page: int,
                  size: int, status: ValidationStatus | None = None) -> dict:
    pilot = _get_visible_pilot(db, user, pilot_id)
    q = db.query(EvidenceItem).filter(EvidenceItem.pilot_id == pilot.id)
    if status is not None:
        q = q.filter(EvidenceItem.status == status)
    q = q.order_by(EvidenceItem.id)
    return _paginate(q, page, size)


def get_evidence(db: Session, user: User, evidence_id: int) -> EvidenceItem:
    return _get_visible_evidence(db, user, evidence_id)


def run_extraction(db: Session, actor: User,
                   evidence_id: int) -> EvidenceItem:
    ev = _get_visible_evidence(db, actor, evidence_id)
    try:
        raw = Path(ev.file_path).read_bytes()
    except OSError:
        raise NotFound(f"Evidence file for {evidence_id} not found")
    truncated = len(raw) > MAX_INLINE_BYTES
    inline = raw if not truncated else raw[:MAX_INLINE_BYTES]
    text = inline.decode("utf-8", errors="replace")

    try:
        provider = get_ai_provider()
        result = provider.extract(text, ev.evidence_type.value)
    except AIProviderUnavailable as exc:
        raise AIProviderError(
            f"AI provider unavailable: {exc}",
            context={"evidence_id": ev.id}) from exc

    try:
        confidence = float(result.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    extracted = result.get("extracted_data") or {}
    span = str(result.get("source_span") or "")
    trace: dict = {"source_span": span, "truncated": truncated}
    if truncated:
        trace["note"] = (f"Input truncated: first {MAX_INLINE_BYTES} bytes "
                         f"of {len(raw)} sent to the provider.")

    ev.extracted_data = dict(extracted)
    ev.ai_confidence = confidence
    ev.source_trace = trace
    ev.status = ValidationStatus.AI_EXTRACTED
    db.flush()
    audit(db, user_id=actor.id, action=AuditAction.COMPUTE,
          entity_type="EvidenceItem", entity_id=str(ev.id),
          new={"status": ValidationStatus.AI_EXTRACTED.value,
               "confidence": confidence})

    if should_auto_approve(
            confidence, ev.safety_critical, ev.evidence_type.value,
            threshold=settings.triage_auto_approve_threshold):
        ev.status = ValidationStatus.EVALUATOR_VERIFIED
        db.add(Validation(
            evidence_item_id=ev.id, validator_id=None, verdict="VERIFIED",
            method="auto-triage", auto_approved=True,
            notes="Auto-approved by deterministic triage."))
        db.flush()
        audit(db, user_id=None, action=AuditAction.APPROVE,
              entity_type="Validation", entity_id=str(ev.id),
              new={"evidence_id": ev.id, "method": "auto-triage",
                   "confidence": confidence})
    return ev


def _maybe_apply_kpi(db: Session, user: User, ev: EvidenceItem) -> bool:
    """Manual-VERIFIED KPI-apply: numeric extracted actual -> KPI.actual."""
    if ev.kpi_id is None:
        return False
    data = ev.extracted_data or {}
    actual = data.get("actual")
    if isinstance(actual, bool) or not isinstance(actual, (int, float)):
        return False
    kpi = db.get(KPI, ev.kpi_id)
    if kpi is None:
        return False
    kpi.actual = float(actual)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="KPI", entity_id=str(kpi.id),
          new={"actual": float(actual), "source": f"evidence:{ev.id}"})
    return True


def validate_evidence(db: Session, validator: User, evidence_id: int,
                      verdict: str, notes: str = "",
                      escalate_safety: bool | None = None) -> EvidenceItem:
    if validator.role not in (UserRole.EVALUATOR, UserRole.ADMIN):
        raise PermissionDenied(
            "Only evaluators or admins can validate evidence",
            context={"required": ["EVALUATOR", "ADMIN"]})
    ev = _get_visible_evidence(db, validator, evidence_id)
    if verdict not in ("VERIFIED", "REJECTED"):
        raise BadRequest("verdict must be VERIFIED or REJECTED",
                         context={"verdict": verdict})
    if ev.status == ValidationStatus.REJECTED:
        raise AppError("Evidence has already been rejected",
                       status_code=409, code="EVIDENCE_ALREADY_DECIDED")
    manual = db.query(Validation).filter(
        Validation.evidence_item_id == ev.id,
        Validation.auto_approved.is_(False)).first()
    if manual is not None:
        raise AppError("Evidence has already been manually validated",
                       status_code=409, code="EVIDENCE_ALREADY_DECIDED")
    if ev.status == ValidationStatus.UNVERIFIED:
        raise AppError("Evidence must be extracted before validation",
                       status_code=409, code="EVIDENCE_NOT_EXTRACTED")

    if escalate_safety is True:
        ev.safety_critical = True
    if verdict == "VERIFIED":
        ev.status = ValidationStatus.EVALUATOR_VERIFIED
    else:
        ev.status = ValidationStatus.REJECTED
    db.add(Validation(
        evidence_item_id=ev.id, validator_id=validator.id, verdict=verdict,
        method="manual", auto_approved=False, notes=notes or ""))
    db.flush()
    audit(db, user_id=validator.id, action=AuditAction.VALIDATE,
          entity_type="EvidenceItem", entity_id=str(ev.id),
          new={"verdict": verdict, "notes": notes or "",
               "safety_critical": ev.safety_critical})
    if verdict == "VERIFIED":
        _maybe_apply_kpi(db, validator, ev)
    return ev


def pending_queue(db: Session, user: User, page: int, size: int) -> dict:
    if user.role not in (UserRole.EVALUATOR, UserRole.ADMIN):
        raise PermissionDenied(
            "Only evaluators or admins can view the validation queue",
            context={"required": ["EVALUATOR", "ADMIN"]})
    q = db.query(EvidenceItem).filter(
        EvidenceItem.status == ValidationStatus.AI_EXTRACTED).order_by(
        EvidenceItem.id)
    return _paginate(q, page, size)
