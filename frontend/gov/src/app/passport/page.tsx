"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { puneWaterPilot } from "@/data/mockData";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  Download,
  Building2,
  MapPin,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  Award,
  ArrowRight,
  ArrowLeft,
  Check,
  Key,
  ChevronDown,
  Lock,
  ExternalLink,
  Scale,
  FileCheck,
  Hash,
  UserCheck,
  AlertTriangle,
  FolderArchive,
  BookOpen
} from "lucide-react";

function ProcurementReadinessPassportContent() {
  const searchParams = useSearchParams();
  const p = puneWaterPilot;

  // 4 Canonical Sub-Tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2 (Tab 6)
  type SubTabId = "unified" | "kpis" | "conditions" | "compliance";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("unified");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["unified", "kpis", "conditions", "compliance"].includes(tabParam)
      ? tabParam
      : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["unified", "kpis", "conditions", "compliance"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  // Selected Passport Record
  const [selectedPassportId, setSelectedPassportId] = useState("MH-PRP-2025-WTR-0042");

  const subTabs = [
    {
      id: "unified",
      label: "Unified Passport Record",
      shortLabel: "Unified Passport",
      badge: "Status: READY",
      desc: "Master credential record with running readiness status and post-pilot decision",
    },
    {
      id: "kpis",
      label: "Audited KPIs & Baseline Deltas",
      shortLabel: "Audited KPIs",
      badge: "4 Verified KPIs",
      desc: "Baseline vs. achieved field outcomes with independent academic validator signature",
    },
    {
      id: "conditions",
      label: "Operational, Data & IP Conditions",
      shortLabel: "Conditions & IP",
      badge: "Boundary Envelope",
      desc: "Implementation conditions, cybersecurity checks, data requirements, and IP firewall",
    },
    {
      id: "compliance",
      label: "Compliance Documentation Bundle",
      shortLabel: "Compliance Bundle",
      badge: "Reference Bundle",
      desc: "Pre-compiled reference bundle for the Procurement Authority's compliance filing",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* 1. SLIM BREADCRUMB (Per v4 interaction pattern) */}
      <div className="flex items-center justify-between text-xs border-b border-[#EBDDDA] pb-3 font-mono print:hidden">
        <div className="flex items-center gap-2 text-[#556B67]">
          <Link href="/" className="hover:text-[#1E2D2A] font-semibold transition-colors">
            ProcSync
          </Link>
          <span>/</span>
          <span className="text-[#3D5855] font-bold">Readiness Passports</span>
          <span>/</span>
          <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
            {subTabs.find((t) => t.id === activeSubTab)?.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#556B67] hidden sm:inline">Registry Credential:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold">
            {selectedPassportId}
          </span>
        </div>
      </div>

      {/* 2. HERO & MASTER PASSPORT HEADER */}
      <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] text-xs font-mono font-bold uppercase tracking-wider border border-[#D2B48C]/40">
                DPI MODULE 6 • UNIFIED PROCUREMENT READINESS PASSPORT
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#1E2D2A] tracking-tight flex flex-wrap items-center gap-3">
              <span>Procurement Readiness Passport</span>
              <span className="text-xs font-bold px-3 py-1 bg-[#BFCACC]/25 text-[#2F4541] rounded-full border border-[#BFCACC]/40 font-mono">
                READINESS: READY
              </span>
            </h1>

            <p className="text-[#3D5855] text-sm sm:text-base font-medium mt-1 max-w-3xl leading-relaxed">
              Single unified master credential. Encapsulates empirical field evidence, audited baseline deltas, operating boundaries, and post-pilot decisions to enable safe procurement and statewide replication without re-running pilots.
            </p>
          </div>

          {/* Action Controls & Passport Switcher */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white border-2 border-[#EBDDDA] text-[#1E2D2A] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#4B7069]" />
                <span>Print Official Credential</span>
              </button>

              <Link
                href="/replication"
                className="px-4 py-2 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-colors shadow-2xs flex items-center gap-2"
              >
                <span>Replicate in Workbench (Tab 5)</span>
                <ArrowRight className="w-4 h-4 text-[#BFCACC]" />
              </Link>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF8F6] p-1 rounded-xl border border-[#EBDDDA] text-xs font-mono">
              <button
                onClick={() => setSelectedPassportId("MH-PRP-2025-WTR-0042")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPassportId === "MH-PRP-2025-WTR-0042"
                    ? "bg-[#2F4541] text-white shadow-2xs"
                    : "text-[#3D5855] hover:text-[#1E2D2A]"
                }`}
              >
                AcoustiLeak (Water)
              </button>
              <button
                onClick={() => setSelectedPassportId("MH-PRP-2025-AGR-0019")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPassportId === "MH-PRP-2025-AGR-0019"
                    ? "bg-[#2F4541] text-white shadow-2xs"
                    : "text-[#3D5855] hover:text-[#1E2D2A]"
                }`}
              >
                AgriScan AI (Mandi)
              </button>
            </div>
          </div>
        </div>

        {/* 3. HORIZONTAL SUB-TAB SWITCHER (v4 Full-width pattern) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-[#EBDDDA] pt-5 scrollbar-thin print:hidden">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/passport?tab=${tab.id}`}
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
      {/* SUB-TAB 1: UNIFIED PASSPORT RECORD (§11)                                  */}
      {/* ========================================================================= */}
      {activeSubTab === "unified" && (
        <div className="space-y-6">
          {/* Master Record Meta Card */}
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA]/70 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-[#556B67] uppercase">OFFICIAL MASTER RECORD</span>
                  <span className="text-[#EBDDDA]">•</span>
                  <span className="text-xs font-mono font-bold text-[#2F4541] bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
                    {selectedPassportId}
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1E2D2A]">
                  {p.problemStatement}
                </h2>
                <div className="text-xs text-[#556B67] font-semibold mt-1 flex flex-wrap gap-4">
                  <span><strong>Startup:</strong> {p.startupName}</span>
                  <span><strong>DPIIT:</strong> {p.dpiitId}</span>
                  <span><strong>Origin:</strong> Pune Municipal Corporation (PMC)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#BFCACC] text-right">
                  <span className="text-[10px] font-mono font-bold text-[#2F4541] uppercase block">Running Status</span>
                  <span className="text-base font-black text-[#2F4541] font-mono">READY</span>
                </div>
                <div className="p-3 bg-[#2F4541] rounded-xl text-right text-white">
                  <span className="text-[10px] font-mono font-bold text-[#BFCACC] uppercase block">Decision</span>
                  <span className="text-base font-black text-[#D2B48C] font-mono">SCALE</span>
                </div>
              </div>
            </div>

            {/* Core Entity Grid (§11) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Post-Pilot Procurement Route</span>
                <span className="text-sm font-black text-[#1E2D2A] block">Direct Procurement</span>
                <span className="text-xs text-[#556B67] font-mono block">Rule 166 GFR Innovation Quota</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Unit Rate Benchmark</span>
                <span className="text-sm font-black text-[#2F4541] block">₹28,000 / km</span>
                <span className="text-xs text-[#556B67] font-medium block">80.7% cheaper than manual</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Evaluator Institution</span>
                <span className="text-sm font-black text-[#1E2D2A] block">COEP Technological Univ.</span>
                <span className="text-xs text-[#556B67] font-medium block">Dr. Vidya Joshi (Hydraulics)</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Cryptographic Seal</span>
                <span className="text-xs font-mono font-bold text-[#1E2D2A] truncate block">SHA256: 7F4B0E891C3E...</span>
                <span className="text-xs text-[#2F4541] font-bold block">Audited &amp; Sealed</span>
              </div>
            </div>

            {/* Problem & Baseline vs Target */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-2">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Challenge Baseline Context</span>
                <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                  {p.problemStatement}
                </p>
                <div className="pt-2 border-t border-[#EBDDDA] text-xs text-[#556B67] font-mono">
                  <strong>Baseline Metric:</strong> {p.baselineMetric}
                </div>
              </div>

              <div className="p-5 rounded-xl border-2 border-[#D2B48C] bg-[#FAF8F6] space-y-2">
                <span className="text-xs font-bold text-[#856441] uppercase block">Target Outcome &amp; Scope</span>
                <p className="text-xs text-[#1E2D2A] leading-relaxed font-medium">
                  {p.targetOutcome}
                </p>
                <div className="pt-2 border-t border-[#D2B48C]/40 text-xs text-[#856441] font-mono">
                  <strong>Total Pilot Footprint:</strong> 120 km cast-iron pipeline network
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]/70 print:hidden">
              <span className="text-xs text-[#556B67] font-medium">
                Master record indexed for statewide replication matching.
              </span>

              <button
                onClick={() => setActiveSubTab("kpis")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View Audited KPIs &amp; Deltas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: AUDITED KPIS & BASELINE DELTAS (§11, STEP 20)                  */}
      {/* ========================================================================= */}
      {activeSubTab === "kpis" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA]/70 pb-4">
              <div>
                <h2 className="text-xl font-black text-[#1E2D2A]">
                  Audited Performance KPIs &amp; Baseline Deltas
                </h2>
                <p className="text-sm text-[#556B67] font-medium mt-0.5">
                  Empirically measured outcomes verified against pre-pilot municipal baseline by COEP Technological University.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#BFCACC]/25 text-[#2F4541] font-mono text-xs rounded-full font-bold border border-[#BFCACC]/40">
                100% Third-Party Audited
              </span>
            </div>

            {/* KPI Delta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {p.observedResults.map((res, idx) => (
                <div key={idx} className="p-5 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#556B67] uppercase">KPI {idx + 1}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/50">
                      VERIFIED
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#1E2D2A]">{res.kpi}</h3>
                  <div className="pt-2 border-t border-[#EBDDDA] space-y-1 text-xs">
                    <div className="text-[#556B67]">Baseline: <span className="text-[#1E2D2A] font-medium">{res.baseline}</span></div>
                    <div className="text-[#1E2D2A] font-bold">Achieved: <span className="text-[#2F4541]">{res.achieved}</span></div>
                    <div className="text-[#2F4541] font-black font-mono text-sm pt-1">{res.delta}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Economic Unit Rate Comparison */}
            <div className="p-6 rounded-2xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBDDDA] pb-3">
                <div>
                  <h3 className="text-base font-black text-[#1E2D2A]">Economic Unit Rate Feasibility</h3>
                  <p className="text-xs text-[#556B67] font-medium">
                    Pre-negotiated ceiling tariff established through audited pilot cost economics.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#2F4541] bg-white px-3 py-1 rounded-lg border border-[#EBDDDA]">
                  {p.costEconomics.savingsPct}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#EBDDDA]">
                  <span className="text-xs uppercase font-bold text-[#556B67] block">Audited Unit Rate</span>
                  <span className="text-2xl font-black text-[#2F4541] font-mono mt-1 block">
                    {p.costEconomics.unitCost}
                  </span>
                  <span className="text-xs text-[#556B67] mt-1 block">Surveyed with acoustic sensor correlation</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#EBDDDA]">
                  <span className="text-xs uppercase font-bold text-[#556B67] block">Traditional Benchmark</span>
                  <span className="text-2xl font-black text-[#856441] font-mono mt-1 block">
                    {p.costEconomics.traditionalBenchmark}
                  </span>
                  <span className="text-xs text-[#556B67] mt-1 block">Manual trench excavation &amp; listening sticks</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#EBDDDA]">
                  <span className="text-xs uppercase font-bold text-[#556B67] block">Total Pilot Expenditure</span>
                  <span className="text-2xl font-black text-[#1E2D2A] font-mono mt-1 block">
                    {p.costEconomics.totalPilotCost}
                  </span>
                  <span className="text-xs text-[#556B67] mt-1 block">100% Escrow Sandbox Settled</span>
                </div>
              </div>
            </div>

            {/* Evaluator Seal Card */}
            <div className="p-5 rounded-xl border border-[#D2B48C] bg-[#FAF8F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2F4541] text-white flex items-center justify-center font-bold shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[#856441] uppercase tracking-wider block">
                    INDEPENDENT ACADEMIC AUDITOR
                  </span>
                  <h4 className="text-sm font-bold text-[#1E2D2A]">
                    {p.evaluator.name} • {p.evaluator.designation}
                  </h4>
                  <span className="text-xs text-[#556B67] font-medium">
                    {p.evaluator.institution} • Signed on {p.evaluator.verifiedDate}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-[#556B67] block">Audit Digest:</span>
                <code className="text-xs font-mono font-bold text-[#2F4541]">{p.evaluator.digitalSignatureHash}</code>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]/70 print:hidden">
              <button
                onClick={() => setActiveSubTab("unified")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Unified Record</span>
              </button>

              <button
                onClick={() => setActiveSubTab("conditions")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View Operational &amp; IP Conditions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: OPERATIONAL, DATA & IP CONDITIONS (§11)                        */}
      {/* ========================================================================= */}
      {activeSubTab === "conditions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Operational Envelope, Cybersecurity &amp; IP Conditions
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Clear boundaries preventing inappropriate replication and safeguarding intellectual property rights.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] font-mono text-xs rounded-lg font-bold">
                Operating Envelope Defined
              </span>
            </div>

            {/* Operating Environmental Limits */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                1. Implementation &amp; Physical Operating Envelope
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-xs font-bold text-[#3D5855] uppercase block">Hydrostatic Pressure</span>
                  <span className="text-sm font-bold text-[#2F4541] block">{p.implementationConditions.waterPressure}</span>
                  <span className="text-xs text-[#3D5855] font-medium block">Upper surge limit: 6.0 Bar</span>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-xs font-bold text-[#3D5855] uppercase block">Soil Strata Tested</span>
                  <span className="text-sm font-bold text-[#2F4541] block">{p.implementationConditions.soilType}</span>
                  <span className="text-xs text-[#3D5855] font-medium block">Seismic velocity: 3,100 m/s</span>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-xs font-bold text-[#3D5855] uppercase block">Network Connectivity</span>
                  <span className="text-sm font-bold text-[#2F4541] block">{p.implementationConditions.networkConnectivity}</span>
                  <span className="text-xs text-[#3D5855] font-medium block">Offline store-and-forward supported</span>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-xs font-bold text-[#3D5855] uppercase block">Power Autonomy</span>
                  <span className="text-sm font-bold text-[#2F4541] block">{p.implementationConditions.powerAvailability}</span>
                  <span className="text-xs text-[#3D5855] font-medium block">Lithium thionyl chloride pack</span>
                </div>
              </div>
            </div>

            {/* IP & Data Firewall */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                2. Data Privacy &amp; IP Ownership Firewall
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-[#BFCACC] bg-[#BFCACC]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2F4541] uppercase">Government Ownership</span>
                    <span className="text-[10px] font-mono bg-[#BFCACC] text-[#1E2D2A] px-2 py-0.5 rounded font-bold">
                      PUBLIC ASSET
                    </span>
                  </div>
                  <ul className="text-xs text-[#2F4541] space-y-1.5 list-disc pl-4 font-medium">
                    <li>All raw acoustic hydrophone audio recordings and telemetry time-series logs.</li>
                    <li>All GIS pipe coordinates, localized rupture locations, and ground excavation logs.</li>
                    <li>All municipal water flow SCADA baseline and post-remediation data.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl border border-[#D2B48C] bg-[#D2B48C]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#856441] uppercase">Startup Proprietary IP</span>
                    <span className="text-[10px] font-mono bg-[#D2B48C] text-[#856441] px-2 py-0.5 rounded font-bold">
                      PROTECTED
                    </span>
                  </div>
                  <ul className="text-xs text-[#2F4541] space-y-1.5 list-disc pl-4 font-medium">
                    <li>Edge FFT wavelet neural network architecture and feature extraction algorithms.</li>
                    <li>Sensor hardware piezoelectric transducer design and firmware microcode.</li>
                    <li>Proprietary cloud cross-correlation processing engine and model weights.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA] print:hidden">
              <button
                onClick={() => setActiveSubTab("kpis")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to KPIs</span>
              </button>

              <button
                onClick={() => setActiveSubTab("compliance")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View Compliance Bundle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: COMPLIANCE DOCUMENTATION BUNDLE (§11, STEP 20)                 */}
      {/* ========================================================================= */}
      {activeSubTab === "compliance" && (
        <div className="space-y-6">
          {/* Statutory Scope Warning Callout (§11) */}
          <div className="p-5 bg-[#2F4541] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  STATUTORY COMPLIANCE BUNDLE MANDATE
                </span>
                <p className="text-xs text-[#EBDDDA] mt-0.5 leading-relaxed font-medium">
                  <strong>Supporting reference material only:</strong> Pre-compiled for the Procurement Authority&apos;s own compliance filing. No automatic exemption, no statutory certification, and no official record status is implied without formal government authorization.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#1E2D2A] text-[#D2B48C] border border-[#D2B48C]/40 rounded-lg text-xs font-mono font-bold shrink-0">
              Reference Bundle Only
            </span>
          </div>

          {/* Compiled Bundle Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Compliance Documentation Dossier
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Package of cryptographic artifacts supporting single-source procurement justifications under GFR Rule 166.
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-colors shadow-xs flex items-center gap-2 shrink-0 print:hidden cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Complete Bundle (PDF)</span>
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "1. COEP Third-Party Hydraulic Engineering Validation Report",
                  file: "COEP_TechUniv_Report_PMC_2025_01.pdf",
                  hash: "SHA256: 7F4B0E891C3E2D879B5A104E9C230491DE",
                  desc: "Comprehensive 48-page technical verification of acoustic telemetry accuracy, wave velocity in ductile pipes, and ground excavation precision.",
                  status: "SIGNED & SEALED",
                },
                {
                  title: "2. Ground-Truth Excavation & Spatial Accuracy Joint Log",
                  file: "Ground_Excavation_Log_Panchavati_Trunk.pdf",
                  hash: "SHA256: 4D8A1C9E3B72F108A9C40217EF65BA10",
                  desc: "Joint sign-off memo between NMC Assistant Engineer and AcoustiLeak field lead documenting 1.14m physical rupture distance.",
                  status: "VERIFIED",
                },
                {
                  title: "3. CERT-In Standard Cloud Telemetry & Data Custody Certificate",
                  file: "CERT_In_Audit_AcoustiLeak_VPC_2025.pdf",
                  hash: "SHA256: 9B5A104E9C230491DE882190AC7731F2",
                  desc: "Penetration test report and VPC data isolation confirmation in compliance with Maharashtra State Cybersecurity Policy.",
                  status: "CERTIFIED",
                },
                {
                  title: "4. GFR Rule 166 Innovation Single-Source Justification Note",
                  file: "GFR_166_Single_Source_Justification_Template.pdf",
                  hash: "SHA256: 104E9C230491DE882190AC7731F27F4B",
                  desc: "Pre-filled procurement justification citing audited baseline outcomes and unit rate savings (₹28,000/km).",
                  status: "READY FOR FILING",
                },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2F4541] shrink-0" />
                      <h4 className="text-xs font-bold text-[#2F4541]">{doc.title}</h4>
                    </div>
                    <p className="text-xs text-[#3D5855] font-medium">{doc.desc}</p>
                    <div className="text-[11px] font-mono text-[#3D5855]">
                      File: <code>{doc.file}</code> • Hash: <code>{doc.hash}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 bg-[#BFCACC]/30 text-[#2F4541] rounded-full font-mono text-[10px] font-bold border border-[#BFCACC]/60">
                      {doc.status}
                    </span>
                    <button
                      onClick={handlePrint}
                      className="p-2 bg-white rounded-lg border border-[#EBDDDA] hover:bg-[#FAF8F6] text-[#2F4541] transition-colors print:hidden cursor-pointer"
                      title="Download document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA] print:hidden">
              <button
                onClick={() => setActiveSubTab("conditions")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Conditions</span>
              </button>

              <Link
                href="/replication"
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Replicate in Another Department (Tab 5) →</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProcurementReadinessPassportPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#3D5855]">Loading Procurement Readiness Passport...</div>}>
      <ProcurementReadinessPassportContent />
    </React.Suspense>
  );
}
