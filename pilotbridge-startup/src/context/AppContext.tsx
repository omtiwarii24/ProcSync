"use client";

import React, { createContext, useContext, useState } from "react";
import {
  currentStartupProfile,
  municipalOpportunities,
  MunicipalOpportunity,
  puneWaterPassport,
  ProcurementReadinessPassport,
  standardPilotTemplates,
  clarificationThreads
} from "@/data/mockData";

export interface EvidenceSubmission {
  id: string;
  pilotId: string;
  milestoneId: string;
  fileName: string;
  fileSize: string;
  fileType: "acoustic" | "gps" | "scada" | "calibration" | "fft_spectrogram";
  sha256Hash: string;
  submittedAt: string;
  status: "UNDER_REVIEW" | "AUDITED" | "FLAGGED";
  evaluatorInstitution: string;
  evaluatorNotes?: string;
  confidenceScore?: number;
  extractedBaseline?: string;
  extractedOutcome?: string;
}

export interface AppliedChallenge {
  opportunityId: string;
  appliedAt: string;
  status: "FAST_TRACK_APPROVED" | "IN_REVIEW" | "GATE1_PASSED" | "SELECTED_FOR_SANDBOX";
  matchedPassportId: string;
  allocatedEscrow: string;
  gate1Score: number;
  gate2Status: string;
  consensusRank: number;
  proposalSummary?: string;
}

export interface ClarificationItem {
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

export interface MilestoneItem {
  id: "M1" | "M2" | "M3";
  name: string;
  percentage: string;
  amount: string;
  status: "DISBURSED" | "IN_EVALUATION" | "INVOICED" | "LOCKED";
  txHash: string;
  disbursedDate: string;
  description: string;
  technicalCondition: string;
  auditNote: string;
}

interface AppContextType {
  startupProfile: typeof currentStartupProfile;
  opportunities: MunicipalOpportunity[];
  appliedChallenges: AppliedChallenge[];
  evidenceSubmissions: EvidenceSubmission[];
  passports: ProcurementReadinessPassport[];
  templates: typeof standardPilotTemplates;
  clarifications: ClarificationItem[];
  milestones: Record<"M1" | "M2" | "M3", MilestoneItem>;
  applyToOpportunity: (oppId: string, proposalSummary?: string) => void;
  uploadEvidence: (data: Omit<EvidenceSubmission, "id" | "submittedAt" | "status" | "evaluatorInstitution">) => void;
  sendClarificationResponse: (queryId: string, responseText: string) => void;
  submitMilestoneInvoice: (milestoneId: "M1" | "M2" | "M3") => void;
  acceptTermsTemplate: (code: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [startupProfile] = useState(currentStartupProfile);
  const [opportunities] = useState<MunicipalOpportunity[]>(municipalOpportunities);
  const [templates, setTemplates] = useState(standardPilotTemplates);
  const [clarifications, setClarifications] = useState<ClarificationItem[]>(clarificationThreads);

  const [appliedChallenges, setAppliedChallenges] = useState<AppliedChallenge[]>([
    {
      opportunityId: "OPP-NMC-2025-01",
      appliedAt: "2025-04-22",
      status: "SELECTED_FOR_SANDBOX",
      matchedPassportId: "MH-EP-2025-WTR-0042",
      allocatedEscrow: "₹4,00,000",
      gate1Score: 95,
      gate2Status: "PASSED (Safe Harbor Escrow)",
      consensusRank: 1,
      proposalSummary: "Acoustic transit wave velocity modeling on Deccan basalt distribution grid. Targeted 25-day sandbox with 40 clamp nodes to reduce NRW loss from 32% to < 20%."
    }
  ]);

  const [milestones, setMilestones] = useState<Record<"M1" | "M2" | "M3", MilestoneItem>>({
    M1: {
      id: "M1",
      name: "Milestone 1 • Hardware Clamp Deployment & Baseline Ping",
      percentage: "30% Escrow",
      amount: "₹1,20,000",
      status: "DISBURSED",
      txHash: "0x81b4e2f901cd4a889b7100e4129a3",
      disbursedDate: "2025-04-29",
      description: "Installation of 40 acoustic pipe clamp sensors across 15km primary distribution trunk in Panchavati ward.",
      technicalCondition: "40 sensor nodes mounted with baseline SCADA telemetry ping verified by NMC water works control room.",
      auditNote: "COEP team verified mounting photo logs and network telemetry ping. Milestone 1 released from SBI Escrow."
    },
    M2: {
      id: "M2",
      name: "Milestone 2 • Basalt Strata Acoustic Waveform Calibration",
      percentage: "40% Escrow",
      amount: "₹1,60,000",
      status: "IN_EVALUATION",
      txHash: "Pending COEP Sign-Off",
      disbursedDate: "Awaiting Audit (Est. 2 Days)",
      description: "Acoustic transit velocity calibration in Deccan basalt rock formation to pinpoint sub-surface leaks within 2 meters.",
      technicalCondition: "Telemetry file with >=90% correlation wave peaks matching ground excavation coordinates within 2.0m margin.",
      auditNote: "Assigned to Dr. Vidya Joshi (COEP). 18.6MB telemetry file Nashik_Basalt_Acoustic_Velocity_Calibration_D10.dat currently under evaluation."
    },
    M3: {
      id: "M3",
      name: "Milestone 3 • Final Verification & Passport Finalization",
      percentage: "30% Escrow",
      amount: "₹1,20,000",
      status: "LOCKED",
      txHash: "Awaiting Milestone 2",
      disbursedDate: "Scheduled on Closeout",
      description: "Issuance of official GFR Rule 149 Procurement Readiness Passport signed by MSInS and statewide direct procurement credential.",
      technicalCondition: "All 7 evaluation dimensions scored >=75/100 by independent academic board.",
      auditNote: "Milestone unlocks automatically upon publication of official Maharashtra Gazette passport."
    }
  });

  const [evidenceSubmissions, setEvidenceSubmissions] = useState<EvidenceSubmission[]>([
    {
      id: "SUB-001",
      pilotId: "NMC-WTR-2025-ADAPTED",
      milestoneId: "M1",
      fileName: "Hardware_Clamp_Mounting_Survey_Panchavati.pdf",
      fileSize: "4.2 MB",
      fileType: "calibration",
      sha256Hash: "7f4b0e891c3e2d879b5a104e9c230491de8821a3b5c",
      submittedAt: "2025-04-28 10:14",
      status: "AUDITED",
      evaluatorInstitution: "COEP Technological University",
      evaluatorNotes: "Hardware installation checklist verified across 40 nodes. Milestone 1 released (₹1.2L).",
      confidenceScore: 99.2,
      extractedBaseline: "40 Nodes Installed across 15km",
      extractedOutcome: "SCADA Ping Confirmed (100% telemetry alive)"
    },
    {
      id: "SUB-002",
      pilotId: "NMC-WTR-2025-ADAPTED",
      milestoneId: "M2",
      fileName: "Nashik_Basalt_Acoustic_Velocity_Calibration_D10.dat",
      fileSize: "18.6 MB",
      fileType: "acoustic",
      sha256Hash: "4120f8c199e4b7c2109841f3d8a1c9e776210452b41",
      submittedAt: "2025-05-02 16:45",
      status: "UNDER_REVIEW",
      evaluatorInstitution: "COEP Technological University",
      evaluatorNotes: "Assigned to Dr. Vidya Joshi. Correlation waveform evaluation in progress.",
      confidenceScore: 97.8,
      extractedBaseline: "32% NRW Baseline Loss",
      extractedOutcome: "Projected 18.5% NRW (Pinhole Leak Pinpointed in < 4.2h)"
    },
    {
      id: "SUB-003",
      pilotId: "NMC-WTR-2025-ADAPTED",
      milestoneId: "M2",
      fileName: "CIDCO_Panchavati_Excavation_GroundTruth_Photos.pdf",
      fileSize: "9.1 MB",
      fileType: "gps",
      sha256Hash: "88412ac9104ef92b1150c48201de392a819b772c103",
      submittedAt: "2025-05-04 11:20",
      status: "UNDER_REVIEW",
      evaluatorInstitution: "COEP Technological University",
      evaluatorNotes: "Ground-truth excavation pit images with calibrated GPS coordinates.",
      confidenceScore: 98.4,
      extractedBaseline: "Excavation Target: 2.0m radius",
      extractedOutcome: "Ground Truth Leak Found at 1.18m offset"
    }
  ]);

  const [passports] = useState<ProcurementReadinessPassport[]>([puneWaterPassport]);

  const applyToOpportunity = (oppId: string, proposalSummary?: string) => {
    if (appliedChallenges.some((a) => a.opportunityId === oppId)) return;
    const opp = opportunities.find((o) => o.id === oppId);
    setAppliedChallenges((prev) => [
      ...prev,
      {
        opportunityId: oppId,
        appliedAt: new Date().toISOString().split("T")[0],
        status: opp?.fastTrackEligible ? "FAST_TRACK_APPROVED" : "IN_REVIEW",
        matchedPassportId: opp?.fastTrackEligible ? "MH-EP-2025-WTR-0042" : "N/A",
        allocatedEscrow: opp?.budgetCap || "₹5,00,000",
        gate1Score: opp?.fastTrackEligible ? 95 : 82,
        gate2Status: "PASSED (Safe Harbor Escrow)",
        consensusRank: opp?.fastTrackEligible ? 1 : 2,
        proposalSummary: proposalSummary || "Structured outcome-based proposal submitted under MSInS Sandbox guidelines."
      }
    ]);
  };

  const uploadEvidence = (
    data: Omit<EvidenceSubmission, "id" | "submittedAt" | "status" | "evaluatorInstitution">
  ) => {
    const newSubmission: EvidenceSubmission = {
      id: `SUB-00${evidenceSubmissions.length + 1}`,
      ...data,
      submittedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "UNDER_REVIEW",
      evaluatorInstitution: "COEP Technological University",
      evaluatorNotes: "Cryptographic SHA-256 seal confirmed. In queue for academic audit.",
      confidenceScore: 98.0,
      extractedBaseline: "Field trial data packet",
      extractedOutcome: "Structured results extracted via AI and queued for Evaluator sign-off"
    };
    setEvidenceSubmissions((prev) => [newSubmission, ...prev]);
  };

  const sendClarificationResponse = (queryId: string, responseText: string) => {
    setClarifications((prev) =>
      prev.map((c) =>
        c.id === queryId
          ? { ...c, response: responseText, respondedAt: new Date().toISOString().replace("T", " ").substring(0, 16), status: "RESOLVED" }
          : c
      )
    );
  };

  const submitMilestoneInvoice = (milestoneId: "M1" | "M2" | "M3") => {
    setMilestones((prev) => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        status: "INVOICED",
        auditNote: "Invoice submitted to Finance & Urban Development Department. Awaiting payment release."
      }
    }));
  };

  const acceptTermsTemplate = (code: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.code === code ? { ...t, accepted: true, acceptedDate: new Date().toISOString().split("T")[0] } : t))
    );
  };

  return (
    <AppContext.Provider
      value={{
        startupProfile,
        opportunities,
        appliedChallenges,
        evidenceSubmissions,
        passports,
        templates,
        clarifications,
        milestones,
        applyToOpportunity,
        uploadEvidence,
        sendClarificationResponse,
        submitMilestoneInvoice,
        acceptTermsTemplate
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

