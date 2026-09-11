"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Sparkles,
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Check,
  Info,
  Layers,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Repeat,
  FileText,
  Lock,
  ExternalLink,
  Sliders,
  Scale,
  Zap,
  BookOpen,
  Loader2
} from "lucide-react";

// Shape returned by /api/evidence-check (Gemini Zero-Duplication Engine)
interface EvidenceCheckResult {
  matchFound: boolean;
  confidence: number;
  matchedPilotId: string;
  matchedDepartment: string;
  matchedTitle: string;
  matchedSummary: string;
  provenOutcome: string;
  potentialSavingsInr: string;
  recommendation: string;
  reasoning: string;
}

// Shape returned by /api/startup-discovery (web-scan + AI ranking)
interface DiscoveryResult {
  startups: {
    name: string;
    website: string;
    source: string;
    sector: string;
    relevance: number;
    reason: string;
    dpiitLikely: boolean;
  }[];
  queriesRun: string[];
  pagesScanned: number;
  note?: string;
}

function ChallengeBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentRole } = useApp();

  // Tab 2 Sub-tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2
  type SubTabId = "problem" | "evidence_check" | "startup_discovery" | "eligibility" | "templates";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("problem");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["problem", "evidence_check", "startup_discovery", "eligibility", "templates"].includes(tabParam) ? tabParam : defaultSubTab
  );

  // Sync sub-tab from query parameter (e.g. from navbar dropdown ?tab=evidence_check)
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["problem", "evidence_check", "startup_discovery", "eligibility", "templates"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/challenge?tab=${tab}`, { scroll: false });
  };

  // Form State
  const [department, setDepartment] = useState("Nashik Municipal Corporation (NMC)");
  const [ward, setWard] = useState("Panchavati & CIDCO Water Supply Division");
  const [sector, setSector] = useState("Smart Water & Urban Distribution");
  const [problemDescription, setProblemDescription] = useState(
    "Sub-surface drinking water leakage in elevated reservoir distribution pipelines causing 32% Non-Revenue Water loss."
  );

  const [baselineMetric, setBaselineMetric] = useState("32% NRW loss; 40+ hours manual leak detection per rupture");
  const [targetOutcome, setTargetOutcome] = useState("Reduce NRW loss to < 20%; locate pinhole leaks within 2m in < 6 hours");
  const [maxBudget, setMaxBudget] = useState("15,00,000");
  const [timelineMonths, setTimelineMonths] = useState("3 Months (Standard 90-Day Trial)");

  const [soilStrata, setSoilStrata] = useState("Deccan Basalt & Fractured Hard Rock");
  const [waterPressure, setWaterPressure] = useState("5.2 Bar (High-Head Elevated Reservoir)");
  const [networkType, setNetworkType] = useState("4G GSM / LoRaWAN Cellular");
  const [turnoverExemptionAccepted, setTurnoverExemptionAccepted] = useState(true);

  // AI Evidence Check state (live Gemini Zero-Duplication Engine)
  const [evidenceCheck, setEvidenceCheck] = useState<EvidenceCheckResult | null>(null);
  const [evidenceCheckLoading, setEvidenceCheckLoading] = useState(false);
  const [evidenceCheckError, setEvidenceCheckError] = useState<string | null>(null);

  // Startup Discovery state (live web-scan for relevant startups)
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const runStartupDiscovery = async () => {
    setDiscoveryLoading(true);
    setDiscoveryError(null);
    setDiscovery(null);
    switchSubTab("startup_discovery");
    try {
      const res = await fetch("/api/startup-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemStatement: problemDescription,
          department,
          sector,
          location: ward,
          targetOutcome,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Startup discovery failed");
      setDiscovery(data.result);
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : "Startup discovery failed");
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const runEvidenceCheck = async () => {
    setEvidenceCheckLoading(true);
    setEvidenceCheckError(null);
    setEvidenceCheck(null);
    switchSubTab("evidence_check");
    try {
      const res = await fetch("/api/evidence-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemStatement: `${problemDescription} Baseline: ${baselineMetric}. Target: ${targetOutcome}. Terrain: ${soilStrata}, ${waterPressure}.`,
          department,
          location: ward,
          baselineMetric,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evidence check failed");
      setEvidenceCheck(data.result);
    } catch (err) {
      setEvidenceCheckError(err instanceof Error ? err.message : "Evidence check failed");
    } finally {
      setEvidenceCheckLoading(false);
    }
  };

  // Demo Presets for SIH Jury
  const applyPreset = (type: "water" | "mandi" | "energy") => {
    if (type === "water") {
      setDepartment("Nashik Municipal Corporation (NMC)");
      setWard("Panchavati & CIDCO Water Supply Division");
      setSector("Smart Water & Urban Infrastructure");
      setProblemDescription(
        "Sub-surface drinking water leakage in elevated reservoir distribution pipelines causing 32% Non-Revenue Water loss."
      );
      setBaselineMetric("32% NRW loss; 40+ hours manual leak detection per rupture");
      setTargetOutcome("Reduce NRW loss to < 20%; locate pinhole leaks within 2m in < 6 hours");
      setSoilStrata("Deccan Basalt & Fractured Hard Rock");
      setWaterPressure("5.2 Bar (High-Head Elevated Reservoir)");
      setNetworkType("4G GSM / LoRaWAN Cellular");
      setMaxBudget("15,00,000");
    } else if (type === "mandi") {
      setDepartment("Maharashtra State Agricultural Marketing Board (MSAMB)");
      setWard("Nagpur Central APMC Mandi");
      setSector("Agri-Tech & Mandi Modernization");
      setProblemDescription("Manual subjective grain quality assaying causing 4-hour queue delays for arriving soybean farmers.");
      setBaselineMetric("4.5 hours manual inspection per truck; 15% assay variance");
      setTargetOutcome("Automate grain moisture & foreign matter assay in < 3 minutes with > 95% lab correlation");
      setSoilStrata("Covered Concrete Mandi Shed");
      setWaterPressure("Not Applicable");
      setNetworkType("On-Premise Wi-Fi & 4G");
      setMaxBudget("8,00,000");
    } else {
      setDepartment("Thane Municipal Corporation (TMC)");
      setWard("Bhayandar Water Pumping Station");
      setSector("Municipal Energy Optimization");
      setProblemDescription("High peak-hour power consumption in heavy lift raw water pumping stations without dynamic VFD scheduling.");
      setBaselineMetric("₹45 Lakhs / month pumping power bill; static unoptimized pump speeds");
      setTargetOutcome("Reduce pumping electricity consumption by 15% through IoT-triggered dynamic variable frequency drives");
      setSoilStrata("Pumping Station Pumphouse Slab");
      setWaterPressure("4.8 Bar Operating Head");
      setNetworkType("Industrial Modbus / 4G Gateway");
      setMaxBudget("12,00,000");
    }
  };

  const subTabs = [
    {
      id: "problem",
      label: "Problem & Baseline Definition",
      shortLabel: "Problem Definition",
      badge: "Outcome-Based",
    },
    {
      id: "evidence_check",
      label: "Historical Evidence Check",
      shortLabel: "Pre-Publish Check",
      badge: "1 Match Found",
    },
    {
      id: "startup_discovery",
      label: "Startup Discovery Scan",
      shortLabel: "Discovery",
      badge: "Live Web",
    },
    {
      id: "eligibility",
      label: "Eligibility & Risk-Equivalent Criteria",
      shortLabel: "Risk-Equivalent",
      badge: "GFR 149 Safe Harbor",
    },
    {
      id: "templates",
      label: "Template Library Selection",
      shortLabel: "Legal Templates",
      badge: "5 Approved",
    },
  ];

  return (
    <div className="space-y-8 py-4 w-full">
      
      {/* ========================================================================= */}
      {/* PAGE HEADER & BREADCRUMB                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Slim Persistent Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[#556B67]">
            <Link href="/" className="font-bold text-[#1E2D2A] hover:underline">
              ProcSync
            </Link>
            <span>/</span>
            <span>Challenge Builder</span>
            <span>/</span>
            <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
              {subTabs.find((t) => t.id === activeSubTab)?.shortLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#556B67]">
            <span>Active Step:</span>
            <strong className="text-[#1E2D2A]">{subTabs.find((t) => t.id === activeSubTab)?.label}</strong>
          </div>
        </div>

        {/* Page Title & Subtitle Card */}
        <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] font-mono text-[10px] font-bold border border-[#D2B48C]/40">
                OUTCOME FORMULATION ENGINE
              </span>
              <span className="text-[#EBDDDA] text-xs">•</span>
              <span className="text-xs text-[#556B67] font-mono">
                Zero-Duplication Protocol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E2D2A] tracking-tight">
              Challenge & Procurement Builder
            </h1>
            <p className="text-xs sm:text-sm text-[#3D5855] font-medium max-w-3xl leading-relaxed">
              Define challenges through measurable baseline metrics and outcome KPIs rather than rigid vendor specifications. 
              Before publishing, the system verifies whether another department has already generated validated evidence.
            </p>
          </div>

          {/* Quick Preset Buttons for SIH Jury Demonstration */}
          <div className="bg-[#FAF8F6] p-3 rounded-2xl border border-[#EBDDDA] space-y-2 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase text-[#556B67] block text-center">
              ⚡ Quick Jury Scenarios
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset("water")}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#EBDDDA] hover:border-[#D2B48C] text-xs font-bold text-[#1E2D2A] text-left transition-colors flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
              >
                <span>Nashik Water Leakage</span>
                <span className="text-[9px] font-mono text-[#2F4541] bg-[#BFCACC]/20 px-1.5 py-0.2 rounded font-bold border border-[#BFCACC]/40">Active</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("mandi")}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#EBDDDA] hover:border-[#D2B48C] text-xs font-bold text-[#1E2D2A] text-left transition-colors flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
              >
                <span>Nagpur Mandi Assaying</span>
                <span className="text-[9px] font-mono text-[#556B67]">Agri</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("energy")}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#EBDDDA] hover:border-[#D2B48C] text-xs font-bold text-[#1E2D2A] text-left transition-colors flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
              >
                <span>Thane Pump Station VFD</span>
                <span className="text-[9px] font-mono text-[#556B67]">Energy</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. FULL WIDTH WORKSPACE (Sub-Tab Content Panels)                          */}
      {/* ========================================================================= */}
      <div className="space-y-6">

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 1: PROBLEM & BASELINE DEFINITION                                */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "problem" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4">
              <h2 className="text-xl font-black text-[#1E2D2A]">
                1. Outcome Problem Definition & Operational Baselines
              </h2>
              <p className="text-xs text-[#556B67] font-medium mt-1">
                State government departments must define the target result rather than specifying proprietary technology names.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Municipal Department / Urban Local Body:
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Jurisdiction Ward / Geographic Zone:
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Outcome-Based Problem Statement:
                </label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-medium text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Current Baseline Metric (Measurable Starting Condition):
                </label>
                <input
                  type="text"
                  value={baselineMetric}
                  onChange={(e) => setBaselineMetric(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                />
                <span className="text-[11px] text-[#556B67] font-medium">e.g. Current measured water loss percentage or queue delay</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Target Outcome KPI (Expected Impact Threshold):
                </label>
                <input
                  type="text"
                  value={targetOutcome}
                  onChange={(e) => setTargetOutcome(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                />
                <span className="text-[11px] text-[#556B67] font-medium">Must be quantifiable and objectively auditable</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Sandbox Trial Budget:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-[#556B67]">₹</span>
                  <input
                    type="text"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-mono font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Trial Duration:
                </label>
                <select
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                >
                  <option value="3 Months (Standard 90-Day Trial)">3 Months (Standard 90-Day Sandbox)</option>
                  <option value="25 Days (Adapted Fast-Track)">25 Days (Adapted Fast-Track via Evidence Reuse)</option>
                  <option value="45 Days (Mid-Scale Trial)">45 Days (Mid-Scale Proving Trial)</option>
                </select>
              </div>

            </div>

            {/* Local Physical & Environmental Constraints */}
            <div className="pt-6 border-t border-[#EBDDDA]/70 space-y-4">
              <h3 className="text-sm font-black text-[#1E2D2A] uppercase tracking-wider">
                Physical, Environmental & Infrastructure Constraints
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#2F4541] block">Sub-Surface / Soil Strata:</label>
                  <input
                    type="text"
                    value={soilStrata}
                    onChange={(e) => setSoilStrata(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-medium text-[#1E2D2A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#2F4541] block">Operating Pressure / Load:</label>
                  <input
                    type="text"
                    value={waterPressure}
                    onChange={(e) => setWaterPressure(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-medium text-[#1E2D2A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#2F4541] block">Telemetry Network Connectivity:</label>
                  <input
                    type="text"
                    value={networkType}
                    onChange={(e) => setNetworkType(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-medium text-[#1E2D2A]"
                  />
                </div>
              </div>
            </div>

            {/* Next Step Action Bar */}
            <div className="pt-4 border-t border-[#EBDDDA]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#556B67]">
                <Info className="w-4 h-4 text-[#2F4541] shrink-0" />
                <span>Next: System will run a Pre-Publication Check to prevent duplicate public spending.</span>
              </div>

              <button
                type="button"
                onClick={runEvidenceCheck}
                disabled={evidenceCheckLoading}
                className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 ${
                  evidenceCheckLoading
                    ? "bg-[#4B7069] text-white cursor-wait"
                    : "bg-[#2F4541] hover:bg-[#1E2D2A] text-white cursor-pointer"
                }`}
              >
                {evidenceCheckLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Scanning Registry…</span>
                  </>
                ) : (
                  <>
                    <span>Run Historical Evidence Check</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 2: HISTORICAL EVIDENCE CHECK (ZERO-DUPLICATION ENGINE)          */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "evidence_check" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">

            <div className="border-b border-[#EBDDDA]/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 text-xs font-mono font-bold">
                    PRE-PUBLICATION ZERO-DUPLICATION CHECK
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                  {evidenceCheckLoading
                    ? "AI Scanning Maharashtra Evidence Registry…"
                    : evidenceCheck
                    ? evidenceCheck.matchFound
                      ? "Historical Evidence Match Found in Maharashtra Registry"
                      : "No Matching Evidence Passport — Safe to Publish"
                    : "Run the Pre-Publication Evidence Check"}
                </h2>
              </div>
              {evidenceCheck?.matchFound && (
                <span className="text-xs font-mono font-black text-[#2F4541] bg-[#BFCACC]/25 border border-[#BFCACC]/50 px-3 py-1 rounded-full">
                  {evidenceCheck.potentialSavingsInr} Potential Savings
                </span>
              )}
            </div>

            {/* Loading State */}
            {evidenceCheckLoading && (
              <div className="p-10 rounded-2xl border-2 border-dashed border-[#BFCACC] bg-[#FAF8F6] flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 text-[#4B7069] animate-spin" />
                <p className="text-sm font-bold text-[#2F4541]">
                  The AI engine is comparing your challenge against finalized Evidence Passports…
                </p>
                <p className="text-xs text-[#556B67] font-medium max-w-md">
                  Matching problem semantics, technology applicability, and terrain context to prevent duplicate pilot spend.
                </p>
              </div>
            )}

            {/* Error State */}
            {evidenceCheckError && (
              <div className="p-6 rounded-2xl border-2 border-[#856441]/50 bg-[#F7EFE5] space-y-3" role="alert">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#856441]" />
                  <span className="text-sm font-black text-[#856441]">AI Evidence Check Unavailable</span>
                </div>
                <p className="text-xs text-[#856441] font-medium leading-relaxed">{evidenceCheckError}</p>
                <button
                  type="button"
                  onClick={runEvidenceCheck}
                  className="px-4 py-2 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Retry AI Check
                </button>
              </div>
            )}

            {/* Empty State */}
            {!evidenceCheckLoading && !evidenceCheck && !evidenceCheckError && (
              <div className="p-10 rounded-2xl border-2 border-dashed border-[#BFCACC] bg-[#FAF8F6] flex flex-col items-center justify-center gap-3 text-center">
                <Search className="w-8 h-8 text-[#4B7069]" />
                <p className="text-sm font-bold text-[#2F4541]">
                  The Zero-Duplication Engine has not been run for this challenge yet.
                </p>
                <button
                  type="button"
                  onClick={runEvidenceCheck}
                  className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#D2B48C]" />
                  <span>Run AI Evidence Check Now</span>
                </button>
              </div>
            )}

            {/* AI Result — Match Found */}
            {evidenceCheck?.matchFound && (
              <div className="p-6 bg-gradient-to-r from-[#FAF8F6] via-white to-[#F0F4F5] rounded-2xl border-2 border-[#BFCACC] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#556B67]">
                        {evidenceCheck.matchedPilotId} • {evidenceCheck.matchedDepartment}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#2F4541] text-white text-[10px] font-bold">
                        COEP Audited Passport
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#1E2D2A]">
                      {evidenceCheck.matchedTitle}
                    </h3>
                    <p className="text-xs text-[#3D5855] font-medium max-w-2xl leading-relaxed">
                      {evidenceCheck.matchedSummary}
                    </p>
                    <p className="text-xs text-[#4B7069] font-bold font-mono mt-1">
                      Proven outcome: {evidenceCheck.provenOutcome}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#556B67] block">Context Match:</span>
                    <span className="text-3xl font-mono font-black text-[#2F4541]">
                      {evidenceCheck.confidence}%
                    </span>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="p-4 bg-white rounded-xl border border-[#EBDDDA]">
                  <span className="text-[10px] font-mono uppercase font-black text-[#4B7069] tracking-wider block mb-1">
                    AI Reasoning
                  </span>
                  <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                    {evidenceCheck.reasoning}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/50">
                    RECOMMENDATION: {evidenceCheck.recommendation}
                  </span>
                </div>

                {/* Comparison: Replicate vs Re-Piloting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                  <div className="p-4 bg-white rounded-xl border border-[#EBDDDA] space-y-2">
                    <span className="text-xs font-bold text-red-700 block flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Traditional Blind Re-Piloting (Wasteful):</span>
                    </span>
                    <ul className="text-xs text-[#556B67] space-y-1 list-disc pl-4 font-medium">
                      <li>Repeats full 90-day baseline testing from scratch</li>
                      <li>Consumes <strong>₹{maxBudget}</strong> from municipal trial budget</li>
                      <li>6 months procurement delay awaiting fresh evaluation</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-[#FAF8F6] rounded-xl border-2 border-[#D2B48C] space-y-2">
                    <span className="text-xs font-bold text-[#856441] block flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#856441]" />
                      <span>ProcSync Evidence Reuse (Recommended):</span>
                    </span>
                    <ul className="text-xs text-[#1E2D2A] space-y-1 list-disc pl-4 font-medium">
                      <li>Reuses proven algorithms and safety certificates from {evidenceCheck.matchedPilotId}</li>
                      <li>Truncates trial to a <strong>25-Day Fast-Track Revalidation</strong></li>
                      <li>Saves <strong>{evidenceCheck.potentialSavingsInr}</strong> in municipal taxpayer funds</li>
                    </ul>
                  </div>

                </div>

                {/* Decision Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Link
                    href="/replication"
                    className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <Repeat className="w-4 h-4" />
                    <span>Switch to Replication Workbench (Core USP)</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => switchSubTab("eligibility")}
                    className="px-5 py-2.5 bg-white hover:bg-[#FAF8F6] border border-[#EBDDDA] text-[#1E2D2A] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Proceed with New Challenge Anyway →
                  </button>
                </div>
              </div>
            )}

            {/* AI Result — No Match */}
            {evidenceCheck && !evidenceCheck.matchFound && (
              <div className="p-6 bg-[#EBF1F0] rounded-2xl border-2 border-[#4B7069] space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#4B7069] shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-[#1E2D2A]">
                      No duplicate spend detected — this challenge is novel for the registry.
                    </h3>
                    <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                      {evidenceCheck.reasoning}
                    </p>
                    <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/50">
                      RECOMMENDATION: {evidenceCheck.recommendation}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => switchSubTab("eligibility")}
                  className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Proceed to Eligibility &amp; Risk-Equivalent Criteria →
                </button>
              </div>
            )}

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 2b: STARTUP DISCOVERY SCAN (LIVE WEB)                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "startup_discovery" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">

            <div className="border-b border-[#EBDDDA]/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 text-xs font-mono font-bold">
                    LIVE WEB DISCOVERY
                  </span>
                  <span className="text-xs text-[#556B67] font-mono">
                    AI queries → public web scan → ranked shortlist
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                  {discoveryLoading
                    ? "Scanning the public web for relevant startups…"
                    : discovery
                    ? `${discovery.startups.length} Relevant Startups Discovered`
                    : "Discover Relevant Startups for This Challenge"}
                </h2>
                <p className="text-xs text-[#556B67] font-medium mt-0.5 max-w-2xl">
                  The system generates targeted search queries from your problem statement, scans
                  startup online presence across the public web, and ranks the best matches.
                </p>
              </div>
              {discovery && (
                <span className="text-xs font-mono font-black text-[#2F4541] bg-[#BFCACC]/25 border border-[#BFCACC]/50 px-3 py-1 rounded-full shrink-0">
                  {discovery.pagesScanned} Pages Scanned
                </span>
              )}
            </div>

            {/* Loading State */}
            {discoveryLoading && (
              <div className="p-10 rounded-2xl border-2 border-dashed border-[#BFCACC] bg-[#FAF8F6] flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 text-[#4B7069] animate-spin" />
                <p className="text-sm font-bold text-[#2F4541]">
                  Searching the web for startups solving this problem…
                </p>
                <div className="text-xs text-[#556B67] font-medium max-w-md space-y-1">
                  <p>1. AI formulating targeted search queries from your challenge</p>
                  <p>2. Scanning public search results &amp; startup directories</p>
                  <p>3. Ranking findings by relevance &amp; Indian startup signals</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {discoveryError && (
              <div className="p-6 rounded-2xl border-2 border-[#856441]/50 bg-[#F7EFE5] space-y-3" role="alert">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#856441]" />
                  <span className="text-sm font-black text-[#856441]">Startup Discovery Unavailable</span>
                </div>
                <p className="text-xs text-[#856441] font-medium leading-relaxed">{discoveryError}</p>
                <button
                  type="button"
                  onClick={runStartupDiscovery}
                  className="px-4 py-2 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Retry Discovery Scan
                </button>
              </div>
            )}

            {/* Empty State */}
            {!discoveryLoading && !discovery && !discoveryError && (
              <div className="p-10 rounded-2xl border-2 border-dashed border-[#BFCACC] bg-[#FAF8F6] flex flex-col items-center justify-center gap-3 text-center">
                <Search className="w-8 h-8 text-[#4B7069]" />
                <p className="text-sm font-bold text-[#2F4541] max-w-md">
                  Run a live web scan to find Indian startups with solutions matching this challenge.
                </p>
                <button
                  type="button"
                  onClick={runStartupDiscovery}
                  className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#D2B48C]" />
                  <span>Run Discovery Scan</span>
                </button>
              </div>
            )}

            {/* Results */}
            {discovery && (
              <div className="space-y-5">

                {/* Queries transparency panel */}
                <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA]">
                  <span className="text-[10px] font-mono uppercase font-black text-[#4B7069] tracking-wider block mb-2">
                    Search Queries Executed
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {discovery.queriesRun?.map((q, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white border border-[#EBDDDA] text-[#3D5855]"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>

                {discovery.note && (
                  <p className="text-xs text-[#856441] font-bold">{discovery.note}</p>
                )}

                {/* Startup Cards */}
                {discovery.startups.length === 0 ? (
                  <p className="text-xs text-[#556B67] font-medium">
                    No startups identified in this scan. Try refining the problem statement or run the scan again.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {discovery.startups.map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border-2 border-[#EBDDDA] bg-white p-5 space-y-3 hover:border-[#BFCACC] hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-[#1E2D2A]">{s.name}</span>
                              {s.dpiitLikely && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D2B48C]/25 text-[#856441] font-black border border-[#D2B48C]/40 uppercase">
                                  Indian Startup
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#4B7069] font-mono mt-0.5 truncate">
                              {s.website}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-bold text-[#556B67] block uppercase">Relevance</span>
                            <span className="text-2xl font-mono font-black text-[#2F4541]">{s.relevance}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[#3D5855] font-medium leading-relaxed">{s.reason}</p>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EBDDDA]/70">
                          <span className="text-[10px] text-[#556B67] font-mono">
                            Found via {s.source} • {s.sector}
                          </span>
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-[#4B7069] hover:text-[#2F4541] transition-colors inline-flex items-center gap-1"
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={runStartupDiscovery}
                    className="px-5 py-2.5 bg-white hover:bg-[#FAF8F6] border border-[#EBDDDA] text-[#1E2D2A] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Re-run Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => switchSubTab("eligibility")}
                    className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Proceed to Eligibility Criteria →
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 3: ELIGIBILITY & RISK-EQUIVALENT CRITERIA                       */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "eligibility" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 text-xs font-mono font-bold">
                  RISK-EQUIVALENT ENGINE
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                Eligibility & Risk-Equivalent Qualification Rules
              </h2>
              <p className="text-xs text-[#556B67] font-medium mt-0.5">
                Core principle: <em>"Lower the barrier, not the quality bar."</em> Deconstruct traditional procurement barriers into underlying risks and safeguards.
              </p>
            </div>

            {/* Standard Deterministic Checks */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-[#556B67] tracking-wider">
                Automated Deterministic Eligibility Checks (Mandatory)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1E2D2A] block">DPIIT Startup India</span>
                    <span className="text-[10px] text-[#556B67]">Recognized entity status</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 font-bold">Auto-Check</span>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1E2D2A] block">Maharashtra Entity</span>
                    <span className="text-[10px] text-[#556B67]">MSInS policy jurisdiction</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 font-bold">Auto-Check</span>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1E2D2A] block">Technology Maturity</span>
                    <span className="text-[10px] text-[#556B67]">TRL 6+ working prototype</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 font-bold">Gate 1 TRL</span>
                </div>
              </div>
            </div>

            {/* Risk-Equivalent Qualification Loop Box */}
            <div className="p-6 bg-[#FAF8F6] rounded-2xl border-2 border-[#EBDDDA] space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#2F4541]" />
                <h3 className="text-sm font-black text-[#1E2D2A]">
                  Deconstruction of Traditional ₹5 Cr Annual Turnover Barrier
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-red-600 block">1. Traditional Barrier</span>
                  <strong className="text-[#1E2D2A] block">₹5 Cr Turnover</strong>
                  <p className="text-[11px] text-[#556B67]">Excludes 95% of deeptech startups</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[#556B67] block">2. Underlying Risk</span>
                  <strong className="text-[#1E2D2A] block">Financial Solvency</strong>
                  <p className="text-[11px] text-[#556B67]">Risk of vendor bankruptcy mid-trial</p>
                </div>

                <div className="p-3 bg-[#F0F4F5] rounded-xl border border-[#BFCACC] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[#2F4541] block">3. Alternative Evidence</span>
                  <strong className="text-[#1E2D2A] block">Audited 12m Runway</strong>
                  <p className="text-[11px] text-[#3D5855]">Verified bank balance + private pilots</p>
                </div>

                <div className="p-3 bg-[#F7EFE5] rounded-xl border border-[#D2B48C] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[#856441] block">4. Assigned Safeguard</span>
                  <strong className="text-[#856441] block">Milestone Escrow</strong>
                  <p className="text-[11px] text-[#856441]">Funds released only after COEP audit</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#EBDDDA] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="turnoverSafeHarbor"
                    checked={turnoverExemptionAccepted}
                    onChange={(e) => setTurnoverExemptionAccepted(e.target.checked)}
                    className="w-4 h-4 accent-[#2F4541] rounded cursor-pointer"
                  />
                  <label htmlFor="turnoverSafeHarbor" className="font-bold text-[#1E2D2A] cursor-pointer">
                    Enable GFR Rule 149 Safe Harbor Exemption for Evidence Passport holders
                  </label>
                </div>
                <span className="text-[11px] font-mono text-[#856441] font-bold bg-[#D2B48C]/20 px-2 py-0.5 rounded">MSInS Approved</span>
              </div>
            </div>

            {/* Next Step Action Bar */}
            <div className="pt-4 border-t border-[#EBDDDA]/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchSubTab("evidence_check")}
                className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ← Back to Evidence Check
              </button>

              <button
                type="button"
                onClick={() => switchSubTab("templates")}
                className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Template Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SUB-TAB 4: TEMPLATE LIBRARY SELECTION                                   */}
        {/* ----------------------------------------------------------------------- */}
        {activeSubTab === "templates" && (
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
            
            <div className="border-b border-[#EBDDDA]/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/50 text-xs font-mono font-bold">
                    VERSIONED TEMPLATE LIBRARY
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                  Pre-Approved Standardized Legal & Governance Clauses
                </h2>
              </div>
              <span className="text-xs font-mono text-[#556B67]">
                Status: LegalApproved
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Standard Municipal Innovation Sandbox Pilot Agreement",
                  code: "TMPL-SBX-2024-v2.4",
                  desc: "Defines milestone escrow payout terms, sandbox testing zone liability waiver, and termination conditions.",
                  tag: "Pilot Agreement",
                  checked: true,
                },
                {
                  title: "Zero-IP-Leakage Startup Model Custody Clause",
                  code: "TMPL-IP-2024-v1.8",
                  desc: "Guarantees 100% startup ownership of machine learning model weights, sensor circuit schematics, and source code.",
                  tag: "IP Protection",
                  checked: true,
                },
                {
                  title: "CERT-In Sovereign Cloud & Municipal Data Residency Protocol",
                  code: "TMPL-DAT-2024-v2.0",
                  desc: "Mandates that raw sensor packets and SCADA telemetry must be hosted within sovereign Indian cloud VPCs in Maharashtra.",
                  tag: "Cybersecurity",
                  checked: true,
                },
                {
                  title: "Independent Academic Evaluator Terms (COEP / VJTI / VNIT)",
                  code: "TMPL-EVAL-2024-v1.5",
                  desc: "Authorizes state technological universities to conduct FFT spectral verification and submit tamper-evident audit verdicts.",
                  tag: "Evaluation Rubric",
                  checked: true,
                },
                {
                  title: "GFR Rule 149 Safe Harbor Statutory Exemption Affidavit",
                  code: "TMPL-GFR-2024-v3.1",
                  desc: "Statutory affidavit indemnifying municipal procurement officers against CAG audit objections for startup waivers.",
                  tag: "Procurement Safe Harbor",
                  checked: true,
                },
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-[#D2B48C] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA]">
                        {template.tag}
                      </span>
                      <span className="text-xs font-mono text-[#556B67]">• {template.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40">
                        LegalApproved
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#1E2D2A]">{template.title}</h4>
                    <p className="text-[11px] text-[#556B67] font-medium">{template.desc}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <input
                      type="checkbox"
                      defaultChecked={template.checked}
                      className="w-4 h-4 accent-[#2F4541] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#2F4541]">Include</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Publish Action Bar */}
            <div className="pt-6 border-t border-[#EBDDDA]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => switchSubTab("eligibility")}
                className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ← Back to Eligibility Rules
              </button>

              <button
                type="button"
                onClick={() => alert("Challenge Published Successfully to Maharashtra Innovation Registry! Startups can now discover and submit proposals.")}
                className="px-8 py-3.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#BFCACC]" />
                <span>Publish Challenge to State Registry</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default function ChallengeBuilderPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#3D5855]">Loading Challenge Builder...</div>}>
      <ChallengeBuilderContent />
    </React.Suspense>
  );
}
