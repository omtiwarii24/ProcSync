"""Seed the dev database with the canonical SIH26136 demo world.

Creates the demo users, departments, challenges, proposal, pilot,
milestones, evidence, and payments that mirror the frontend mock data
(AcoustiLeak Sensors / NMC Nashik water pilot).

Usage:
    python -m scripts.seed
"""
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.enums import (ChallengeStatus, CriterionOperator, CriterionType,
                              DomainTag, EvidenceType, MilestoneStatus,
                              PilotStatus, ProposalStatus, UserRole,
                              ValidationStatus)
from app.modules.auth.models import User
from app.modules.challenges.models import Challenge, EligibilityCriterion
from app.modules.evidence.models import EvidenceItem
from app.modules.execution.models import KPI, Milestone
from app.modules.orgs.models import Department, Startup
from app.modules.payments.models import PaymentRecord
from app.modules.pilots.models import Pilot
from app.modules.proposals.models import Proposal

DEMO_PASSWORD = "procsync@2026"
UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"

USERS = [
    ("admin@procsync.gov.in", UserRole.ADMIN, "State Administrator", None),
    ("ce.nashik@nmc.gov.in", UserRole.DEPT_OWNER, "Er. Sanjay Deshmukh", "NMC"),
    ("hyd.coep@coep.ac.in", UserRole.EVALUATOR, "Dr. Vidya Joshi", None),
    ("ca.pmc@pmc.gov.in", UserRole.FINANCE, "Chief Accounts Officer", None),
    ("pm.nmc@nmc.gov.in", UserRole.PILOT_MANAGER, "NMC Pilot Manager", "NMC"),
    ("founder@acoustileak.in", UserRole.STARTUP, "Er. Vikram Deshmukh", None),
]

DEPARTMENTS = {
    "NMC": ("Nashik Municipal Corporation (NMC)", "NMC"),
    "PMC": ("Pune Municipal Corporation (PMC)", "PMC"),
}

CHALLENGES = [
    {
        "dept": "NMC",
        "title": "Sub-Surface Water Leakage Localization in Hard Basalt Strata",
        "problem_statement": (
            "Sub-surface drinking water leakage in elevated reservoir distribution pipelines "
            "causing 32% Non-Revenue Water loss across Panchavati & CIDCO divisions. Manual "
            "acoustic leak detection takes 40+ hours per rupture with poor pinpoint accuracy "
            "over Deccan basalt strata."),
        "baseline": "32% NRW loss; 40+ hours manual leak detection per rupture",
        "target": "Reduce NRW loss to < 20%; locate pinhole leaks within 2m in < 6 hours",
        "domain": DomainTag.WATER,
        "budget": 1500000.0,
        "status": ChallengeStatus.PUBLISHED,
        "criteria": [
            (CriterionType.DPIIT, CriterionOperator.EQ, 1.0, "Must be DPIIT-recognized"),
            (CriterionType.EXPERIENCE, CriterionOperator.GTE, 1.0, "At least 1 prior field deployment"),
            (CriterionType.TURNOVER, CriterionOperator.LTE, 100000000.0, "Turnover within GFR 149 Safe Harbor"),
        ],
    },
    {
        "dept": "PMC",
        "title": "Pune Kothrud Water Distribution Leakage Remediation (Source Pilot)",
        "problem_statement": (
            "Non-revenue water loss of 35.2% in Kothrud distribution zone requiring "
            "acoustic correlation-based leak detection and remediation validation over a "
            "90-day proving pilot."),
        "baseline": "35.2% NRW loss",
        "target": "NRW loss below 20%",
        "domain": DomainTag.WATER,
        "budget": 1400000.0,
        "status": ChallengeStatus.PUBLISHED,
        "criteria": [
            (CriterionType.DPIIT, CriterionOperator.EQ, 1.0, "Must be DPIIT-recognized"),
        ],
    },
]

MILESTONES = [
    ("Milestone 1 - Hardware Clamp Deployment & Baseline Ping", 120000.0, MilestoneStatus.PAID),
    ("Milestone 2 - Basalt Strata Acoustic Waveform Calibration", 160000.0, MilestoneStatus.VERIFIED),
    ("Milestone 3 - Final Verification & Passport Finalization", 120000.0, MilestoneStatus.PENDING),
]

KPIS = [
    ("Non-Revenue Water Loss", "NRW % of pumped volume", "%", 32.0, 20.0, "LOWER"),
    ("Leak Localization Accuracy", "Excavation offset from predicted point", "m", 8.0, 2.0, "LOWER"),
]


def _write_evidence_file(pilot_id: int, name: str) -> str:
    dest_dir = UPLOAD_ROOT / str(pilot_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{uuid.uuid4().hex}_{name}"
    dest.write_text("seeded demo evidence file", encoding="utf-8")
    return str(dest)


def main() -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == USERS[0][0]).first() is not None:
            print("Seed: already seeded — skipping. (Drop the DB to re-seed.)")
            return

        print("Seed: creating departments...")
        depts: dict[str, Department] = {}
        for key, (name, code) in DEPARTMENTS.items():
            d = Department(
                name=name, code=code,
                connectivity_tier="HIGH", power_reliability="STABLE",
                it_maturity="HIGH", settlement_type="URBAN", terrain_type="HILLY")
            db.add(d)
            depts[key] = d
        db.flush()

        print("Seed: creating users...")
        users: dict[str, User] = {}
        for email, role, full_name, dept_key in USERS:
            u = User(
                email=email,
                password_hash=hash_password(DEMO_PASSWORD),
                role=role, full_name=full_name,
                department_id=depts[dept_key].id if dept_key else None)
            db.add(u)
            users[email] = u
        db.flush()

        print("Seed: creating startup profile...")
        startup = Startup(
            owner_user_id=users["founder@acoustileak.in"].id,
            name="AcoustiLeak Sensors Pvt Ltd",
            dpiit_number="DIPP99421",
            sectors=["Smart Water & Urban Distribution IoT"],
            team_size=12, annual_turnover=4200000.0, runway_months=14,
            prior_deployments=2,
            description="Sub-surface acoustic waveform spectrogram array for municipal water leak localization.")
        db.add(startup)
        db.flush()

        print("Seed: creating challenges...")
        challenges: list[Challenge] = []
        for spec in CHALLENGES:
            ch = Challenge(
                department_id=depts[spec["dept"]].id,
                title=spec["title"],
                problem_statement=spec["problem_statement"],
                baseline=spec["baseline"], target=spec["target"],
                domain=spec["domain"], budget=spec["budget"],
                status=spec["status"])
            db.add(ch)
            db.flush()
            for ctype, op, threshold, desc in spec["criteria"]:
                db.add(EligibilityCriterion(
                    challenge_id=ch.id, criterion_type=ctype, operator=op,
                    threshold=threshold,
                    is_auto_checkable=ctype != CriterionType.CUSTOM,
                    waiver_allowed=True, description=desc))
            challenges.append(ch)
        db.flush()

        print("Seed: creating proposals...")
        prop_nmc = Proposal(
            challenge_id=challenges[0].id, startup_id=startup.id,
            status=ProposalStatus.SELECTED,
            technical_summary=(
                "Acoustic transit wave velocity modeling on Deccan basalt distribution grid. "
                "Targeted 25-day sandbox with 40 clamp nodes to reduce NRW loss from 32% to < 20%."),
            cost_estimate=400000.0)
        prop_pmc = Proposal(
            challenge_id=challenges[1].id, startup_id=startup.id,
            status=ProposalStatus.SUBMITTED,
            technical_summary=(
                "Acoustic correlation array deployment on Kothrud trunk mains; 90-day "
                "remediation validation with SCADA flowmeter telemetry audit."),
            cost_estimate=1400000.0)
        db.add(prop_nmc)
        db.add(prop_pmc)
        db.flush()

        print("Seed: creating pilot...")
        pilot = Pilot(
            proposal_id=prop_nmc.id,
            department_id=depts["NMC"].id,
            startup_id=startup.id,
            pilot_manager_id=users["pm.nmc@nmc.gov.in"].id,
            scope=("40 acoustic clamp sensors across 15km Panchavati trunk; basalt "
                   "velocity calibration; NRW reduction validation within 25 days."),
            status=PilotStatus.ACTIVE,
            terms_accepted=True,
            data_ip_terms="MSInS Sandbox Data/IP Custody Terms v2.4")
        db.add(pilot)
        db.flush()

        print("Seed: creating milestones + payments...")
        milestones: list[Milestone] = []
        for title, amount, status in MILESTONES:
            ms = Milestone(pilot_id=pilot.id, title=title, amount=amount, status=status)
            db.add(ms)
            milestones.append(ms)
        db.flush()
        # M1 is PAID → seed its disbursed payment record
        db.add(PaymentRecord(
            milestone_id=milestones[0].id, amount=milestones[0].amount,
            status="DISBURSED", invoiced_by=users["founder@acoustileak.in"].id,
            approved_by=users["ca.pmc@pmc.gov.in"].id))

        print("Seed: creating KPIs...")
        for name, definition, unit, baseline, target, direction in KPIS:
            db.add(KPI(pilot_id=pilot.id, name=name, definition=definition,
                       unit=unit, baseline=baseline, target=target,
                       direction=direction))
        db.flush()

        print("Seed: creating evidence...")
        db.add(EvidenceItem(
            pilot_id=pilot.id, milestone_id=milestones[0].id, kpi_id=None,
            evidence_type=EvidenceType.PHOTO,
            title="Hardware Clamp Mounting Survey Panchavati",
            file_path=_write_evidence_file(pilot.id, "Hardware_Clamp_Mounting_Survey_Panchavati.pdf"),
            uploaded_by=users["founder@acoustileak.in"].id,
            status=ValidationStatus.EVALUATOR_VERIFIED,
            extracted_data={"nodes": "40 Installed across 15km", "telemetry": "100% alive"},
            ai_confidence=0.99,
            source_trace={"source_span": "40 nodes mounted, telemetry ping verified.", "truncated": False},
            safety_critical=False))
        db.add(EvidenceItem(
            pilot_id=pilot.id, milestone_id=milestones[1].id, kpi_id=None,
            evidence_type=EvidenceType.LOG,
            title="Nashik Basalt Acoustic Velocity Calibration D10",
            file_path=_write_evidence_file(pilot.id, "Nashik_Basalt_Acoustic_Velocity_Calibration_D10.dat"),
            uploaded_by=users["founder@acoustileak.in"].id,
            status=ValidationStatus.AI_EXTRACTED,
            extracted_data={"baseline": "32% NRW", "actual": "18.5", "numbers": ["4120.8", "43.68"]},
            ai_confidence=0.94,
            source_trace={"source_span": "Sensor pair AC-N1/N2 recorded transit in 43.68ms.", "truncated": False},
            safety_critical=False))

        db.commit()
        print(f"Seed: done. Demo login password for all users: {DEMO_PASSWORD}")
        print("  Startup:      founder@acoustileak.in")
        print("  Dept Owner:   ce.nashik@nmc.gov.in")
        print("  Evaluator:    hyd.coep@coep.ac.in")
        print("  Finance:      ca.pmc@pmc.gov.in")
        print("  Pilot Mgr:    pm.nmc@nmc.gov.in")
        print("  Admin:        admin@procsync.gov.in")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
