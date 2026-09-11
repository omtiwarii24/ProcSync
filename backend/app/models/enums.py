from enum import Enum


class UserRole(str, Enum):
    STARTUP = "STARTUP"
    DEPT_OWNER = "DEPT_OWNER"
    PILOT_MANAGER = "PILOT_MANAGER"
    EVALUATOR = "EVALUATOR"
    PROCUREMENT_AUTHORITY = "PROCUREMENT_AUTHORITY"
    FINANCE = "FINANCE"
    ADMIN = "ADMIN"


class Portal(str, Enum):
    A = "A"
    B = "B"


class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGIN_FAILED = "LOGIN_FAILED"
    WAIVE = "WAIVE"
    AUTHORIZE = "AUTHORIZE"
    REJECT = "REJECT"
    VALIDATE = "VALIDATE"
    SELECT = "SELECT"
    COMPUTE = "COMPUTE"
    PUBLISH = "PUBLISH"
    CLOSE = "CLOSE"
    INVOICE = "INVOICE"
    APPROVE = "APPROVE"
    DISBURSE = "DISBURSE"
    FINALIZE = "FINALIZE"
    RESOLVE = "RESOLVE"


class DomainTag(str, Enum):
    WATER = "water"
    AGRI = "agri"
    HEALTH = "health"
    EDUCATION = "education"
    INFRASTRUCTURE = "infrastructure"
    GOVERNANCE = "governance"
    TRANSPORT = "transport"
    ENERGY = "energy"
    OTHER = "other"


class ConnectivityTier(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"


class PowerReliability(str, Enum):
    STABLE = "STABLE"
    INTERMITTENT = "INTERMITTENT"
    UNRELIABLE = "UNRELIABLE"


class ITMaturity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class SettlementType(str, Enum):
    URBAN = "URBAN"
    SEMI_URBAN = "SEMI_URBAN"
    RURAL = "RURAL"
    TRIBAL = "TRIBAL"


class TerrainType(str, Enum):
    PLAIN = "PLAIN"
    HILLY = "HILLY"
    COASTAL = "COASTAL"
    DESERT = "DESERT"
    MIXED = "MIXED"


class EvidenceType(str, Enum):
    KPI_MEASUREMENT = "KPI_MEASUREMENT"
    COST_RECORD = "COST_RECORD"
    PHOTO = "PHOTO"
    LOG = "LOG"
    REPORT = "REPORT"


class ValidationStatus(str, Enum):
    UNVERIFIED = "UNVERIFIED"
    AI_EXTRACTED = "AI_EXTRACTED"
    EVALUATOR_VERIFIED = "EVALUATOR_VERIFIED"
    REJECTED = "REJECTED"


class DecisionLabel(str, Enum):
    STOP = "STOP"
    ADAPT = "ADAPT"
    REVALIDATE = "REVALIDATE"
    SCALE = "SCALE"


class ConstraintType(str, Enum):
    CONNECTIVITY = "CONNECTIVITY"
    POWER = "POWER"
    STAFFING = "STAFFING"
    DATA_ACCESS = "DATA_ACCESS"
    OTHER = "OTHER"


class ChallengeStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CLOSED = "CLOSED"


class CriterionType(str, Enum):
    TURNOVER = "TURNOVER"
    EXPERIENCE = "EXPERIENCE"
    DPIIT = "DPIIT"
    CUSTOM = "CUSTOM"


class CriterionOperator(str, Enum):
    GTE = "GTE"
    LTE = "LTE"
    EQ = "EQ"


class ProposalStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    ELIGIBLE = "ELIGIBLE"
    UNDER_EVALUATION = "UNDER_EVALUATION"
    SELECTED = "SELECTED"
    REJECTED = "REJECTED"


class CheckResult(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    PENDING_MANUAL = "PENDING_MANUAL"
    WAIVED = "WAIVED"


class InvitationStatus(str, Enum):
    SENT = "SENT"
    REGISTERED = "REGISTERED"
    EXPIRED = "EXPIRED"


class DiscoverySource(str, Enum):
    GEMINI_SEARCH = "gemini_search"
    SEED_INDEX = "seed_index"


class GateType(str, Enum):
    GATE1 = "GATE1"
    GATE2 = "GATE2"


class RiskEquivalentDecision(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class PilotStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    TERMINATED = "TERMINATED"


class MilestoneStatus(str, Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    VERIFIED = "VERIFIED"
    PAID = "PAID"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    INVOICED = "INVOICED"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"
    REJECTED = "REJECTED"
