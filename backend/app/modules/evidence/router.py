from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import NotFound
from app.core.rbac import require_any_authenticated
from app.models.enums import EvidenceType, ValidationStatus
from app.modules.auth.models import User
from app.modules.evidence import service
from app.modules.evidence.schemas import (
    EvidenceOut, PaginatedEvidence, ValidateBody)

evidence_router = APIRouter()


@evidence_router.post("/pilots/{pilot_id}/evidence",
                      response_model=EvidenceOut, status_code=201)
def upload_evidence(pilot_id: int,
                    file: UploadFile = File(...),
                    evidence_type: EvidenceType = Form(...),
                    title: str = Form(..., min_length=1, max_length=255),
                    milestone_id: int | None = Form(None),
                    kpi_id: int | None = Form(None),
                    safety_critical: bool = Form(False),
                    user: User = Depends(require_any_authenticated()),
                    db: Session = Depends(get_session)):
    content = file.file.read()
    ev = service.upload_evidence(
        db, user, pilot_id, content, file.filename or "upload.bin",
        evidence_type, title, milestone_id=milestone_id, kpi_id=kpi_id,
        safety_critical=safety_critical)
    db.commit()
    return ev


@evidence_router.get("/pilots/{pilot_id}/evidence",
                     response_model=PaginatedEvidence)
def list_evidence(pilot_id: int,
                  status: ValidationStatus | None = Query(None),
                  page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                  user: User = Depends(require_any_authenticated()),
                  db: Session = Depends(get_session)):
    return service.list_evidence(db, user, pilot_id, page, size, status=status)


@evidence_router.get("/evidence/pending", response_model=PaginatedEvidence)
def pending_queue(page: int = Query(1, ge=1),
                  size: int = Query(20, ge=1, le=100),
                  user: User = Depends(require_any_authenticated()),
                  db: Session = Depends(get_session)):
    return service.pending_queue(db, user, page, size)


@evidence_router.get("/evidence/{evidence_id}", response_model=EvidenceOut)
def get_evidence(evidence_id: int,
                 user: User = Depends(require_any_authenticated()),
                 db: Session = Depends(get_session)):
    return service.get_evidence(db, user, evidence_id)


@evidence_router.get("/evidence/{evidence_id}/file")
def download_evidence_file(evidence_id: int,
                           user: User = Depends(require_any_authenticated()),
                           db: Session = Depends(get_session)):
    ev = service.get_evidence(db, user, evidence_id)
    if not Path(ev.file_path).is_file():
        raise NotFound(f"Evidence file for {evidence_id} not found")
    return FileResponse(ev.file_path, filename=Path(ev.file_path).name)


@evidence_router.post("/evidence/{evidence_id}/extract",
                      response_model=EvidenceOut)
def extract_evidence(evidence_id: int,
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    ev = service.run_extraction(db, user, evidence_id)
    db.commit()
    return ev


@evidence_router.post("/evidence/{evidence_id}/validate",
                      response_model=EvidenceOut)
def validate_evidence(evidence_id: int, payload: ValidateBody,
                      user: User = Depends(require_any_authenticated()),
                      db: Session = Depends(get_session)):
    ev = service.validate_evidence(
        db, user, evidence_id, payload.verdict, notes=payload.notes,
        escalate_safety=payload.safety_critical)
    db.commit()
    return ev
