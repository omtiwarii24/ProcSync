// ============================================================================
// GovInnovate SIH26136 — Startup & Innovation Access Portal (Portal A)
// Canonical Mock Data & Types adhering strictly to GovInnovate_SIH26136_Final_Project_Documentation_CORRECTED.md
// ============================================================================

export type DecisionType = "STOP" | "ADAPT" | "REVALIDATE" | "SCALE";
export type ReadinessStatusType = "READY" | "CONDITIONAL" | "NOT READY";
export type ProcurementRouteType =
  | "REQUEST MORE EVIDENCE"
  | "SANDBOX EXTENSION"
  | "TARGETED FOLLOW-UP PILOT"
  | "TRIAL ORDER"
  | "DIRECT PROCUREMENT"
  | "PHASED PROCUREMENT";

export type PaymentStateType = "Pending" | "Invoiced" | "Approved" | "Disbursed";

// §11 Canonical Unified Entity
export interface ProcurementReadinessPassport {
  pilotId: string;
  passportId: string;
  department: string;
  location: string;
  division: string;
  sector: string;
  startupName: string;
  dpiitId: string;
  udyamId: string;
  problemStatement: string;
  baselineMetric: string;
  targetOutcome: string;
  pilotScope: string;
  innovationQualification: {
    gate1Result: string;
    trl: string;
    techScore: number;
    physicsModel: string;
    verifiedBy: string;
  };
  procurementQualification: {
    gate2Result: string;
    riskEquivalentPathway: string;
    financialRunway: string;
    safeguardAssigned: string;
    gfrExemptionApproved: boolean;
  };
  observedResults: {
    kpi: string;
    baseline: string;
    achieved: string;
    delta: string;
    verified: boolean;
    confidenceScore: number;
    auditStatus: string;
  }[];
  costEconomics: {
    totalPilotCost: string;
    unitCost: string;
    traditionalBenchmark: string;
    savingsPct: string;
    taxpayerSaved: string;
  };
  evaluator: {
    name: string;
    designation: string;
    institution: string;
    digitalSignatureHash: string;
    verifiedDate: string;
  };
  readinessStatus: ReadinessStatusType;
  verdict: DecisionType; // §14 Authoritative four-value enum
  procurementRoute?: ProcurementRouteType; // §13 Applies only after SCALE
  scoreBreakdown: {
    impact: number;
    costEffectiveness: number;
    techMaturity: number;
    operationalReadiness: number;
    securityCompliance: number;
    userAdoption: number;
    scalability: number;
  };
  implementationConditions: {
    waterPressure: string;
    soilType: string;
    networkConnectivity: string;
    powerAvailability: string;
  };
  replicationGuidance: {
    reusableAssets: string[];
    revalidateRequired: string[];
    failureConditionsAvoided: string[];
  };
}

// Backward compatibility alias
export type PilotEvidencePassport = ProcurementReadinessPassport;

export interface MunicipalOpportunity {
  id: string;
  challengeCode: string;
  title: string;
  department: string;
  district: string;
  sector: string;
  budgetCap: string;
  duration: string;
  deadline: string;
  fastTrackEligible: boolean;
  matchedSourcePilot?: string;
  timeReduction?: string;
  budgetSaving?: string;
  description: string;
  requiredReadiness: string;
  baselineProblem: string;
  targetKPI: string;
  constraints: {
    soilStrata: string;
    pressure: string;
    network: string;
  };
  statutoryWaiverEnabled: boolean;
}

export const municipalOpportunities: MunicipalOpportunity[] = [
  {
    id: "OPP-NMC-2025-01",
    challengeCode: "CHALLENGE-NMC-WTR-2025",
    title: "Sub-Surface Water Leakage Localization in Hard Basalt Strata",
    department: "Nashik Municipal Corporation (NMC)",
    district: "Nashik",
    sector: "Smart Water & Urban Infrastructure",
    budgetCap: "₹4,00,000 (Adapted Fast-Track Order)",
    duration: "25 Days Fast-Track",
    deadline: "2025-05-15",
    fastTrackEligible: true,
    matchedSourcePilot: "PMC-WTR-2025-01",
    timeReduction: "65 Days Saved (25 vs 90 days)",
    budgetSaving: "₹11,00,000 Preserved",
    description: "Deployment of acoustic vibration telemetry on 15km elevated reservoir distribution network in Panchavati & CIDCO division over hard basalt strata.",
    requiredReadiness: "TRL-7+ with validated acoustic wave transit model",
    baselineProblem: "32% Non-Revenue Water loss with 40+ hours manual acoustic leak detection per rupture.",
    targetKPI: "Reduce NRW to < 20%; pinpoint sub-surface pinhole leaks within 2m in < 6 hours.",
    constraints: {
      soilStrata: "Deccan Basalt & Fractured Hard Rock",
      pressure: "5.2 Bar (High-Head Gravity Tank)",
      network: "4G GSM / LoRaWAN Cellular"
    },
    statutoryWaiverEnabled: true
  },
  {
    id: "OPP-MSAMB-2025-02",
    challengeCode: "CHALLENGE-MSAMB-AGRI-2025",
    title: "Automated Multi-Spectral Grain Quality Assaying Terminal",
    department: "Maharashtra State Agricultural Marketing Board (MSAMB)",
    district: "Nagpur",
    sector: "Agri-Tech & Mandi Modernization",
    budgetCap: "₹8,00,000 (Milestone Escrow)",
    duration: "45 Days Proving Sandbox",
    deadline: "2025-06-01",
    fastTrackEligible: false,
    description: "Automated instant optical moisture, foreign matter, and broken grain percentage grading for arriving soybean farmers at Nagpur Central Mandi.",
    requiredReadiness: "TRL-6+ Multi-spectral optical camera bench",
    baselineProblem: "4.5 hours manual subjective inspection per truck; 15% assay variance across graders.",
    targetKPI: "Automate soybean assay in < 3 minutes with > 95% AGMARK laboratory correlation.",
    constraints: {
      soilStrata: "Covered Concrete Mandi Shed",
      pressure: "Not Applicable",
      network: "On-Premise Wi-Fi & 4G"
    },
    statutoryWaiverEnabled: true
  },
  {
    id: "OPP-TMC-2025-03",
    challengeCode: "CHALLENGE-TMC-ENG-2025",
    title: "Heavy Lift Pumping Station Dynamic VFD Scheduling",
    department: "Thane Municipal Corporation (TMC)",
    district: "Thane",
    sector: "Clean Energy & Municipal Utilities",
    budgetCap: "₹6,50,000",
    duration: "30 Days Sandbox",
    deadline: "2025-05-20",
    fastTrackEligible: true,
    matchedSourcePilot: "PMC-ENG-2024-02",
    timeReduction: "45 Days Saved",
    budgetSaving: "₹8,50,000 Preserved",
    description: "Dynamic VFD scheduling and vibration telemetry on heavy lift raw water pumping stations to eliminate peak-hour power penalties.",
    requiredReadiness: "CE / BIS certified industrial Modbus controller",
    baselineProblem: "Frequent unconditioned power surges causing pump motor thermal tripping and peak tariff fines.",
    targetKPI: "14% electricity tariff reduction; 100% surge survival rate.",
    constraints: {
      soilStrata: "Industrial Pump House Floor",
      pressure: "7.0 Bar Raw Water Line",
      network: "Industrial Modbus / 4G Gateway"
    },
    statutoryWaiverEnabled: true
  },
  {
    id: "OPP-PCMC-2025-04",
    challengeCode: "CHALLENGE-PCMC-IOT-2025",
    title: "SCADA Pressure Wavelet Pipe Burst Early Warning Array",
    department: "Pimpri-Chinchwad Municipal Corporation (PCMC)",
    district: "Pune Suburb",
    sector: "Smart Water & Urban Distribution",
    budgetCap: "₹7,20,000",
    duration: "30 Days Fast-Track",
    deadline: "2025-06-15",
    fastTrackEligible: true,
    matchedSourcePilot: "PMC-WTR-2025-01",
    timeReduction: "60 Days Saved",
    budgetSaving: "₹9,00,000 Preserved",
    description: "High-frequency pressure transducer telemetry to capture transient water hammer shockwaves before physical catastrophic main bursts.",
    requiredReadiness: "TRL-7+ pressure transient edge logger",
    baselineProblem: "Catastrophic main distribution bursts causing road sinkholes and 12-hr water cutoffs.",
    targetKPI: "Detect pressure transient precursors > 90 mins prior to rupture.",
    constraints: {
      soilStrata: "Urban Asphalt & Concrete Trench",
      pressure: "4.0 – 6.0 Bar Distribution Grid",
      network: "City Fiber & 4G"
    },
    statutoryWaiverEnabled: true
  }
];

export const currentStartupProfile = {
  startupName: "AcoustiLeak Sensors Pvt Ltd",
  legalEntity: "AcoustiLeak Sensors Private Limited (CIN: U72900PN2022PTC209182)",
  founders: "Er. Vikram Deshmukh & Priya Ranade",
  almaMater: "Ex-IIT Bombay & COEP Hydraulics Alumni",
  dpiitId: "DIPP99421",
  udyamId: "UDYAM-MH-26-0091823",
  incorporationDate: "2022-03-14",
  headquarters: "Shivajinagar, Pune, Maharashtra 411005",
  sector: "Smart Water & Urban Distribution IoT",
  technologyDomain: "Sub-Surface Acoustic Waveform Spectrogram Array",
  trlLevel: "TRL 7 (Field Operational Prototype Validated)",
  deploymentMethod: "Non-invasive magnetic/band clamp on sluice valves (Zero pipe wall drilling)",
  financialRunwayMonths: 14,
  auditedCashRunway: "14 Months Audited Cash Balance (₹48.6 Lakhs liquid balance)",
  turnoverLastYear: "₹42 Lakhs (Exempted under GFR Rule 149 Safe Harbor)",
  bankAccount: "State Bank of India • Escrow Virtual A/c #9102-4412-8821",
  activeEscrowTotal: "₹4,00,000",
  disbursedToDate: "₹15,20,000 (PMC Pilot ₹14L + Nashik M1 ₹1.2L)",
  bankSolvencyHash: "SHA256:8F02B19C92410E7781C200921A76E",
  msinsAward: "Maharashtra Startup Week 2024 Winner (Water Infrastructure Track)"
};

export const standardPilotTemplates = [
  {
    code: "TMPL-SBX-2024-v2.4",
    title: "Standard Municipal Innovation Sandbox Pilot Agreement",
    category: "Sandbox Agreement",
    description: "Governs sandbox testing boundaries, municipal infrastructure access, liability indemnification, and 3-phase milestone escrow disbursements.",
    mandatory: true,
    accepted: true,
    acceptedDate: "2025-04-20"
  },
  {
    code: "TMPL-IP-2024-v1.8",
    title: "Zero-IP-Leakage Startup Model Custody Clause",
    category: "IP & Algorithms",
    description: "Guarantees 100% startup ownership of machine learning model weights, sensor circuit schematics, and source code. Government receives only execution rights during the sandbox.",
    mandatory: true,
    accepted: true,
    acceptedDate: "2025-04-20"
  },
  {
    code: "TMPL-DAT-2024-v2.0",
    title: "CERT-In Sovereign Cloud & Municipal Data Residency Protocol",
    category: "Data Security",
    description: "Mandates that raw sensor packets and SCADA telemetry must remain encrypted at rest and in transit within sovereign Indian cloud VPCs located in Maharashtra.",
    mandatory: true,
    accepted: true,
    acceptedDate: "2025-04-20"
  },
  {
    code: "TMPL-EVAL-2024-v1.5",
    title: "Independent Academic Evaluator Terms (COEP / VJTI / VNIT)",
    category: "Evaluation Rubric",
    description: "Empanels state technological universities to conduct FFT spectral verification, on-site ground-truth excavation audits, and submit tamper-evident verdicts.",
    mandatory: true,
    accepted: true,
    acceptedDate: "2025-04-20"
  },
  {
    code: "TMPL-GFR-2024-v3.1",
    title: "GFR Rule 149 Safe Harbor Statutory Exemption Affidavit",
    category: "Procurement Safe Harbor",
    description: "Statutory affidavit indemnifying municipal procurement officers against CAG audit objections when waiving prior turnover in lieu of validated risk-equivalent runway.",
    mandatory: true,
    accepted: true,
    acceptedDate: "2025-04-20"
  }
];

export interface ClarificationThread {
  id: string;
  challengeId: string;
  author: string;
  role: string;
  timestamp: string;
  query: string;
  response: string;
  respondedAt: string;
  status: "RESOLVED" | "PENDING";
}

export const clarificationThreads: ClarificationThread[] = [
  {
    id: "CLR-001",
    challengeId: "OPP-NMC-2025-01",
    author: "Dr. Vidya Joshi (COEP Independent Evaluator)",
    role: "Academic Evaluator",
    timestamp: "2025-04-24 14:15",
    query: "Regarding Milestone 2 basalt calibration: Does your acoustic wave transit algorithm require physical ground trenching to verify sensor node spacing, or can GPS geofenced valve coordinates be used?",
    response: "Sensor spacing is calibrated purely through dual-point acoustic time-of-flight pulses injected between adjacent isolation valves without ground trenching. GPS coordinates with RTK precision (+/- 2cm) are cross-referenced with NMC GIS distribution maps.",
    respondedAt: "2025-04-24 16:30",
    status: "RESOLVED"
  },
  {
    id: "CLR-002",
    challengeId: "OPP-NMC-2025-01",
    author: "Er. Sanjay Deshmukh (Chief Engineer, NMC)",
    role: "Problem Owner",
    timestamp: "2025-04-26 11:00",
    query: "Can the sensor array operate during intermittent night-time supply hours when water pressure drops below 1.5 Bar?",
    response: "Yes. Firmware v2.4 contains an automated pressure threshold switch. When dynamic line pressure drops below 1.8 Bar, sensors automatically buffer raw noise waveforms into local flash and perform cross-correlation only during high-head pumping cycles.",
    respondedAt: "2025-04-26 13:45",
    status: "RESOLVED"
  }
];

export const puneWaterPassport: ProcurementReadinessPassport = {
  pilotId: "PMC-WTR-2025-01",
  passportId: "MH-EP-2025-WTR-0042",
  department: "Pune Municipal Corporation (PMC)",
  division: "Water Supply & Distribution Department",
  location: "Kothrud Zone & Old Pune Pumping Grid (120 km cast-iron pipelines)",
  sector: "Smart Water & Urban Infrastructure",
  startupName: "AcoustiLeak Sensors Pvt Ltd",
  dpiitId: "DIPP99421",
  udyamId: "UDYAM-MH-26-0091823",
  problemStatement: "Old underground cast-iron drinking water pipelines in Kothrud experiencing unmapped sub-surface leaks, causing 35.2% Non-Revenue Water loss and severe public supply deficit.",
  baselineMetric: "35.2% NRW loss across 120km distribution network; 48+ hours manual acoustic leak localization per rupture.",
  targetOutcome: "Pinpoint sub-surface pipe leaks within 2.0 meters accuracy in under 6 hours, reducing total NRW water loss to below 20%.",
  pilotScope: "Non-invasive acoustic wave sensor deployment on 120km cast-iron trunk pipelines across 90-day municipal sandbox.",
  innovationQualification: {
    gate1Result: "PASSED (TRL 7)",
    trl: "TRL 7 (Field Operational Prototype)",
    techScore: 95,
    physicsModel: "Acoustic transit-time wave velocity modeling in subterranean geological conduits",
    verifiedBy: "COEP Technological University, Pune"
  },
  procurementQualification: {
    gate2Result: "PASSED (Risk-Equivalent Pathway)",
    riskEquivalentPathway: "GFR Rule 149 Safe Harbor Exemption for Prior Turnover",
    financialRunway: "14 Months Audited Cash Balance (Verified via SBI Virtual Escrow Statement)",
    safeguardAssigned: "3-Stage Milestone Escrow Disbursement with Zero Upfront Advance",
    gfrExemptionApproved: true
  },
  observedResults: [
    {
      kpi: "Sub-surface Leak Detection Accuracy",
      baseline: "Manual guesswork (~8m excavation error)",
      achieved: "91.4% Accuracy (Mean error: 1.14m)",
      delta: "+78% precision improvement",
      verified: true,
      confidenceScore: 98.4,
      auditStatus: "COEP Audited & Ground-Truth Pit Verified"
    },
    {
      kpi: "Non-Revenue Water (NRW) Loss Reduction",
      baseline: "35.2% of pumped potable volume",
      achieved: "18.2% post-remediation",
      delta: "-48.3% relative loss reduction",
      verified: true,
      confidenceScore: 96.2,
      auditStatus: "NMC Hydraulic SCADA Verified"
    },
    {
      kpi: "Mean Time to Localize Sub-surface Leak",
      baseline: "48.0 Hours (Manual excavation)",
      achieved: "3.8 Hours (Telemetry Correlators)",
      delta: "92% faster pinpointing",
      verified: true,
      confidenceScore: 99.0,
      auditStatus: "Automated Timestamp Logged"
    },
    {
      kpi: "Monthly Potable Water Saved",
      baseline: "0 Liters saved",
      achieved: "50.4 Lakh Liters / month saved",
      delta: "50.4 Lakh Liters / mo recovered",
      verified: true,
      confidenceScore: 97.5,
      auditStatus: "Flowmeter Mass Balance Verified"
    }
  ],
  costEconomics: {
    totalPilotCost: "₹14,00,000",
    unitCost: "₹28,000 / km surveyed",
    traditionalBenchmark: "₹1,45,000 / km (manual trench excavation)",
    savingsPct: "80.7% cheaper than legacy methods",
    taxpayerSaved: "₹11,00,000 per replication trial"
  },
  evaluator: {
    name: "Dr. Vidya Joshi",
    designation: "Professor & Head of Hydraulic Engineering",
    institution: "COEP Technological University, Pune",
    digitalSignatureHash: "SHA256:7F4B0E891C3E2D879B5A104E9C230491DE",
    verifiedDate: "2025-04-18"
  },
  readinessStatus: "READY",
  verdict: "SCALE", // §14 Authoritative four-value enum
  procurementRoute: "DIRECT PROCUREMENT", // §13 Applies only after SCALE
  scoreBreakdown: {
    impact: 32,
    costEffectiveness: 18,
    techMaturity: 13,
    operationalReadiness: 8,
    securityCompliance: 9,
    userAdoption: 4,
    scalability: 4
  },
  implementationConditions: {
    waterPressure: "Gravity feed 3.2 – 3.8 Bar",
    soilType: "Mixed Black Cotton & Alluvial Clay",
    networkConnectivity: "2G/4G GSM sufficient for 15-min burst acoustic packets",
    powerAvailability: "Battery life 18 months per clamp sensor"
  },
  replicationGuidance: {
    reusableAssets: [
      "Trained acoustic sound spectrogram ML filter model for cast-iron/ductile-iron pipes",
      "Field test acoustic frequency correlation baseline protocol",
      "ISO/IEC 27001 data isolation & telemetry cloud security audit",
      "Unit cost benchmark: ₹28,000/km"
    ],
    revalidateRequired: [
      "Local acoustic wave velocity in rocky basalt / hard rock strata",
      "High hydrostatic head pressures (>5.0 Bar) in high-elevation water grids"
    ],
    failureConditionsAvoided: [
      "High soil salinity (>12 dS/m) attenuates acoustic frequencies above 8 kHz (mitigated by 2 kHz pulse mode in firmware v2.4)"
    ]
  }
};

// Backward compatibility export
export const puneWaterPilot = puneWaterPassport;

