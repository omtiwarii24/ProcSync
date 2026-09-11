export interface PilotEvidencePassport {
  pilotId: string;
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
  observedResults: {
    kpi: string;
    baseline: string;
    achieved: string;
    delta: string;
    verified: boolean;
  }[];
  costEconomics: {
    totalPilotCost: string;
    unitCost: string;
    traditionalBenchmark: string;
    savingsPct: string;
  };
  evaluator: {
    name: string;
    designation: string;
    institution: string;
    digitalSignatureHash: string;
    verifiedDate: string;
  };
  scaleReadinessScore: number;
  verdict: "SCALE" | "ADAPT" | "REVALIDATE" | "STOP";
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
  };
}

export interface ReplicationAnalysisData {
  sourcePilotId: string;
  targetDepartment: string;
  targetLocation: string;
  targetProblem: string;
  overallTransferability: number;
  radarScores: {
    problemSimilarity: number;
    techCompatibility: number;
    infrastructureFit: number;
    dataGisFit: number;
    terrainSoilFit: number;
  };
  reusableAsIs: {
    title: string;
    description: string;
    provenMetric: string;
  }[];
  mustRevalidateLocally: {
    title: string;
    reason: string;
    testingProtocol: string;
  }[];
  failureAlert?: {
    pilotId: string;
    department: string;
    technology: string;
    cause: string;
    directive: string;
  };
  prescriptiveRecommendation: {
    action: string;
    duration: string;
    budget: string;
    daysSaved: number;
    fundsPreserved: string;
  };
}

// 1. SOURCE EVIDENCE: Pune PMC Water Pilot (Verified & Scaled)
export const puneWaterPilot: PilotEvidencePassport = {
  pilotId: "PMC-WTR-2025-01",
  department: "Pune Municipal Corporation (PMC)",
  division: "Water Supply & Distribution Department",
  location: "Kothrud Zone & Old Pune Pumping Grid (120 km cast-iron pipelines)",
  sector: "Smart Water & Urban Infrastructure",
  startupName: "AcoustiLeak Sensors Pvt Ltd",
  dpiitId: "DPIIT-MH-2023-88412",
  udyamId: "UDYAM-MH-12-0049211",
  problemStatement: "Old underground cast-iron drinking water pipelines in Kothrud experiencing unmapped sub-surface leaks, causing severe distribution loss and contamination risk.",
  baselineMetric: "35.2% Non-Revenue Water (NRW) loss across 120km network. Manual acoustic ground microphone inspection required 48+ hours per localized leak.",
  targetOutcome: "Pinpoint sub-surface pipe leaks within 2.0 meters accuracy in under 6 hours, reducing total NRW water loss to below 20%.",
  observedResults: [
    {
      kpi: "Sub-surface Leak Detection Accuracy",
      baseline: "Manual guesswork (~8m error)",
      achieved: "91.4% Acoustic Accuracy (Mean error: 1.14m)",
      delta: "+78% precision",
      verified: true
    },
    {
      kpi: "Non-Revenue Water (NRW) Loss",
      baseline: "35.2% of pumped supply",
      achieved: "18.2% post-remediation",
      delta: "-48.3% relative loss reduction",
      verified: true
    },
    {
      kpi: "Mean Time to Localize Leak",
      baseline: "48.0 Hours (Manual excavation)",
      achieved: "3.8 Hours (Telemetry Correlators)",
      delta: "92% faster pinpointing",
      verified: true
    },
    {
      kpi: "Monthly Potable Water Saved",
      baseline: "0 Liters saved",
      achieved: "50.4 Lakh Liters / month saved",
      delta: "50.4L L/mo recovered",
      verified: true
    }
  ],
  costEconomics: {
    totalPilotCost: "₹14,00,000",
    unitCost: "₹28,000 / km surveyed",
    traditionalBenchmark: "₹1,45,000 / km (manual trench excavation)",
    savingsPct: "80.7% cheaper than legacy methods"
  },
  evaluator: {
    name: "Dr. Vidya Joshi",
    designation: "Professor & Head of Hydraulic Engineering",
    institution: "COEP Technological University, Pune",
    digitalSignatureHash: "SHA256:7F4B0E891C3E2D879B5A104E9C230491DE",
    verifiedDate: "2025-04-18"
  },
  scaleReadinessScore: 86,
  verdict: "SCALE",
  scoreBreakdown: {
    impact: 32, // out of 35
    costEffectiveness: 18, // out of 20
    techMaturity: 13, // out of 15
    operationalReadiness: 8, // out of 10
    securityCompliance: 9, // out of 10
    userAdoption: 4, // out of 5
    scalability: 4 // out of 5
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
    ]
  }
};

// 2. REPLICATION WORKBENCH ANALYSIS: Nashik NMC Query
export const nashikReplicationAnalysis: ReplicationAnalysisData = {
  sourcePilotId: "PMC-WTR-2025-01",
  targetDepartment: "Nashik Municipal Corporation (NMC)",
  targetLocation: "Panchavati & CIDCO Ward Distribution Grid",
  targetProblem: "Sub-surface drinking water leakage in elevated reservoir distribution pipelines.",
  overallTransferability: 82,
  radarScores: {
    problemSimilarity: 95,
    techCompatibility: 90,
    infrastructureFit: 78,
    dataGisFit: 85,
    terrainSoilFit: 62
  },
  reusableAsIs: [
    {
      title: "Edge-AI Acoustic Noise Filter Model",
      description: "Already calibrated on cast-iron pipe joint frequencies from Pune PMC trial. Eliminates urban traffic and ambient noise.",
      provenMetric: "91.4% Proven Accuracy (COEP Verified)"
    },
    {
      title: "Cybersecurity & Cloud Data Custody Docket",
      description: "Meets Maharashtra State IT Security Policy. No raw municipal telemetry leaves India-region VPC.",
      provenMetric: "CERT-In Standard Approved"
    },
    {
      title: "Unit Rate & Economic Feasibility Benchmark",
      description: "Approved procurement unit ceiling rate established at ₹28,000/km (vs. ₹1.45L traditional).",
      provenMetric: "₹28,000 / km Reference Price"
    },
    {
      title: "GIS Layer Integration Pipeline",
      description: "Standard GeoJSON pipeline mapped to Maharashtra Urban Development GIS layers.",
      provenMetric: "Ready-to-Deploy API"
    }
  ],
  mustRevalidateLocally: [
    {
      title: "Deccan Basalt Acoustic Propagation Velocity",
      reason: "Nashik's terrain has hard basalt rock strata. Seismic wave velocity is ~30% faster than Pune's black cotton soil, requiring sensor spacing calibration.",
      testingProtocol: "15 km calibration cross-check in Panchavati Zone"
    },
    {
      title: "Hydrostatic High-Pressure Burst Tolerance",
      reason: "Nashik's elevated reservoir generates 5.2 Bar gravity pressure (vs. Pune's 3.5 Bar), testing sensor clamp gaskets under pressure surges.",
      testingProtocol: "48-hour pressure surge continuous logging"
    }
  ],
  failureAlert: {
    pilotId: "GAD-DRN-2024-03",
    department: "Tribal Development & Rural Water Division, Gadchiroli",
    technology: "Continuous Cloud Video Streaming Drone Inspection",
    cause: "Trial stalled & failed because system mandated continuous 4G live streaming. Dense tree canopy and 0-bar GSM coverage caused connection dropouts and ground telemetry loss.",
    directive: "MANDATE EDGE-STORAGE / OFFLINE BUFFERING: Do not commission cloud-dependent IoT/telemetry pilots in rural or hilly Maharashtra blocks without store-and-forward edge buffers."
  },
  prescriptiveRecommendation: {
    action: "ADAPTED 25-DAY FAST-TRACK PILOT",
    duration: "25 Days (Testing 15km Basalt Zone Only)",
    budget: "₹4,00,000 (Saves ₹10,00,000 vs. Full ₹14L Pilot)",
    daysSaved: 65,
    fundsPreserved: "₹10,00,000"
  }
};

// 3. STATEWIDE COMMAND TOWER ANALYTICS
export const statewideMetrics = {
  activePilots: 48,
  crossDepartmentReplications: 19,
  duplicateTrialsAvoided: 23,
  fundsSavedCrores: 3.22,
  daysSavedStatewide: 1420,
  districtCoverage: 28, // out of 36 districts in Maharashtra
  districts: [
    { name: "Pune", pilots: 12, replications: 6, status: "Active Lead Hub" },
    { name: "Nashik", pilots: 8, replications: 4, status: "Replication Active" },
    { name: "Thane", pilots: 7, replications: 3, status: "Pipeline Active" },
    { name: "Nagpur", pilots: 6, replications: 2, status: "In Evaluation" },
    { name: "Chhatrapati Sambhajinagar", pilots: 5, replications: 2, status: "Piloting" },
    { name: "Gadchiroli", pilots: 3, replications: 1, status: "Failure Warning Flagged" },
    { name: "Palghar", pilots: 4, replications: 1, status: "Adapted Pilot" },
    { name: "Solapur", pilots: 3, replications: 0, status: "Challenge Draft" }
  ],
  failurePatterns: [
    {
      category: "Cellular 4G/5G Dependency in Remote Blocks",
      occurrences: 4,
      impact: "Telemetry dropouts in Vidarbha & Konkan ghats",
      statewideDirective: "Mandate edge storage buffers for all Tier-3 rural pilots"
    },
    {
      category: "Non-standard Municipal Legacy Data Formats",
      occurrences: 3,
      impact: "Ingestion delay with old AutoCAD/PDF municipal maps",
      statewideDirective: "Standardize on MahaGIS GeoJSON templates upfront"
    },
    {
      category: "Power Surges at Pumping Stations",
      occurrences: 2,
      impact: "Hardware sensor reboot during unconditioned transformer spikes",
      statewideDirective: "Require surge-isolated battery clamps"
    }
  ]
};

// 4. EVALUATOR QUEUE MOCK ITEMS
export const evaluatorQueueItems = [
  {
    id: "EV-CLAIM-01",
    pilotId: "PMC-WTR-2025-01",
    kpi: "Sub-surface Leak Detection Accuracy",
    claimedValue: "28 leaks detected with 91.4% acoustic accuracy within 1.2m excavation zone",
    sourceDocument: "Field_Excavation_Verification_Log_Kothrud_W12.pdf",
    sourceExcerpt: "...acoustic correlator #AC-04 flagged peak at Chainage 14+230. Excavation on 2025-03-12 unearthed ruptured ductile iron sleeve at 1.14 meters from sensor coordinate...",
    extractionConfidence: 94,
    status: "VERIFIED",
    verifiedBy: "Dr. Vidya Joshi (COEP)",
    verifiedAt: "2025-04-12 14:30"
  },
  {
    id: "EV-CLAIM-02",
    pilotId: "PMC-WTR-2025-01",
    kpi: "Non-Revenue Water Loss Reduction",
    claimedValue: "18.2% achieved post-remediation (vs 35.2% baseline)",
    sourceDocument: "PMC_SCADA_Flowmeter_Telemetry_Monthly_Audit.csv",
    sourceExcerpt: "...total monthly pumped inflow: 1,420,000 m3; metered consumption: 1,161,560 m3; unmetered/loss: 258,440 m3 (18.20%)...",
    extractionConfidence: 98,
    status: "VERIFIED",
    verifiedBy: "Dr. Vidya Joshi (COEP)",
    verifiedAt: "2025-04-14 11:15"
  },
  {
    id: "EV-CLAIM-03",
    pilotId: "NMC-WTR-2025-ADAPTED",
    kpi: "Basalt Strata Sound Propagation Velocity",
    claimedValue: "Basalt acoustic velocity calibrated at 4,120 m/s with 0.8% variance",
    sourceDocument: "Nashik_Basalt_Seismic_Calibration_Report_D10.pdf",
    sourceExcerpt: "...sensor pair AC-N1/N2 spaced at 180m on Panchavati trunk line recorded impulse acoustic wave transit in 43.68ms (calibrated velocity: 4,120.8 m/s)...",
    extractionConfidence: 91,
    status: "PENDING_VERIFICATION",
    verifiedBy: null,
    verifiedAt: null
  }
];
