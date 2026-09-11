"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  Sparkles,
  Key,
  Check,
  Lock,
  ChevronDown,
  Scale,
  Award,
  Sliders,
  Users,
  Search,
  CheckCheck
} from "lucide-react";

function EvaluationHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentRole, evaluatorClaims, verifyClaim, rejectClaim } = useApp();

  // Tab 3 Sub-tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2
  type SubTabId = "dossier" | "gate1" | "gate2" | "consensus";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("dossier");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["dossier", "gate1", "gate2", "consensus"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["dossier", "gate1", "gate2", "consensus"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/evaluator?tab=${tab}`, { scroll: false });
  };

  // Selected candidate proposal
  const [selectedProposalId, setSelectedProposalId] = useState("PROP-01");
  const [signOffDone, setSignOffDone] = useState(false);

  const subTabs = [
    {
      id: "dossier",
      label: "Proposal Dossier & Screening",
      shortLabel: "Dossier & Screening",
      badge: "3 Proposals",
    },
    {
      id: "gate1",
      label: "Gate 1 — Innovation Qualification",
      shortLabel: "Gate 1 (TRL Quality)",
      badge: "TRL 7 Validated",
    },
    {
      id: "gate2",
      label: "Gate 2 — Risk-Equivalent Procurement Qualification",
      shortLabel: "Gate 2 (Risk-Equivalent)",
      badge: "Turnover Safe Harbor",
    },
    {
      id: "consensus",
      label: "Consensus Scoring & Selection Sign-off",
      shortLabel: "Scoring & Selection",
      badge: "Deterministic 88.5",
    },
  ];

  const proposals = [
    {
      id: "PROP-01",
      name: "AcoustiLeak Sensors Pvt Ltd",
      tech: "Deccan Basalt Sub-Surface Acoustic Wave Spectrogram Array",
      trl: "TRL 7 (Field Operational Prototype)",
      turnover: "₹42 Lakhs (Exempted via Risk-Equivalent Runway)",
      runway: "14 Months Audited Cash Balance",
      score: 88.5,
      status: "QUALIFIED_RANK_1",
      gate1: "PASSED (TRL 7)",
      gate2: "PASSED (Escrow Safeguard)",
      team: "Ex-IIT Bombay & COEP Hydraulics Alumni",
    },
    {
      id: "PROP-02",
      name: "HydroSense AI Technologies",
      tech: "Pressure Transient SCADA Wavelet Anomaly Engine",
      trl: "TRL 6 (Validated in Simulated Pipe Lab)",
      turnover: "₹1.10 Crores (Seed Round Funded)",
      runway: "8 Months Runway",
      score: 74.0,
      status: "QUALIFIED_RANK_2",
      gate1: "PASSED (TRL 6)",
      gate2: "PASSED (Partial Bond Required)",
      team: "Data Science Team (Pune)",
    },
    {
      id: "PROP-03",
      name: "AquaSonic Ultrasonic Systems",
      tech: "Ultrasonic Clamp-on Doppler Flow Transducer",
      trl: "TRL 5 (Requires Pipe Excavation)",
      turnover: "₹18 Lakhs",
      runway: "4 Months Runway",
      score: 58.0,
      status: "REJECTED_TRL_INSUFFICIENT",
      gate1: "FAILED (Requires Trenching)",
      gate2: "FLAGGED (Low Runway)",
      team: "Early-stage Hardware Incubatee",
    },
  ];

  const activeProposal = proposals.find((p) => p.id === selectedProposalId) || proposals[0];

  const handleSignOff = () => {
    setSignOffDone(true);
    setTimeout(() => {
      alert("Selection Memo Formally Signed and Cryptographically Stamped!\n\nProcurement Readiness Passport #MH-EP-2025-WTR-0042 created in IN_PROGRESS status.");
    }, 400);
  };

  return (
    <div className="space-y-8 py-4 w-full">
      
      {/* ========================================================================= */}
      {/* 1. BREADCRUMB & HEADER                                                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Slim Persistent Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[#556B67]">
            <Link href="/" className="font-bold text-[#1E2D2A] hover:underline">
              ProcSync
            </Link>
            <span>/</span>
            <span>Evaluation Hub</span>
            <span>/</span>
            <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
              {subTabs.find((t) => t.id === activeSubTab)?.shortLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#556B67]">
              <span>Active Stage:</span>
              <strong className="text-[#1E2D2A]">{subTabs.find((t) => t.id === activeSubTab)?.label}</strong>
            </div>
            {/* Academic Evaluator Badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-[#EBDDDA] shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-[#4B7069]" />
              <span className="text-[11px] font-bold text-[#1E2D2A]">Dr. Vidya Joshi</span>
              <span className="text-[11px] text-[#556B67] font-medium">(COEP)</span>
            </div>
          </div>
        </div>

        {/* Page Title Card */}
        <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] font-mono text-[10px] font-bold border border-[#D2B48C]/40">
                THREE-GATE EVALUATION ENGINE
              </span>
              <span className="text-[#EBDDDA] text-xs">•</span>
              <span className="text-xs text-[#556B67] font-mono">
                Independent Academic Audit Protocol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E2D2A] tracking-tight">
              Evaluation & Qualification Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#3D5855] font-medium max-w-3xl leading-relaxed">
              Screen startup proposals transparently through deterministic rules. Gate 1 qualifies technical maturity and expected outcomes. 
              Gate 2 uses Risk-Equivalent Qualification to deconstruct arbitrary turnover barriers into audited evidence and escrow safeguards.
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-1 shrink-0 text-center sm:text-right shadow-2xs">
            <span className="text-[10px] uppercase font-mono font-bold text-[#4B7069] block">Empaneled Authority</span>
            <span className="text-sm font-black text-[#1E2D2A] block">COEP Pune</span>
            <span className="text-[10px] text-[#556B67] block">Autonomous State Tech Univ</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. FULL WIDTH WORKSPACE (Sub-Tab Content Panels)                          */}
      {/* ========================================================================= */}
      <div className="space-y-6">

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 1: PROPOSAL DOSSIER & SCREENING                                 */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "dossier" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-[#1E2D2A]">
                  1. Startup Proposals & Deterministic Eligibility Dossier
                </h2>
                <p className="text-xs text-[#556B67] font-medium mt-1">
                  Proposals submitted for NMC Water Leakage Sandbox (Challenge #NMC-WTR-2025).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#556B67]">
                Rule Engine: Deterministic Checks
              </span>
            </div>

            {/* Proposals List */}
            <div className="space-y-4">
              {proposals.map((prop, idx) => (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposalId(prop.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                    selectedProposalId === prop.id
                      ? "border-[#2F4541] bg-[#FAF8F6] shadow-xs"
                      : "border-[#EBDDDA] bg-white hover:border-[#D2B48C]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-[#556B67]">
                          {prop.id} • Rank #{idx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          prop.status.includes("QUALIFIED")
                            ? "bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                          {prop.status}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[#1E2D2A]">{prop.name}</h3>
                      <p className="text-xs text-[#556B67] font-medium">{prop.tech}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#556B67] block">Weighted Score</span>
                      <span className="text-2xl font-mono font-black text-[#1E2D2A]">{prop.score}/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-[#EBDDDA]/70 font-medium text-[#3D5855]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#556B67] block">Maturity:</span>
                      <strong className="text-[#1E2D2A]">{prop.trl}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#556B67] block">Gate 1 Result:</span>
                      <strong className="text-[#2F4541]">{prop.gate1}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#556B67] block">Financial Runway:</span>
                      <strong className="text-[#1E2D2A]">{prop.runway}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#556B67] block">Gate 2 Result:</span>
                      <strong className="text-[#856441]">{prop.gate2}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Step Action Bar */}
            <div className="pt-4 border-t border-[#EBDDDA]/70 flex items-center justify-between">
              <span className="text-xs text-[#556B67] font-medium">
                Selected: <strong>{activeProposal.name}</strong>
              </span>

              <button
                type="button"
                onClick={() => switchSubTab("gate1")}
                className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Gate 1 (Innovation Qualification)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 2: GATE 1 — INNOVATION QUALIFICATION                           */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "gate1" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 text-xs font-mono font-bold">
                  GATE 1 — INNOVATION QUALIFICATION
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                Is the solution good enough? Technical Maturity & Proof
              </h2>
              <p className="text-xs text-[#556B67] font-medium mt-0.5">
                Evaluates technology novelty, TRL maturity, verified previous deployments, and expected outcome correlation.
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#556B67] block">Evaluating Proposal:</span>
                <strong className="text-sm text-[#1E2D2A]">{activeProposal.name}</strong>
              </div>
              <span className="text-xs font-mono font-bold text-[#2F4541] bg-[#BFCACC]/25 border border-[#BFCACC]/40 px-2.5 py-1 rounded-full">
                TRL 7 Confirmed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-[#556B67] block">
                  1. Technical Capability & Physics Model
                </span>
                <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                  Acoustic wave transit-time velocity calculation through basalt geological strata. Sensor clamps on isolation valves without pipe wall perforation or service disruption.
                </p>
                <div className="pt-2 border-t border-[#EBDDDA] text-xs flex justify-between text-[#556B67] font-mono">
                  <span>Evaluator Score:</span>
                  <strong className="text-[#2F4541]">95 / 100</strong>
                </div>
              </div>

              <div className="p-5 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-[#556B67] block">
                  2. Prior Field Deployments & Lab Audits
                </span>
                <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                  Completed 90-day sandbox pilot with Pune Municipal Corporation (PMC-WTR-2025-01). Independent audit conducted by COEP hydraulics lab confirming 14 pinhole leaks detected within 1.2m.
                </p>
                <div className="pt-2 border-t border-[#EBDDDA] text-xs flex justify-between text-[#556B67] font-mono">
                  <span>Audit Confidence:</span>
                  <strong className="text-[#2F4541]">98.4% (COEP Certified)</strong>
                </div>
              </div>

              <div className="p-5 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-[#556B67] block">
                  3. Expected Outcome Correlation
                </span>
                <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                  Mathematical proof matches Nashik’s baseline requirement: Projected reduction in Non-Revenue Water from 32% down to 18.5% within 25 days of basalt acoustic calibration.
                </p>
                <div className="pt-2 border-t border-[#EBDDDA] text-xs flex justify-between text-[#556B67] font-mono">
                  <span>KPI Feasibility:</span>
                  <strong className="text-[#2F4541]">High (Verified Delta)</strong>
                </div>
              </div>

              <div className="p-5 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-[#556B67] block">
                  4. Engineering Risk & Failure Modes
                </span>
                <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                  Known limitation: High soil salinity may attenuate acoustic frequencies above 8 kHz. Mitigated by low-frequency 2 kHz impulse matching built into firmware v2.4.
                </p>
                <div className="pt-2 border-t border-[#EBDDDA] text-xs flex justify-between text-[#556B67] font-mono">
                  <span>Residual Tech Risk:</span>
                  <strong className="text-[#856441]">Low (Firmware Compensated)</strong>
                </div>
              </div>

            </div>

            {/* Gate 1 Verdict */}
            <div className="p-4 bg-[#FAF8F6] rounded-2xl border-2 border-[#BFCACC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2F4541]" />
                <div>
                  <span className="text-xs font-black text-[#1E2D2A] block">Gate 1 Verdict: QUALIFIED FOR SANDBOX</span>
                  <span className="text-[11px] text-[#556B67]">Meets all technical maturity thresholds under Maharashtra Innovation Sandbox guidelines.</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#2F4541] bg-white px-3 py-1 rounded-xl border border-[#EBDDDA]">
                Score: 92 / 100
              </span>
            </div>

            {/* Next Step Action Bar */}
            <div className="pt-4 border-t border-[#EBDDDA]/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchSubTab("dossier")}
                className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ← Back to Proposals
              </button>

              <button
                type="button"
                onClick={() => switchSubTab("gate2")}
                className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Gate 2 (Risk-Equivalent Qualification)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 3: GATE 2 — RISK-EQUIVALENT PROCUREMENT QUALIFICATION          */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "gate2" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 text-xs font-mono font-bold">
                  GATE 2 — PROCUREMENT QUALIFICATION
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                Can government safely contract with this startup?
              </h2>
              <p className="text-xs text-[#556B67] font-medium mt-0.5">
                Core principle: <em>"Lower the barrier, not the quality bar."</em> Deconstruct traditional financial barriers into verifiable evidence and legal safeguards.
              </p>
            </div>

            {/* The Canonical Risk-Equivalent Loop (§10) */}
            <div className="p-6 bg-[#FAF8F6] rounded-2xl border-2 border-[#EBDDDA] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#556B67] tracking-wider">
                  The Risk-Equivalent Qualification Loop
                </span>
                <span className="text-xs font-mono font-bold text-[#2F4541] bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
                  Zero Arbitrary Waivers
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                
                <div className="p-3 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-red-600 block">1. Requirement</span>
                  <strong className="text-[#1E2D2A] block">₹5 Cr Turnover</strong>
                  <p className="text-[11px] text-[#556B67]">Standard municipal RFP criterion</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#556B67] block">2. Underlying Risk</span>
                  <strong className="text-[#1E2D2A] block">Delivery Default</strong>
                  <p className="text-[11px] text-[#556B67]">Vendor cashout during contract</p>
                </div>

                <div className="p-3 bg-[#F0F4F5] rounded-xl border border-[#BFCACC] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#2F4541] block">3. Alternative Evidence</span>
                  <strong className="text-[#1E2D2A] block">14m Cash Runway</strong>
                  <p className="text-[11px] text-[#3D5855]">Audited bank liquidity statement</p>
                </div>

                <div className="p-3 bg-[#F7EFE5] rounded-xl border border-[#D2B48C] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#856441] block">4. Assigned Safeguard</span>
                  <strong className="text-[#856441] block">Milestone Escrow</strong>
                  <p className="text-[11px] text-[#856441]">Zero upfront cash; paid post-audit</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#2F4541] block">5. Human Decision</span>
                  <strong className="text-[#1E2D2A] block">Authorized</strong>
                  <p className="text-[11px] text-[#556B67]">Protected under GFR Rule 149</p>
                </div>

              </div>
            </div>

            {/* Prior Experience Deconstruction */}
            <div className="p-6 bg-[#FAF8F6] rounded-2xl border-2 border-[#EBDDDA] space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-[#556B67] tracking-wider block">
                Deconstruction of 3-Year Prior Government Contracting Experience
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Alternative Technical Evidence:</span>
                  <strong className="text-[#1E2D2A] block text-xs">Pune Municipal Corp Pilot (PMC-WTR-2025-01)</strong>
                  <p className="text-[11px] text-[#556B67]">
                    Replaces 3 years of generic contracting with an audited 120km municipal field deployment proof verified by COEP Technological University.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#556B67] block">Statutory Indemnification:</span>
                  <strong className="text-[#1E2D2A] block text-xs">Maharashtra Public Procurement Order 2018</strong>
                  <p className="text-[11px] text-[#556B67]">
                    Officially indemnifies municipal chief engineers against CAG audit objections when accepting risk-equivalent evidence.
                  </p>
                </div>
              </div>
            </div>

            {/* Gate 2 Verdict */}
            <div className="p-4 bg-[#FAF8F6] rounded-2xl border-2 border-[#BFCACC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2F4541]" />
                <div>
                  <span className="text-xs font-black text-[#1E2D2A] block">Gate 2 Verdict: PROCUREMENT QUALIFICATION APPROVED</span>
                  <span className="text-[11px] text-[#556B67]">Residual risk mitigated by 3-stage milestone escrow disbursement in SBI Virtual Account.</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#2F4541] bg-white px-3 py-1 rounded-xl border border-[#EBDDDA]">
                Risk Score: 12% (Low)
              </span>
            </div>

            {/* Next Step Action Bar */}
            <div className="pt-4 border-t border-[#EBDDDA]/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchSubTab("gate1")}
                className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ← Back to Gate 1
              </button>

              <button
                type="button"
                onClick={() => switchSubTab("consensus")}
                className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Consensus Scoring</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 4: CONSENSUS SCORING & SELECTION SIGN-OFF                       */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "consensus" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 text-xs font-mono font-bold">
                    DETERMINISTIC EVALUATION FRAMEWORK
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                  Consensus Ranking & Final Award Sign-Off
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-[#556B67]">
                Rule Engine: Zero AI Unchecked Authority
              </span>
            </div>

            {/* Scoring Dimension Weights Breakdown (§24) */}
            <div className="p-5 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#556B67] block">
                Evaluation Weight Matrix (Configurable per Domain)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Impact</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">35%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Cost</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">20%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Maturity</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">15%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Operational</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">10%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Security</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">10%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Adoption</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">5%</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] text-[#556B67] font-bold block">Scalability</span>
                  <span className="text-sm font-black text-[#1E2D2A] font-mono">5%</span>
                </div>
              </div>
            </div>

            {/* Comparative Consensus Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#EBDDDA] text-[#556B67] font-mono text-[11px]">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Startup Entity</th>
                    <th className="py-3 px-3">Gate 1 (TRL)</th>
                    <th className="py-3 px-3">Gate 2 (Procurement)</th>
                    <th className="py-3 px-3">Weighted Score</th>
                    <th className="py-3 px-3">Selection Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBDDDA]">
                  <tr className="bg-[#FAF8F6]">
                    <td className="py-3.5 px-3 font-mono font-black text-[#2F4541] text-sm">#1</td>
                    <td className="py-3.5 px-3">
                      <strong className="text-[#1E2D2A] block">AcoustiLeak Sensors Pvt Ltd</strong>
                      <span className="text-[11px] text-[#556B67]">Deccan Basalt Sensor Array</span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#2F4541]">95 / 100 (TRL 7)</td>
                    <td className="py-3.5 px-3 font-bold text-[#2F4541]">Pass (14m Runway)</td>
                    <td className="py-3.5 px-3 font-mono font-black text-[#1E2D2A] text-base">88.5 / 100</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 font-bold text-[10px]">
                        AWARD RECOMMENDED
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#556B67]">#2</td>
                    <td className="py-3.5 px-3">
                      <strong className="text-[#1E2D2A] block">HydroSense AI Technologies</strong>
                      <span className="text-[11px] text-[#556B67]">Pressure Transient Wavelet</span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#3D5855]">76 / 100 (TRL 6)</td>
                    <td className="py-3.5 px-3 font-bold text-[#3D5855]">Pass (8m Runway)</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#3D5855] text-base">74.0 / 100</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-[#FAF8F6] text-[#556B67] border border-[#EBDDDA] font-bold text-[10px]">
                        Waitlist Reserve
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#556B67]">#3</td>
                    <td className="py-3.5 px-3">
                      <strong className="text-[#1E2D2A] block">AquaSonic Ultrasonic Systems</strong>
                      <span className="text-[11px] text-[#556B67]">Ultrasonic Clamp-on Doppler</span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-red-700">48 / 100 (TRL 5)</td>
                    <td className="py-3.5 px-3 font-bold text-red-700">Flagged Runway</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#556B67] text-base">58.0 / 100</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-bold text-[10px]">
                        Disqualified
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Selection Sign-off Box */}
            <div className="p-6 bg-[#FAF8F6] rounded-2xl border-2 border-[#D2B48C] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 text-[10px] font-mono font-bold">
                      MANDATORY HUMAN SIGN-OFF
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-[#1E2D2A]">
                    Empaneled Evaluator Award Memo Sign-Off
                  </h3>
                  <p className="text-xs text-[#556B67] font-medium">
                    Signs and mints the initial <strong>Procurement Readiness Passport</strong> (#MH-EP-2025-WTR-0042) in <code>IN_PROGRESS</code> status.
                  </p>
                </div>

                {signOffDone ? (
                  <div className="p-3 bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/50 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#2F4541] shrink-0" />
                    <span>Signed: RSA-4096 Timestamped</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignOff}
                    className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authorize Award & Mint Passport</span>
                  </button>
                )}
              </div>
            </div>

            {/* Back to Tab 1 / Go to Pilot CTA */}
            <div className="pt-4 border-t border-[#EBDDDA]/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchSubTab("gate2")}
                className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ← Back to Gate 2
              </button>

              <Link
                href="/pilot"
                className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <span>Proceed to Tab 4 (Pilots & Decision)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default function EvaluationHubPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#3D5855]">Loading Evaluation Hub...</div>}>
      <EvaluationHubContent />
    </React.Suspense>
  );
}
