from enum import Enum


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


class ConnectivityRequirement(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ConnectivityTier(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"


class PowerDependency(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    HIGH = "HIGH"


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


class UnitEconomicsBand(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Sensitivity(str, Enum):
    PUBLIC = "PUBLIC"
    RESTRICTED = "RESTRICTED"
    CONFIDENTIAL = "CONFIDENTIAL"


class SkillLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


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
