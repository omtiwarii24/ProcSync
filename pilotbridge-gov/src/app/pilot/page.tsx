"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { puneWaterPilot } from "@/data/mockData";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UploadCloud,
  Layers,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Check,
  FileCheck,
  Sparkles,
  Building2,
  ChevronDown,
  DollarSign,
  CreditCard,
  Scale,
  Sliders,
  Send,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  FileSpreadsheet,
  Hash,
  UserCheck,
  Compass,
  CheckCheck
} from "lucide-react";

function PilotsAndDecisionContent() {
  const searchParams = useSearchParams();
  const { currentRole, evaluatorClaims, verifyClaim, rejectClaim } = useApp();

  // 5 Canonical Sub-Tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2 (Tab 4)
  type SubTabId = "builder" | "dashboard" | "validation" | "payment" | "decision";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("dashboard");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["builder", "dashboard", "validation", "payment", "decision"].includes(tabParam)
      ? tabParam
      : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["builder", "dashboard", "validation", "payment", "decision"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  // Pilot Switcher: Nashik NMC Adapted 25-Day vs Pune PMC Source 90-Day
  const [activePilotId, setActivePilotId] = useState<"NMC-WTR-2025-ADAPTED" | "PMC-WTR-2025-01">(
    "NMC-WTR-2025-ADAPTED"
  );
  const isAdapted = activePilotId === "NMC-WTR-2025-ADAPTED";

  // Evidence sub-view
  const [selectedEvidenceView, setSelectedEvidenceView] = useState<"acoustic" | "gps" | "scada">(
    "acoustic"
  );

  // Evaluator state
  const [evaluatorSigned, setEvaluatorSigned] = useState(true);

  // Payment state machine for Milestone 2: PENDING -> INVOICED -> APPROVED -> DISBURSED
  const [m2PaymentState, setM2PaymentState] = useState<"INVOICED" | "APPROVED" | "DISBURSED">(
    "INVOICED"
  );
  const [disbursementTx, setDisbursementTx] = useState<string | null>(null);

  // Decision state (Canonical 4-value enum: STOP / ADAPT / REVALIDATE / SCALE)
  const [selectedDecision, setSelectedDecision] = useState<"STOP" | "ADAPT" | "REVALIDATE" | "SCALE">(
    "SCALE"
  );
  const [selectedProcurementRoute, setSelectedProcurementRoute] = useState<string>("DIRECT_PROCUREMENT");
  const [decisionAuthorized, setDecisionAuthorized] = useState(false);
  const [authorizationMemo, setAuthorizationMemo] = useState(
    "Authorized for deployment across Nashik Old City water distribution grid. Acoustic accuracy in basalt rock verified by COEP Technological University at 91.4% with mean excavation error 1.14m."
  );

  // Simulated upload state
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const subTabs = [
    {
      id: "builder",
      label: "Pilot Builder & Milestones",
      shortLabel: "Pilot Builder",
      badge: isAdapted ? "25-Day Adapted" : "90-Day Full",
      desc: "Scope, milestones, KPIs, data/IP terms, and risk register",
    },
    {
      id: "dashboard",
      label: "Execution Dashboard",
      shortLabel: "Execution Dashboard",
      badge: isAdapted ? "Day 18 of 25" : "Completed",
      desc: "Live tracking, milestone health, field telemetry packets, and deliverables",
    },
    {
      id: "validation",
      label: "Evidence Engine & Validation Lab",
      shortLabel: "Evidence & Validation",
      badge: "COEP Verified",
      desc: "Spectrogram waveform, GPS excavation ground-truth, AI triage & academic sign-off",
    },
    {
      id: "payment",
      label: "Milestone Payment Approval",
      shortLabel: "Payment Approval",
      badge: m2PaymentState === "DISBURSED" ? "₹2.8L Disbursed" : "₹1.6L Invoiced",
      desc: "Pending → Invoiced → Approved → Disbursed linked to verified evidence",
    },
    {
      id: "decision",
      label: "Decision & Procurement Route",
      shortLabel: "Decision & Route",
      badge: decisionAuthorized ? "SCALE Authorized" : "Deterministic SCALE",
      desc: "Deterministic STOP / ADAPT / REVALIDATE / SCALE; selects Procurement Route if SCALE",
    },
  ];

  const handleSimulateUpload = () => {
    setUploadStatus("Ingesting raw hydrophone telemetry (.dat) and generating SHA-256 digest...");
    setTimeout(() => {
      setUploadStatus(
        "Verified & Stamped: SHA-256: 4d8a1c9e3b72f108a9c402... Attached to Milestone 2 docket."
      );
    }, 850);
  };

  const handleAuthorizeDisbursement = () => {
    setM2PaymentState("APPROVED");
    setTimeout(() => {
      setM2PaymentState("DISBURSED");
      setDisbursementTx("SBIN00492810882-NMC");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* 1. SLIM BREADCRUMB (Per v4 interaction pattern) */}
      <div className="flex items-center justify-between text-xs border-b border-[#EBDDDA] pb-3 font-mono">
        <div className="flex items-center gap-2 text-[#556B67]">
          <Link href="/" className="hover:text-[#1E2D2A] font-semibold transition-colors">
            ProcSync
          </Link>
          <span>/</span>
          <span className="text-[#3D5855] font-bold">Pilots & Decision</span>
          <span>/</span>
          <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
            {subTabs.find((t) => t.id === activeSubTab)?.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#556B67] hidden sm:inline">Active Context:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold">
            {isAdapted ? "Nashik NMC Sandbox" : "Pune PMC Source"}
          </span>
        </div>
      </div>

      {/* 2. HERO & ACTIVE PILOT CONTROLS */}
      <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] text-xs font-mono font-bold uppercase tracking-wider border border-[#D2B48C]/40">
                DPI MODULE 4 • PILOT SANDBOX & DECISION ENGINE
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#1E2D2A] tracking-tight flex flex-wrap items-center gap-3">
              <span>{isAdapted ? "Nashik 25-Day Adapted Pilot" : "Pune 90-Day Source Pilot"}</span>
              <span className="text-xs font-bold px-3 py-1 bg-[#BFCACC]/25 text-[#2F4541] rounded-full border border-[#BFCACC]/40 font-mono">
                {isAdapted ? "Active Sandbox • Day 18 of 25" : "Verified Source Pilot • Closed"}
              </span>
            </h1>

            <p className="text-[#3D5855] text-sm sm:text-base font-medium mt-1 max-w-3xl leading-relaxed">
              Objective milestone tracking with verifiable acoustic telemetry triggers, automated escrow release, and a deterministic four-value post-pilot decision engine.
            </p>
          </div>

          {/* Pilot Switcher & Escrow Overview Pill */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#FAF8F6] p-1 rounded-xl border border-[#EBDDDA]">
              <button
                onClick={() => setActivePilotId("NMC-WTR-2025-ADAPTED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isAdapted
                    ? "bg-[#2F4541] text-white shadow-2xs"
                    : "text-[#3D5855] hover:text-[#1E2D2A] hover:bg-white"
                }`}
              >
                Nashik NMC (25-Day Adapted)
              </button>
              <button
                onClick={() => setActivePilotId("PMC-WTR-2025-01")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isAdapted
                    ? "bg-[#2F4541] text-white shadow-2xs"
                    : "text-[#3D5855] hover:text-[#1E2D2A] hover:bg-white"
                }`}
              >
                Pune PMC (90-Day Source)
              </button>
            </div>

            <div className="px-3 py-1.5 bg-[#1E2D2A] text-white rounded-xl flex items-center gap-2 text-xs font-mono border border-[#2F4541]">
              <span className="text-[#BFCACC]">STATE ESCROW:</span>
              <span className="text-[#D2B48C] font-black">
                {isAdapted ? "₹4,00,000 LOCKED" : "₹14,00,000 SETTLED"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. HORIZONTAL SUB-TAB SWITCHER (v4 Full-width pattern) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-[#EBDDDA] pt-5 scrollbar-thin">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/pilot?tab=${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as SubTabId)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? "bg-[#2F4541] text-white border-[#2F4541] shadow-2xs"
                    : "bg-[#FAF8F6] text-[#3D5855] border-[#EBDDDA] hover:bg-white hover:text-[#1E2D2A]"
                }`}
              >
                <span>{tab.shortLabel}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? "bg-white/20 text-white font-bold"
                      : "bg-white text-[#2F4541] border border-[#EBDDDA]"
                  }`}
                >
                  {tab.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PILOT BUILDER & MILESTONES (§7.5, §18 Step 10, §19.8)        */}
      {/* ========================================================================= */}
      {activeSubTab === "builder" && (
        <div className="space-y-6">
          {/* Targeted Pilot Origin Notice */}
          <div className="p-5 bg-gradient-to-r from-[#FAF8F6] to-[#EBDDDA]/50 border border-[#EBDDDA] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#2F4541] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#856441] uppercase tracking-wider block">
                  TARGETED FOLLOW-UP PILOT
                </span>
                <p className="text-sm font-semibold text-[#2F4541] mt-0.5">
                  Generated via Replication Workbench from Pune PMC Baseline. Only basalt acoustic propagation and high-pressure head (&gt;5.0 Bar) are scoped for revalidation.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Link
                href="/replication"
                className="px-3.5 py-2 bg-white text-[#2F4541] rounded-xl text-xs font-bold border border-[#EBDDDA] hover:bg-[#FAF8F6] transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>View Replication Delta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Scope & Contract Terms Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Pilot Scope & Legal Sandbox Terms
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Pre-filled from Approved Template Registry with standardized data, IP, and risk clauses.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] font-mono text-xs rounded-lg font-bold">
                Contract ID: NMC-PLT-2025-04
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Implementing Department</span>
                <span className="text-sm font-bold text-[#2F4541] mt-1 block">
                  Nashik Municipal Corporation (Water Supply)
                </span>
                <span className="text-xs text-[#556B67] font-mono mt-0.5 block">Shri Sanjay More, Addl. Commr.</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Innovator / Startup</span>
                <span className="text-sm font-bold text-[#2F4541] mt-1 block">
                  AcoustiLeak Sensors Pvt Ltd
                </span>
                <span className="text-xs text-[#556B67] font-mono mt-0.5 block">DPIIT-MH-2023-88412</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Sandbox Duration</span>
                <span className="text-sm font-bold text-[#2F4541] mt-1 block">
                  25 Calendar Days (Fast-Track)
                </span>
                <span className="text-xs text-[#556B67] font-mono mt-0.5 block">Target: 15 km Basalt Feeder Trunk</span>
              </div>

              <div className="p-4 bg-[#BFCACC]/15 rounded-xl border border-[#BFCACC]/40">
                <span className="text-xs font-bold text-[#2F4541] uppercase block">State Escrow Allocation</span>
                <span className="text-lg font-black font-mono text-[#2F4541] mt-0.5 block">
                  ₹4,00,000 Total
                </span>
                <span className="text-xs text-[#3D5855] font-medium block">SBI Sandbox Escrow #39281048291</span>
              </div>
            </div>

            {/* Standardized Approved Templates Incorporated */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                Standardized Legal Clauses (Approved Template Library)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2F4541]">Data & IP Ownership</span>
                    <span className="text-[10px] font-mono bg-[#BFCACC]/20 text-[#2F4541] border border-[#BFCACC]/40 px-1.5 py-0.5 rounded font-bold">
                      TPL-DATA-IP-v2.1
                    </span>
                  </div>
                  <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                    Government owns all raw telemetry logs, acoustic spectrograms, and ground-truth coordinates. Startup retains core proprietary ML wave analysis weights.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2F4541]">Risk Register & Mitigation</span>
                    <span className="text-[10px] font-mono bg-[#BFCACC]/20 text-[#2F4541] border border-[#BFCACC]/40 px-1.5 py-0.5 rounded font-bold">
                      TPL-RISK-v1.4
                    </span>
                  </div>
                  <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                    Hard basalt rock wave attenuation risk mitigated through dual-hydrophone cross-correlation sampling at 16 kHz with bandpass filtering.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2F4541]">Conditional Escrow Release</span>
                    <span className="text-[10px] font-mono bg-[#BFCACC]/20 text-[#2F4541] border border-[#BFCACC]/40 px-1.5 py-0.5 rounded font-bold">
                      TPL-ESCROW-v3.0
                    </span>
                  </div>
                  <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                    Funds released strictly per milestone deliverables upon third-party academic sign-off by COEP Technological University.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Escrow Milestone Roadmap */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                  Three-Stage Milestone Roadmap (30% - 40% - 30%)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* M1 */}
                <div className="p-5 rounded-xl border border-[#BFCACC] bg-[#BFCACC]/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#2F4541] uppercase">
                      Milestone 1 • 30% Escrow
                    </span>
                    <span className="text-xs font-bold bg-[#BFCACC] text-[#1E2D2A] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> DISBURSED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#2F4541]">Hardware Deployment & Baseline Setup</h4>
                  <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                    Installation of 12 acoustic hydrophones along Panchavati Feeder Trunk 4 with GSM telemetry handshake.
                  </p>
                  <div className="pt-2 border-t border-[#BFCACC]/40 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2F4541]">₹1,20,000 Disbursed</span>
                    <span className="font-mono text-[#556B67]">Day 1–5</span>
                  </div>
                </div>

                {/* M2 */}
                <div className="p-5 rounded-xl border border-[#D2B48C] bg-[#D2B48C]/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#856441] uppercase">
                      Milestone 2 • 40% Escrow
                    </span>
                    <span className="text-xs font-bold bg-[#D2B48C] text-[#856441] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> IN EVALUATION
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#2F4541]">15km Basalt Acoustic Calibration Sweep</h4>
                  <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                    Continuous telemetry capture, FFT frequency spectrum analysis, and leak anomaly pinpointing.
                  </p>
                  <div className="pt-2 border-t border-[#D2B48C]/40 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#856441]">₹1,60,000 in Escrow</span>
                    <span className="font-mono text-[#856441] font-bold">COEP Audit Active</span>
                  </div>
                </div>

                {/* M3 */}
                <div className="p-5 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#556B67] uppercase">
                      Milestone 3 • 30% Escrow
                    </span>
                    <span className="text-xs font-bold bg-white text-[#556B67] border border-[#EBDDDA] px-2.5 py-0.5 rounded-full">
                      PENDING
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#2F4541]">Ground-Truth Excavation & Final Docket</h4>
                  <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                    Physical excavation verifying leak coordinates (&lt;2.0m tolerance) with academic evaluator joint sign-off.
                  </p>
                  <div className="pt-2 border-t border-[#EBDDDA] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#556B67]">₹1,20,000 Pending</span>
                    <span className="font-mono text-[#556B67]">Day 19–25</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
              <span className="text-xs text-[#556B67] font-medium">
                Pilot terms executed by Smt. Ananya Deshmukh (Finance) & Shri Sanjay More (Projects).
              </span>

              <button
                onClick={() => setActiveSubTab("dashboard")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View Execution Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: EXECUTION DASHBOARD (§18 Steps 12-13, §19.9)                    */}
      {/* ========================================================================= */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* Live Progress Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#EBDDDA] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-[#556B67] text-xs font-bold uppercase">
                <span>Sandbox Timeline</span>
                <Clock className="w-4 h-4 text-[#2F4541]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#2F4541] font-mono">Day 18</span>
                <span className="text-xs font-bold text-[#556B67]">of 25 Days</span>
              </div>
              <div className="w-full bg-[#FAF8F6] border border-[#EBDDDA] h-2 rounded-full overflow-hidden">
                <div className="bg-[#2F4541] h-2 rounded-full" style={{ width: "72%" }}></div>
              </div>
              <span className="text-[11px] text-[#3D5855] font-medium block">72% Completed • On Schedule</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EBDDDA] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-[#556B67] text-xs font-bold uppercase">
                <span>Escrow Settlement</span>
                <CreditCard className="w-4 h-4 text-[#3D5855]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#2F4541] font-mono">₹1.20L</span>
                <span className="text-xs font-bold text-[#556B67]">of ₹4.00L</span>
              </div>
              <div className="w-full bg-[#FAF8F6] border border-[#EBDDDA] h-2 rounded-full overflow-hidden">
                <div className="bg-[#3D5855] h-2 rounded-full" style={{ width: "30%" }}></div>
              </div>
              <span className="text-[11px] text-[#3D5855] font-medium block">30% Released • M2 in Review</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EBDDDA] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-[#556B67] text-xs font-bold uppercase">
                <span>Acoustic Telemetry Packets</span>
                <Activity className="w-4 h-4 text-[#2F4541]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#2F4541] font-mono">9,412</span>
                <span className="text-xs font-bold text-[#3D5855]">0% Loss</span>
              </div>
              <span className="text-xs text-[#3D5855] font-mono block">16 kHz • 24-Bit ADC Stream</span>
              <span className="text-[11px] text-[#556B67] font-medium block">Hashed to State SHA-256 Ledger</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EBDDDA] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-[#556B67] text-xs font-bold uppercase">
                <span>Sensor Fleet Status</span>
                <CheckCircle2 className="w-4 h-4 text-[#3D5855]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#2F4541] font-mono">12 / 12</span>
                <span className="text-xs font-bold text-[#3D5855]">Online</span>
              </div>
              <span className="text-xs text-[#3D5855] font-mono block">4G LTE • Mean Battery 94.2%</span>
              <span className="text-[11px] text-[#556B67] font-medium block">Panchavati Feeder Sector 4</span>
            </div>
          </div>

          {/* Detailed Milestone Health Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Milestone Health & Field Deliverables
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Track live deliverables required to trigger automated escrow state transitions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4B7069] animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-[#2F4541]">Live Ingestion Active</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Deliverable 1 */}
              <div className="p-4 rounded-xl border border-[#BFCACC]/50 bg-[#FAF8F6] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#BFCACC]/30 text-[#2F4541] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white text-[#2F4541] border border-[#EBDDDA] px-2 py-0.5 rounded">
                        M1-DELIV-01
                      </span>
                      <h4 className="text-sm font-bold text-[#2F4541]">Sensor Installation & GeoJSON Topology Map</h4>
                    </div>
                    <p className="text-xs text-[#3D5855] mt-1 font-medium">
                      12 clamp-on sensors deployed at 1.25 km intervals along Panchavati Feeder. GPS verified.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[#556B67]">Verified: May 2</span>
                  <span className="px-2.5 py-1 bg-[#BFCACC]/30 text-[#2F4541] rounded-full text-xs font-bold border border-[#BFCACC]/60">
                    Approved & Disbursed
                  </span>
                </div>
              </div>

              {/* Deliverable 2 */}
              <div className="p-4 rounded-xl border border-[#D2B48C] bg-[#D2B48C]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D2B48C]/25 text-[#856441] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white text-[#856441] border border-[#D2B48C]/40 px-2 py-0.5 rounded">
                        M2-DELIV-02
                      </span>
                      <h4 className="text-sm font-bold text-[#2F4541]">
                        15km Basalt Acoustic Spectrogram Waveform Data
                      </h4>
                    </div>
                    <p className="text-xs text-[#3D5855] mt-1 font-medium">
                      Hydrophone FFT analysis identifying 420 Hz leak sound anomaly at Chainage 14+230 (±1.14m).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[#856441] font-bold">COEP Evaluation Pending</span>
                  <button
                    onClick={() => setActiveSubTab("validation")}
                    className="px-3.5 py-1.5 bg-[#2F4541] text-white rounded-lg text-xs font-bold hover:bg-[#1E2D2A] transition-colors shadow-xs cursor-pointer"
                  >
                    Inspect Telemetry →
                  </button>
                </div>
              </div>

              {/* Deliverable 3 */}
              <div className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white text-[#556B67] border border-[#EBDDDA] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white text-[#556B67] border border-[#EBDDDA] px-2 py-0.5 rounded">
                        M3-DELIV-03
                      </span>
                      <h4 className="text-sm font-bold text-[#2F4541]">
                        Field Ground-Truth Trench Excavation & COEP Sign-Off
                      </h4>
                    </div>
                    <p className="text-xs text-[#3D5855] mt-1 font-medium">
                      Physical excavation with NMC water engineering team to verify rupture and measure spatial accuracy.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[#556B67]">Scheduled: Day 20</span>
                  <span className="px-2.5 py-1 bg-white text-[#556B67] border border-[#EBDDDA] rounded-full text-xs font-bold">
                    Awaiting M2 Sign-off
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
              <button
                onClick={() => setActiveSubTab("builder")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Builder</span>
              </button>

              <button
                onClick={() => setActiveSubTab("validation")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Validation Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: EVIDENCE ENGINE & VALIDATION LAB (§18 Steps 14–15, §19.10–11, §20) */}
      {/* ========================================================================= */}
      {activeSubTab === "validation" && (
        <div className="space-y-6">
          {/* Governance Box (§20 AI vs Rules vs Humans) */}
          <div className="p-5 bg-[#2F4541] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  GOVERNANCE MANDATE: AI EXTRACTS • RULES CONSTRAIN • HUMANS DECIDE
                </span>
                <p className="text-xs text-[#EBDDDA] mt-0.5 leading-relaxed font-medium">
                  AI extracts telemetry waveforms and calculates confidence. High-confidence non-critical items auto-stage. Critical safety, rupture coordinates, and payment claims require mandatory human expert verification.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="px-3 py-1 bg-[#1E2D2A] text-[#D2B48C] border border-[#D2B48C]/40 rounded-lg text-xs font-mono font-bold">
                Zero AI Final Authority
              </span>
            </div>
          </div>

          {/* Evidence Inspector Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Verifiable Field Telemetry & Evidence Artifacts
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Raw acoustic FFT frequency spectrogram, GPS ground-truth excavation log, and SCADA pressure transients.
                </p>
              </div>

              {/* Sub-view switcher */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F6] p-1 rounded-xl border border-[#EBDDDA]">
                <button
                  onClick={() => setSelectedEvidenceView("acoustic")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedEvidenceView === "acoustic"
                      ? "bg-[#2F4541] text-white shadow-2xs"
                      : "text-[#3D5855] hover:text-[#1E2D2A]"
                  }`}
                >
                  Acoustic Spectrum
                </button>
                <button
                  onClick={() => setSelectedEvidenceView("gps")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedEvidenceView === "gps"
                      ? "bg-[#2F4541] text-white shadow-2xs"
                      : "text-[#3D5855] hover:text-[#1E2D2A]"
                  }`}
                >
                  GPS Excavation
                </button>
                <button
                  onClick={() => setSelectedEvidenceView("scada")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedEvidenceView === "scada"
                      ? "bg-[#2F4541] text-white shadow-2xs"
                      : "text-[#3D5855] hover:text-[#1E2D2A]"
                  }`}
                >
                  SCADA Flow
                </button>
              </div>
            </div>

            {/* EVIDENCE VIEW 1: ACOUSTIC SPECTRUM */}
            {selectedEvidenceView === "acoustic" && (
              <div className="space-y-4">
                <div className="bg-[#1E2D2A] text-white p-6 rounded-2xl border border-[#2F4541] font-mono text-xs space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#2F4541] text-[#BFCACC] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#BFCACC] animate-pulse"></span>
                      <span className="font-bold text-white">
                        Hydrophone Sensor AC-04 • Deccan Basalt Acoustic Waveform (Panchavati Trunk Chainage 14+230)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#BFCACC]">Sampling: 16 kHz • 24-Bit ADC Stream</span>
                  </div>

                  {/* Waveform Visualization Bars */}
                  <div className="pt-4 pb-2 space-y-3">
                    <div className="flex items-end justify-between gap-1.5 h-36 px-2 border-b border-[#2F4541]">
                      {[14, 18, 16, 22, 29, 44, 86, 95, 74, 41, 29, 21, 16, 13, 11, 8, 14, 19, 17, 13, 10, 8].map(
                        (h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <div
                              className={`w-full rounded-t transition-all ${
                                h > 70
                                  ? "bg-[#D2B48C] group-hover:bg-[#EBDDDA] shadow-lg shadow-[#D2B48C]/40"
                                  : h > 35
                                  ? "bg-[#BFCACC] group-hover:bg-[#BFCACC]/80"
                                  : "bg-[#4B7069] group-hover:bg-[#4B7069]/80"
                              }`}
                              style={{ height: `${h}%` }}
                            ></div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex justify-between text-[11px] text-[#BFCACC] px-1 font-mono">
                      <span>100 Hz (Ambient City Vibration)</span>
                      <span className="text-[#D2B48C] font-bold">▲ 420 Hz (Acoustic Leak Anomaly: 91.4% Confidence)</span>
                      <span>2000 Hz (High Cutoff)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#2F4541] text-xs text-[#EBDDDA]">
                    <div>
                      <span className="text-[#BFCACC] block text-[11px]">Coherence Delay</span>
                      <span className="font-bold text-white font-mono">43.2 ms</span>
                    </div>
                    <div>
                      <span className="text-[#BFCACC] block text-[11px]">Basalt Strata Wave Speed</span>
                      <span className="font-bold text-white font-mono">4,120 m/s (Calibrated)</span>
                    </div>
                    <div>
                      <span className="text-[#BFCACC] block text-[11px]">Predicted Rupture Location</span>
                      <span className="font-bold text-[#D2B48C] font-mono">Chainage 14.230 km (±1.14m)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#BFCACC]/20 rounded-xl border border-[#BFCACC]/50 text-xs text-[#2F4541] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#2F4541] shrink-0" />
                    <span className="font-semibold">
                      Acoustic signature confirms circumferential rupture on 450mm ductile-iron feeder under 5.2 Bar hydrostatic pressure.
                    </span>
                  </div>
                  <span className="font-mono text-xs bg-[#BFCACC] text-[#1E2D2A] px-2.5 py-1 rounded font-bold shrink-0">
                    SHA-256: 4d8a1c9e...
                  </span>
                </div>
              </div>
            )}

            {/* EVIDENCE VIEW 2: GPS EXCAVATION GROUND TRUTH */}
            {selectedEvidenceView === "gps" && (
              <div className="space-y-4">
                <div className="border border-[#EBDDDA] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF8F6] text-[#2F4541] font-bold uppercase text-[11px] border-b border-[#EBDDDA] font-mono">
                      <tr>
                        <th className="py-3 px-4">Leak ID</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Acoustic Predicted</th>
                        <th className="py-3 px-4">Excavated Reality</th>
                        <th className="py-3 px-4">Spatial Delta</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBDDDA] text-xs">
                      <tr className="hover:bg-[#FAF8F6]">
                        <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">LK-2025-01</td>
                        <td className="py-3 px-4 text-[#3D5855] font-medium">Panchavati Ward 12, Trunk 4</td>
                        <td className="py-3 px-4 font-mono text-[#556B67]">19.9975° N, 73.7898° E</td>
                        <td className="py-3 px-4 font-mono text-[#2F4541] font-bold">19.9975° N, 73.7899° E</td>
                        <td className="py-3 px-4 font-black text-[#2F4541] font-mono">1.14m (Tolerance: &lt;2.0m)</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60 rounded-full font-bold text-[11px]">
                            VERIFIED RUPTURE
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FAF8F6]">
                        <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">LK-2025-02</td>
                        <td className="py-3 px-4 text-[#3D5855] font-medium">CIDCO Reservoir Feeder Junction</td>
                        <td className="py-3 px-4 font-mono text-[#556B67]">19.9880° N, 73.7745° E</td>
                        <td className="py-3 px-4 font-mono text-[#2F4541] font-bold">19.9881° N, 73.7746° E</td>
                        <td className="py-3 px-4 font-black text-[#2F4541] font-mono">1.76m (Tolerance: &lt;2.0m)</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60 rounded-full font-bold text-[11px]">
                            VERIFIED GASKET
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] text-xs text-[#3D5855] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2F4541] shrink-0" />
                    <span>Joint field ground-truth conducted with NMC Assistant Engineer Shri Rahul Pawar.</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#556B67]">EXIF Geotag: Verified</span>
                </div>
              </div>
            )}

            {/* EVIDENCE VIEW 3: SCADA FLOW & PRESSURE */}
            {selectedEvidenceView === "scada" && (
              <div className="p-6 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#2F4541]">
                    SCADA Pumping Flow Inflow vs. Metered Billing (Nashik Water Grid)
                  </h4>
                  <span className="font-mono text-xs text-[#2F4541] bg-white px-2 py-1 rounded border border-[#EBDDDA]">
                    SCADA Gateway Online
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#EBDDDA]">
                    <span className="text-xs uppercase font-bold text-[#556B67] block">Baseline Distribution</span>
                    <span className="text-xl font-black text-[#2F4541] font-mono mt-1 block">1,420,000 m³</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#EBDDDA]">
                    <span className="text-xs uppercase font-bold text-[#556B67] block">Metered Consumption</span>
                    <span className="text-xl font-black text-[#2F4541] font-mono mt-1 block">1,161,560 m³</span>
                  </div>
                  <div className="bg-[#BFCACC]/20 p-4 rounded-xl border border-[#BFCACC]/50">
                    <span className="text-xs uppercase font-bold text-[#2F4541] block">Post-Remediation NRW</span>
                    <span className="text-2xl font-black text-[#2F4541] font-mono mt-1 block">18.2% (from 35.2%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* INDEPENDENT ACADEMIC EVALUATOR VERIFICATION SECTION (§18 Step 15) */}
            <div className="p-6 rounded-2xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2F4541] text-[#FAF8F6] flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5 text-[#D2B48C]" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-[#856441] uppercase tracking-wider block">
                      INDEPENDENT THIRD-PARTY TECHNICAL EVALUATION
                    </span>
                    <h3 className="text-base font-black text-[#2F4541]">
                      Dr. Vidya Joshi • COEP Technological University, Pune
                    </h3>
                    <span className="text-xs text-[#3D5855] font-medium">
                      Professor & Head of Hydraulic Engineering • COEP Hydrology Testbed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#2F4541] font-bold bg-white px-2.5 py-1 rounded-lg border border-[#EBDDDA]">
                    RSA-4096 SIGNED
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#2F4541] leading-relaxed space-y-2 font-medium">
                <p>
                  <strong>Academic Evaluation Memo:</strong> "I have reviewed the raw hydrophone frequency waveforms and independently ground-truthed the excavation coordinates at Panchavati Ward 12. The acoustic attenuation characteristics in Deccan basalt strata (4,120 m/s) match theoretical wave propagation. Circumferential pipe crack localized with 1.14m margin of error, fulfilling Milestone 2 technical qualification criteria."
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[#556B67] font-mono text-[11px] pt-1">
                  <span>Signature Hash: <code>SHA256: 7F4B0E891C3E2D879B5A104E9C230491DE</code></span>
                  <span>Timestamp: 2025-05-12 14:32 IST</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#4B7069]"></span>
                  <span className="text-xs font-bold text-[#2F4541] font-mono">
                    EVALUATOR VERDICT: PASS / EVIDENCE VERIFIED
                  </span>
                </div>

                <button
                  onClick={() => setEvaluatorSigned(!evaluatorSigned)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    evaluatorSigned
                      ? "bg-[#2F4541] text-white hover:bg-[#1E2D2A]"
                      : "bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] hover:bg-white"
                  }`}
                >
                  {evaluatorSigned ? "✓ Academic Sign-Off Affixed" : "Toggle Sign-off State"}
                </button>
              </div>
            </div>

            {/* Telemetry Upload Dropzone */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F4541] block">
                Submit Additional Field Telemetry (SHA-256 Hashed)
              </span>
              <div
                onClick={handleSimulateUpload}
                className="border-2 border-dashed border-[#EBDDDA] hover:border-[#BFCACC] rounded-2xl p-6 text-center cursor-pointer bg-[#FAF8F6] hover:bg-white transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-[#556B67] mx-auto mb-2" />
                <span className="block text-sm font-bold text-[#2F4541]">
                  Click to simulate uploading new hydrophone .dat / .csv telemetry
                </span>
                <span className="block text-xs text-[#556B67] mt-0.5">
                  Automatic cryptographic SHA-256 state hashing is applied immediately
                </span>
              </div>

              {uploadStatus && (
                <div className="p-3 bg-[#BFCACC]/20 border border-[#BFCACC]/50 rounded-xl text-xs font-mono font-bold text-[#2F4541] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F4541] shrink-0" />
                  <span>{uploadStatus}</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
              <button
                onClick={() => setActiveSubTab("dashboard")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Execution</span>
              </button>

              <button
                onClick={() => setActiveSubTab("payment")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Milestone Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MILESTONE PAYMENT APPROVAL (§7.7, §18 Step 16, §19.18)         */}
      {/* ========================================================================= */}
      {activeSubTab === "payment" && (
        <div className="space-y-6">
          {/* Finance Role Notice */}
          <div className="p-5 bg-[#2F4541] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  FINANCIAL DISBURSEMENT WORKFLOW
                </span>
                <p className="text-xs text-[#EBDDDA] mt-0.5 leading-relaxed font-medium">
                  Enforces strict financial state machine: <code className="text-white bg-[#1E2D2A] px-1.5 py-0.5 rounded">Pending → Invoiced → Approved → Disbursed</code>. Escrow releases are mathematically blocked until the academic evaluation PASS verdict is cryptographically stamped.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#1E2D2A] text-[#D2B48C] border border-[#D2B48C]/40 rounded-lg text-xs font-mono font-bold shrink-0">
              Role: Finance / Chief Accounts Officer
            </span>
          </div>

          {/* Escrow Sandbox Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  State Innovation Escrow Sandbox Disbursals
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  State Bank of India Special Escrow Account #39281048291 • Nashik Water Pilot
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[#556B67] font-bold uppercase block">Total Sandbox Escrow</span>
                <span className="text-2xl font-black text-[#2F4541] font-mono">₹4,00,000</span>
              </div>
            </div>

            {/* 3 Milestone Financial State Cards */}
            <div className="space-y-4">
              {/* MILESTONE 1: 30% */}
              <div className="p-5 rounded-2xl border border-[#BFCACC] bg-[#BFCACC]/15 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1E2D2A] bg-[#BFCACC] px-2 py-0.5 rounded">
                        STAGE 1 • 30% ESCROW
                      </span>
                      <h3 className="text-sm font-bold text-[#2F4541]">
                        Hardware Deployment & Telemetry Handshake
                      </h3>
                    </div>
                    <span className="text-xs text-[#3D5855] font-medium mt-1 block">
                      Invoice: <code>INV-2025-0018</code> • Verified by NMC Field Engineer
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#2F4541] font-mono">₹1,20,000</span>
                    <span className="px-3 py-1 bg-[#BFCACC] text-[#1E2D2A] rounded-full text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> DISBURSED
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#BFCACC]/40 flex flex-wrap items-center justify-between text-xs text-[#3D5855] font-mono">
                  <span>SBI UTR: <strong>SBIN00492810284</strong></span>
                  <span>Settled: 2025-05-02</span>
                  <span>Authorized by: Smt. Ananya Deshmukh (CAO, NMC)</span>
                </div>
              </div>

              {/* MILESTONE 2: 40% */}
              <div
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  m2PaymentState === "DISBURSED"
                    ? "border-[#BFCACC] bg-[#BFCACC]/15"
                    : m2PaymentState === "APPROVED"
                    ? "border-[#BFCACC] bg-[#BFCACC]/10"
                    : "border-[#D2B48C] bg-[#D2B48C]/15"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white text-[#2F4541] border border-[#EBDDDA] px-2 py-0.5 rounded">
                        STAGE 2 • 40% ESCROW
                      </span>
                      <h3 className="text-sm font-bold text-[#2F4541]">
                        15km Basalt Acoustic Calibration & Leak Identification
                      </h3>
                    </div>
                    <span className="text-xs text-[#3D5855] font-medium mt-1 block">
                      Invoice: <code>INV-2025-0042</code> • Precondition: COEP Academic PASS Verdict (Passed)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#2F4541] font-mono">₹1,60,000</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 font-mono ${
                        m2PaymentState === "DISBURSED"
                          ? "bg-[#BFCACC] text-[#1E2D2A]"
                          : m2PaymentState === "APPROVED"
                          ? "bg-[#BFCACC]/40 text-[#2F4541]"
                          : "bg-[#D2B48C] text-[#856441]"
                      }`}
                    >
                      {m2PaymentState === "DISBURSED" && <Check className="w-3.5 h-3.5" />}
                      {m2PaymentState}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBDDDA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-[#3D5855] font-mono">
                    {m2PaymentState === "DISBURSED" ? (
                      <span>SBI UTR: <strong>{disbursementTx}</strong> • Settled Just Now</span>
                    ) : (
                      <span>COEP Academic Sign-Off: <strong>VERIFIED (SHA-256: 7F4B...)</strong></span>
                    )}
                  </div>

                  {/* Interactive Disbursement Action Button */}
                  {m2PaymentState !== "DISBURSED" ? (
                    <button
                      onClick={handleAuthorizeDisbursement}
                      className="px-4 py-2 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Authorize Escrow Release (₹1,60,000)</span>
                    </button>
                  ) : (
                    <span className="text-[#2F4541] font-bold font-mono text-xs flex items-center gap-1">
                      <CheckCheck className="w-4 h-4 text-[#2F4541]" /> Funds Disbursed to AcoustiLeak SBI A/C
                    </span>
                  )}
                </div>
              </div>

              {/* MILESTONE 3: 30% */}
              <div className="p-5 rounded-2xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white text-[#556B67] border border-[#EBDDDA] px-2 py-0.5 rounded">
                        STAGE 3 • 30% ESCROW
                      </span>
                      <h3 className="text-sm font-bold text-[#2F4541]">
                        Physical Ground-Truth Excavation & Final Sign-Off Docket
                      </h3>
                    </div>
                    <span className="text-xs text-[#556B67] font-medium mt-1 block">
                      Awaiting completion of field ground excavation (Scheduled Day 20)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#556B67] font-mono">₹1,20,000</span>
                    <span className="px-3 py-1 bg-white text-[#556B67] border border-[#EBDDDA] rounded-full text-xs font-bold font-mono">
                      PENDING
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Treasury Audit Log Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                Treasury Settlement Audit Log
              </h3>
              <div className="border border-[#EBDDDA] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F6] text-[#2F4541] font-bold uppercase text-[11px] font-mono border-b border-[#EBDDDA]">
                    <tr>
                      <th className="py-2.5 px-4">Tx Hash</th>
                      <th className="py-2.5 px-4">Milestone</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Beneficiary</th>
                      <th className="py-2.5 px-4">Authorizing Official</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBDDDA] text-xs font-mono">
                    <tr className="hover:bg-[#FAF8F6]">
                      <td className="py-2.5 px-4 font-bold text-[#2F4541]">TXN-882190</td>
                      <td className="py-2.5 px-4 text-[#3D5855]">Milestone 1 (30%)</td>
                      <td className="py-2.5 px-4 font-bold text-[#2F4541]">₹1,20,000</td>
                      <td className="py-2.5 px-4 text-[#3D5855]">AcoustiLeak Sensors</td>
                      <td className="py-2.5 px-4 text-[#556B67]">Smt. Ananya Deshmukh</td>
                      <td className="py-2.5 px-4 text-[#2F4541] font-bold">SETTLED</td>
                    </tr>
                    {m2PaymentState === "DISBURSED" && (
                      <tr className="hover:bg-[#FAF8F6] bg-[#BFCACC]/10">
                        <td className="py-2.5 px-4 font-bold text-[#2F4541]">{disbursementTx}</td>
                        <td className="py-2.5 px-4 text-[#3D5855]">Milestone 2 (40%)</td>
                        <td className="py-2.5 px-4 font-bold text-[#2F4541]">₹1,60,000</td>
                        <td className="py-2.5 px-4 text-[#3D5855]">AcoustiLeak Sensors</td>
                        <td className="py-2.5 px-4 text-[#556B67]">Current User (Finance)</td>
                        <td className="py-2.5 px-4 text-[#2F4541] font-bold">SETTLED</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
              <button
                onClick={() => setActiveSubTab("validation")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Evidence</span>
              </button>

              <button
                onClick={() => setActiveSubTab("decision")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Post-Pilot Decision Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: DECISION & PROCUREMENT ROUTE (§13, §14, §18 Steps 17–18)       */}
      {/* ========================================================================= */}
      {activeSubTab === "decision" && (
        <div className="space-y-6">
          {/* Decision Governance Notice (§14 & §20) */}
          <div className="p-5 bg-[#2F4541] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  CANONICAL FOUR-VALUE DECISION ENGINE: STOP / ADAPT / REVALIDATE / SCALE
                </span>
                <p className="text-xs text-[#EBDDDA] mt-0.5 leading-relaxed font-medium">
                  Deterministic scoring determines the decision recommendation. AI drafts the explanation memo only. If and only if the decision is <code>SCALE</code>, the Procurement Authority selects a Procurement Route.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#1E2D2A] text-[#D2B48C] border border-[#D2B48C]/40 rounded-lg text-xs font-mono font-bold shrink-0">
              Role: Procurement Authority
            </span>
          </div>

          {/* Decision Engine Interactive Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Deterministic Post-Pilot Decision Engine
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Evaluated against the weighted framework: Impact (35%), Cost (20%), Tech Maturity (15%), Operational (10%), Security (10%), Adoption (5%), Scalability (5%).
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono font-bold text-[#556B67] uppercase block">Deterministic Score</span>
                <span className="text-3xl font-black text-[#2F4541] font-mono">91.2 / 100</span>
              </div>
            </div>

            {/* 4 Canonical Enum Values Switcher (§14) */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F4541] block">
                The Four Canonical Decision Values
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* SCALE */}
                <button
                  onClick={() => setSelectedDecision("SCALE")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDecision === "SCALE"
                      ? "border-[#2F4541] bg-[#FAF8F6] text-[#2F4541] shadow-2xs"
                      : "border-[#EBDDDA] bg-white hover:bg-[#FAF8F6] text-[#3D5855]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm">SCALE</span>
                    {selectedDecision === "SCALE" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed font-medium">
                    Evidence overwhelmingly supports wider deployment; proceed to select a Procurement Route.
                  </p>
                </button>

                {/* ADAPT */}
                <button
                  onClick={() => setSelectedDecision("ADAPT")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDecision === "ADAPT"
                      ? "border-[#856441] bg-[#FAF8F6] text-[#856441] shadow-2xs"
                      : "border-[#EBDDDA] bg-white hover:bg-[#FAF8F6] text-[#3D5855]"
                  }`}
                >
                  <span className="font-mono font-black text-sm block">ADAPT</span>
                  <p className="text-xs mt-1.5 leading-relaxed font-medium">
                    Pilot showed promise but solution/implementation needs parameter modification.
                  </p>
                </button>

                {/* REVALIDATE */}
                <button
                  onClick={() => setSelectedDecision("REVALIDATE")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDecision === "REVALIDATE"
                      ? "border-[#D2B48C] bg-[#FAF8F6] text-[#856441] shadow-2xs"
                      : "border-[#EBDDDA] bg-white hover:bg-[#FAF8F6] text-[#3D5855]"
                  }`}
                >
                  <span className="font-mono font-black text-sm block">REVALIDATE</span>
                  <p className="text-xs mt-1.5 leading-relaxed font-medium">
                    Evidence is insufficient or context has changed since it was gathered.
                  </p>
                </button>

                {/* STOP */}
                <button
                  onClick={() => setSelectedDecision("STOP")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDecision === "STOP"
                      ? "border-[#856441] bg-[#FAF8F6] text-[#856441] shadow-2xs"
                      : "border-[#EBDDDA] bg-white hover:bg-[#FAF8F6] text-[#3D5855]"
                  }`}
                >
                  <span className="font-mono font-black text-sm block">STOP</span>
                  <p className="text-xs mt-1.5 leading-relaxed font-medium">
                    Impact, cost, risk, or feasibility is unacceptable; continuation is not justified.
                  </p>
                </button>
              </div>
            </div>

            {/* §24 Evaluation Framework Weights & Scores */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                Deterministic Scoring Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Impact (35%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">33.0</span>
                </div>
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Cost Eff. (20%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">18.5</span>
                </div>
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Tech Maturity (15%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">14.0</span>
                </div>
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Operational (10%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">8.5</span>
                </div>
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Security (10%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">9.2</span>
                </div>
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Adoption (5%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">4.0</span>
                </div>
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Scalability (5%)</span>
                  <span className="text-base font-black text-[#2F4541] font-mono mt-1 block">4.0</span>
                </div>
              </div>
            </div>

            {/* AI-Drafted Explanation Memo (§20) */}
            <div className="p-5 rounded-xl border border-[#BFCACC]/50 bg-[#FAF8F6] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#2F4541] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2F4541]" /> AI-Drafted Explanation Memo
                </span>
                <span className="text-[11px] font-mono text-[#556B67]">Subject to Human Authorization</span>
              </div>
              <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                "The pilot has empirically verified acoustic waveform detection in hard Deccan basalt strata along Panchavati Feeder Trunk 4. The 420 Hz acoustic frequency signature detected circumferential pipe ruptures with a mean ground-truth excavation error of 1.14m (surpassing the &lt;2.0m requirement). Non-Revenue Water reduction reached 18.2% from a 35.2% baseline, and unit economics demonstrate ₹28,000/km vs. ₹1,45,000/km for manual trenching. Academic verification by COEP is signed."
              </p>
            </div>

            {/* PROCUREMENT ROUTE SELECTOR (§13) — APPLIES ONLY IF SCALE */}
            {selectedDecision === "SCALE" && (
              <div className="p-6 rounded-2xl border border-[#BFCACC] bg-[#BFCACC]/15 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BFCACC]/40 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#2F4541] uppercase tracking-wider block">
                      POST-PILOT PROCUREMENT ROUTE SELECTOR
                    </span>
                    <h3 className="text-base font-black text-[#2F4541] mt-0.5">
                      How should Government proceed to scale procurement?
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#1E2D2A] bg-[#BFCACC] px-2.5 py-1 rounded-lg font-bold">
                    Unlocked via SCALE Verdict
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      id: "DIRECT_PROCUREMENT",
                      name: "Direct Procurement (Rule 166 GFR)",
                      desc: "Single-source innovation procurement under GFR Rule 166 safe harbor exemption.",
                    },
                    {
                      id: "TRIAL_ORDER",
                      name: "Trial Order (Limited Ward Rollout)",
                      desc: "Commercial trial order for 6 months across 4 high-loss municipal zones.",
                    },
                    {
                      id: "PHASED_PROCUREMENT",
                      name: "Phased City-Wide Procurement",
                      desc: "Multi-year phased tender with pre-qualification waiver based on validated Passport evidence.",
                    },
                    {
                      id: "SANDBOX_EXTENSION",
                      name: "Sandbox Zone Extension",
                      desc: "Extend active testing sandbox to encompass an additional 50km of gravity-fed pipes.",
                    },
                    {
                      id: "TARGETED_FOLLOW_UP",
                      name: "Targeted Follow-up Pilot",
                      desc: "Handoff back to Tab 4 Builder to validate an unaddressed environmental boundary condition.",
                    },
                    {
                      id: "REQUEST_MORE_EVIDENCE",
                      name: "Request Supplementary Field Evidence",
                      desc: "Keep pilot active until further seasonal monsoon telemetry data is logged.",
                    },
                  ].map((route) => (
                    <button
                      key={route.id}
                      onClick={() => setSelectedProcurementRoute(route.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedProcurementRoute === route.id
                          ? "border-[#2F4541] bg-white shadow-xs"
                          : "border-[#EBDDDA] bg-[#FAF8F6] hover:bg-white text-[#3D5855]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2F4541]">{route.name}</span>
                        {selectedProcurementRoute === route.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#2F4541]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#3D5855] mt-1 leading-relaxed font-medium">{route.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MANDATORY HUMAN PROCUREMENT AUTHORITY AUTHORIZATION (§18 Step 18) */}
            <div className="p-6 rounded-2xl bg-[#1E2D2A] text-white border border-[#2F4541] space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2F4541] pb-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-[#D2B48C]" />
                  <div>
                    <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                      MANDATORY HUMAN AUTHORIZATION
                    </span>
                    <span className="text-sm font-bold text-white">
                      Shri Sanjay More • Additional Municipal Commissioner (Projects), NMC
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono text-[#BFCACC]">
                  Authority ID: <code>AUTH-GOV-MH-0041</code>
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#EBDDDA] block">
                  Official Justification Memo for Audit Record:
                </label>
                <textarea
                  value={authorizationMemo}
                  onChange={(e) => setAuthorizationMemo(e.target.value)}
                  rows={3}
                  className="w-full bg-[#2F4541] border border-[#3D5855] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#D2B48C] leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="text-xs text-[#BFCACC] font-medium">
                  {decisionAuthorized ? (
                    <span className="text-[#D2B48C] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Formally Authorized & Hashed to State Registry
                    </span>
                  ) : (
                    <span>Clicking executes official government procurement decision into immutable audit trail.</span>
                  )}
                </div>

                <button
                  onClick={() => setDecisionAuthorized(true)}
                  className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    decisionAuthorized
                      ? "bg-[#2F4541] text-white border border-[#BFCACC] cursor-default"
                      : "bg-[#D2B48C] hover:bg-[#c2a278] text-[#1E2D2A]"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {decisionAuthorized ? "Decision Authorized & Minted" : "Execute Official Procurement Decision"}
                  </span>
                </button>
              </div>

              {decisionAuthorized && (
                <div className="p-4 bg-[#2F4541] border border-[#BFCACC] rounded-xl text-xs space-y-2 text-[#FAF8F6]">
                  <div className="flex items-center justify-between font-bold text-[#D2B48C] font-mono">
                    <span>STATUS: DECISION IMMUTABLY COMMITTED</span>
                    <span>TIMESTAMP: {new Date().toISOString()}</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    The pilot outcome (<code>{selectedDecision}</code> via <code>{selectedProcurementRoute}</code>) has been cryptographically signed and stored in the State Innovation Registry. The <strong>Procurement Readiness Passport</strong> has been finalized and indexed for statewide replication matching!
                  </p>
                  <div className="pt-2 flex items-center gap-4">
                    <Link
                      href="/passport"
                      className="text-[#D2B48C] font-bold underline hover:text-[#EBDDDA] transition-colors"
                    >
                      View Finalized Passport (Tab 6) →
                    </Link>
                    <Link
                      href="/replication"
                      className="text-[#D2B48C] font-bold underline hover:text-[#EBDDDA] transition-colors"
                    >
                      View Replication Engine (Tab 5) →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-start items-center border-t border-[#EBDDDA]">
              <button
                onClick={() => setActiveSubTab("payment")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PilotsAndDecisionPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#3D5855]">Loading Pilots & Decision Engine...</div>}>
      <PilotsAndDecisionContent />
    </React.Suspense>
  );
}
