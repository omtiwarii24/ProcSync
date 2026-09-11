"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { puneWaterPilot, nashikReplicationAnalysis } from "@/data/mockData";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Layers,
  FileText,
  Download,
  Check,
  Building2,
  MapPin,
  TrendingUp,
  Cpu,
  HelpCircle,
  Info,
  FileCheck,
  Compass,
  Sliders,
  AlertOctagon,
  Scale,
  RefreshCw,
  ExternalLink,
  Printer,
  ChevronRight
} from "lucide-react";

function ReplicationWorkbenchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentRole, createAdaptedPilot } = useApp();

  // 4 Canonical Sub-Tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2 (Tab 5)
  type SubTabId = "comparison" | "split" | "failure" | "targeted";
  const tabParam = searchParams.get("tab") as string | null;

  // Support both "failure" and "memory" alias from navbar
  const initialSubTab: SubTabId =
    tabParam === "split"
      ? "split"
      : tabParam === "failure" || tabParam === "memory"
      ? "failure"
      : tabParam === "targeted"
      ? "targeted"
      : "comparison";

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(initialSubTab);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [pilotLaunchedNotification, setPilotLaunchedNotification] = useState(false);
  const [prevTabParam, setPrevTabParam] = useState(tabParam);

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam === "split") setActiveSubTab("split");
    else if (tabParam === "failure" || tabParam === "memory") setActiveSubTab("failure");
    else if (tabParam === "targeted") setActiveSubTab("targeted");
    else if (tabParam === "comparison") setActiveSubTab("comparison");
  }

  const radar = nashikReplicationAnalysis.radarScores;

  const subTabs = [
    {
      id: "comparison",
      label: "5-Dimension Context Comparison",
      shortLabel: "Context Comparison",
      badge: "82% Match",
      desc: "Problem (95%), Tech (90%), Infra (78%), Data (85%), Environment (62%)",
    },
    {
      id: "split",
      label: "Reusable vs. Revalidate Split",
      shortLabel: "Reusable vs Revalidate",
      badge: "4 Reusable • 2 Revalidate",
      desc: "Explicit separation of proven protocols/costs vs local boundary conditions",
    },
    {
      id: "failure",
      label: "Failure-Aware Institutional Memory",
      shortLabel: "Institutional Memory",
      badge: "1 Active Warning",
      desc: "Failure warnings from past historical pilots with matching failure constraints",
    },
    {
      id: "targeted",
      label: "Targeted Pilot Recommendation",
      shortLabel: "Targeted Pilot",
      badge: "Save ₹10L • 65 Days",
      desc: "Scaled-down 25-day follow-up pilot; hands off to Tab 4 Pilot Builder",
    },
  ];

  const handleLaunchTargetedPilot = () => {
    createAdaptedPilot();
    setPilotLaunchedNotification(true);
    setTimeout(() => {
      router.push("/pilot?tab=builder");
    }, 800);
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
          <span className="text-[#3D5855] font-bold">Replication Workbench</span>
          <span>/</span>
          <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
            {subTabs.find((t) => t.id === activeSubTab)?.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#556B67] hidden sm:inline">Core Engine USP:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/25 text-[#2F4541] font-mono text-[11px] font-bold border border-[#BFCACC]/40">
            Zero-Duplication Sandbox
          </span>
        </div>
      </div>

      {/* 2. HERO & SOURCE PILOT MATCH CARD */}
      <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] text-xs font-mono font-bold uppercase tracking-wider border border-[#D2B48C]/40">
                CORE SYSTEM USP • DPI MODULE 5
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#1E2D2A] tracking-tight flex flex-wrap items-center gap-3">
              <span>Replication Workbench</span>
              <span className="text-xs font-bold px-3 py-1 bg-[#BFCACC]/25 text-[#2F4541] rounded-full border border-[#BFCACC]/40 font-mono">
                Overall Transferability: 82%
              </span>
            </h1>

            <p className="text-[#3D5855] text-sm sm:text-base font-semibold mt-1 max-w-3xl leading-relaxed italic">
              &ldquo;Don&apos;t repeat the pilot. Reuse the evidence.&rdquo;
            </p>
            <p className="text-[#556B67] text-xs sm:text-sm font-medium max-w-3xl leading-relaxed mt-0.5">
              Evaluating Pune Municipal Corporation&apos;s (PMC) finalized acoustic leak detection pilot for direct adaptation and targeted deployment in Nashik Municipal Corporation (NMC).
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <button
              onClick={() => setShowDossierModal(true)}
              className="px-4 py-2 bg-white border-2 border-[#EBDDDA] text-[#1E2D2A] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-[#4B7069]" />
              <span>Export Transfer Dossier (PDF)</span>
            </button>

            <button
              onClick={handleLaunchTargetedPilot}
              className="px-4 py-2.5 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D2B48C]" />
              <span>Launch Adapted Pilot (Tab 4) →</span>
            </button>
          </div>
        </div>

        {/* Source vs Target Comparison Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#EBDDDA]">
          <div className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#556B67] uppercase tracking-wider block">
              SOURCE PILOT RECORD (FINALIZED PASSPORT)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1E2D2A]">Pune Municipal Corporation (PMC)</span>
              <span className="text-xs font-mono bg-[#BFCACC]/25 text-[#2F4541] px-2 py-0.5 rounded font-bold border border-[#BFCACC]/40">
                PMC-WTR-2025-01
              </span>
            </div>
            <p className="text-xs text-[#556B67] font-medium">
              120 km cast-iron pipeline acoustic telemetry. 91.4% accuracy, 18.2% NRW loss reduction. Verified by COEP.
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-[#D2B48C] bg-[#D2B48C]/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#856441] uppercase tracking-wider block">
              TARGET REPLICATION DEPARTMENT
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1E2D2A]">Nashik Municipal Corporation (NMC)</span>
              <span className="text-xs font-mono bg-[#D2B48C]/25 text-[#856441] px-2 py-0.5 rounded font-bold border border-[#D2B48C]/40">
                Target: Panchavati Trunk
              </span>
            </div>
            <p className="text-xs text-[#556B67] font-medium">
              15 km elevated basalt rock feeder line with 5.2 Bar hydrostatic pressure. Fast-track 25-day adaptation.
            </p>
          </div>
        </div>

        {/* 3. HORIZONTAL SUB-TAB SWITCHER (v4 Full-width pattern) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-[#EBDDDA] pt-5 scrollbar-thin">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/replication?tab=${tab.id}`}
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

      {pilotLaunchedNotification && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-400 rounded-2xl text-xs font-mono font-bold text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>Targeted 25-Day Pilot created! Transferring context to Tab 4 (Pilot Builder)...</span>
          </div>
          <span className="animate-pulse">Redirecting...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: 5-DIMENSION CONTEXT COMPARISON (§8, §23, STEP 21)              */}
      {/* ========================================================================= */}
      {activeSubTab === "comparison" && (
        <div className="space-y-6">
          {/* Methodological Context Box */}
          <div className="p-4 bg-gradient-to-r from-[#1E2D2A] via-[#2F4541] to-[#1E2D2A] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#EBDDDA]">
            <div className="flex items-start gap-3">
              <Compass className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  DETERMINISTIC 5-DIMENSION COMPATIBILITY MODEL
                </span>
                <p className="text-xs text-[#BFCACC] mt-0.5 leading-relaxed font-medium">
                  Evidence cannot simply be copy-pasted. The Replication Engine compares five foundational dimensions to determine what can be reused as-is vs. what must be revalidated locally.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/10 text-[#BFCACC] border border-white/20 rounded-lg text-xs font-mono font-bold shrink-0">
              Deterministic Compatibility: 82%
            </span>
          </div>

          {/* 5-Dimension Radar Grid */}
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA]/70 pb-4">
              <div>
                <h2 className="text-xl font-black text-[#1E2D2A]">
                  Dimensional Compatibility Breakdown
                </h2>
                <p className="text-sm text-[#556B67] font-medium mt-0.5">
                  Algorithmic scoring between Pune PMC baseline and Nashik NMC target envelope.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#FAF8F6] text-[#2F4541] px-3 py-1.5 rounded-xl border border-[#EBDDDA]">
                Algorithm: Deterministic Metric
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Dim 1: Problem */}
              <div className="p-4 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#556B67] uppercase">Dimension 1</span>
                  <span className="text-xs font-mono font-black text-[#2F4541] bg-[#BFCACC]/30 px-2 py-0.5 rounded">
                    95% MATCH
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1E2D2A]">Problem Statement</h3>
                <div className="w-full bg-[#BFCACC]/30 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2F4541] h-1.5 rounded-full" style={{ width: "95%" }}></div>
                </div>
                <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                  Both cities experience high non-revenue water distribution losses (&gt;30%) in aged underground cast-iron pipe networks.
                </p>
              </div>

              {/* Dim 2: Tech */}
              <div className="p-4 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#556B67] uppercase">Dimension 2</span>
                  <span className="text-xs font-mono font-black text-[#2F4541] bg-[#BFCACC]/30 px-2 py-0.5 rounded">
                    90% MATCH
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1E2D2A]">Technology Fit</h3>
                <div className="w-full bg-[#BFCACC]/30 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2F4541] h-1.5 rounded-full" style={{ width: "90%" }}></div>
                </div>
                <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                  Clamp-on acoustic hydrophones with FFT anomaly detection suitable for ductile-iron and cast-iron distribution pipes.
                </p>
              </div>

              {/* Dim 3: Infra */}
              <div className="p-4 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#556B67] uppercase">Dimension 3</span>
                  <span className="text-xs font-mono font-black text-[#2F4541] bg-[#BFCACC]/30 px-2 py-0.5 rounded">
                    78% MATCH
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1E2D2A]">Infrastructure</h3>
                <div className="w-full bg-[#BFCACC]/30 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2F4541] h-1.5 rounded-full" style={{ width: "78%" }}></div>
                </div>
                <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                  Nashik operates at higher gravity hydrostatic pressure (5.2 Bar vs. Pune 3.5 Bar); requires clamp gasket re-check.
                </p>
              </div>

              {/* Dim 4: Data */}
              <div className="p-4 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#556B67] uppercase">Dimension 4</span>
                  <span className="text-xs font-mono font-black text-[#2F4541] bg-[#BFCACC]/30 px-2 py-0.5 rounded">
                    85% MATCH
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1E2D2A]">Data & GIS</h3>
                <div className="w-full bg-[#BFCACC]/30 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2F4541] h-1.5 rounded-full" style={{ width: "85%" }}></div>
                </div>
                <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                  Maharashtra Urban Development GIS layers align seamlessly with GeoJSON output formats from the source pilot.
                </p>
              </div>

              {/* Dim 5: Environment */}
              <div className="p-4 rounded-xl border-2 border-[#D2B48C] bg-[#FAF8F6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#556B67] uppercase">Dimension 5</span>
                  <span className="text-xs font-mono font-black text-[#856441] bg-[#D2B48C]/25 px-2 py-0.5 rounded">
                    62% ATTN
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#1E2D2A]">Terrain & Soil</h3>
                <div className="w-full bg-[#D2B48C]/30 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#856441] h-1.5 rounded-full" style={{ width: "62%" }}></div>
                </div>
                <p className="text-xs text-[#3D5855] font-medium leading-relaxed">
                  Hard basalt rock strata in Nashik conducts acoustic waves ~30% faster than Pune clay, necessitating targeted wave calibration.
                </p>
              </div>
            </div>

            {/* Synthesis Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                Contextual Parameter Differential
              </h3>
              <div className="border border-[#EBDDDA] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F6] text-[#2F4541] font-bold uppercase text-[11px] font-mono border-b border-[#EBDDDA]">
                    <tr>
                      <th className="py-2.5 px-4">Parameter</th>
                      <th className="py-2.5 px-4">Pune Source Trial</th>
                      <th className="py-2.5 px-4">Nashik Target Grid</th>
                      <th className="py-2.5 px-4">Compatibility Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBDDDA] text-xs">
                    <tr className="hover:bg-[#FAF8F6]">
                      <td className="py-2.5 px-4 font-bold text-[#1E2D2A]">Soil / Strata Formation</td>
                      <td className="py-2.5 px-4 text-[#556B67]">Alluvial & Black Cotton Soil</td>
                      <td className="py-2.5 px-4 font-bold text-[#856441]">Deccan Basalt Hard Rock</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 rounded-full font-bold text-[10px]">
                          MUST REVALIDATE
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F6]">
                      <td className="py-2.5 px-4 font-bold text-[#1E2D2A]">Hydrostatic Water Head</td>
                      <td className="py-2.5 px-4 text-[#556B67]">3.2 – 3.8 Bar Gravity Head</td>
                      <td className="py-2.5 px-4 font-bold text-[#856441]">5.2 Bar Elevated Head</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 rounded-full font-bold text-[10px]">
                          MUST REVALIDATE
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F6]">
                      <td className="py-2.5 px-4 font-bold text-[#1E2D2A]">Acoustic Signal Processing</td>
                      <td className="py-2.5 px-4 text-[#556B67]">FFT Wavelet Filter Model</td>
                      <td className="py-2.5 px-4 text-[#556B67]">Directly Transferable</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 rounded-full font-bold text-[10px]">
                          REUSABLE AS-IS
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F6]">
                      <td className="py-2.5 px-4 font-bold text-[#1E2D2A]">Cloud Security & Isolation</td>
                      <td className="py-2.5 px-4 text-[#556B67]">CERT-In Audited India VPC</td>
                      <td className="py-2.5 px-4 text-[#556B67]">Identical State Standard</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 rounded-full font-bold text-[10px]">
                          REUSABLE AS-IS
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F6]">
                      <td className="py-2.5 px-4 font-bold text-[#1E2D2A]">Unit Rate Ceiling Benchmark</td>
                      <td className="py-2.5 px-4 text-[#556B67]">₹28,000 / km Surveyed</td>
                      <td className="py-2.5 px-4 text-[#556B67]">Applicable as Max Ceiling</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 rounded-full font-bold text-[10px]">
                          REUSABLE AS-IS
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 flex justify-end items-center border-t border-[#EBDDDA]/70">
              <button
                onClick={() => setActiveSubTab("split")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Next: Reusable vs. Revalidate Split</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: REUSABLE VS. REVALIDATE SPLIT (§8, §23, STEP 21)               */}
      {/* ========================================================================= */}
      {activeSubTab === "split" && (
        <div className="space-y-6">
          {/* Architecture Rule Callout (§8, §16) */}
          <div className="p-4 bg-gradient-to-r from-[#1E2D2A] via-[#2F4541] to-[#1E2D2A] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#EBDDDA]">
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-[#BFCACC] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  USP PRINCIPLE: SPLIT, NEVER MERGE
                </span>
                <p className="text-xs text-[#BFCACC] mt-0.5 leading-relaxed font-medium">
                  Evidence reuse must explicitly separate what is provably transferable from what must be tested locally. Never blend the two into an ambiguous &ldquo;blanket exemption.&rdquo;
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/10 text-[#BFCACC] border border-white/20 rounded-lg text-xs font-mono font-bold shrink-0">
              4 Reusable • 2 Revalidate
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: REUSABLE AS-IS (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-[#BFCACC] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EBDDDA]/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#BFCACC]/25 text-[#2F4541] flex items-center justify-center font-bold">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E2D2A]">Reusable As-Is (4 Proofs)</h3>
                    <span className="text-xs text-[#2F4541] font-semibold font-mono">No New Pilot Budget Needed</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40">
                  Transferred Proofs
                </span>
              </div>

              <div className="space-y-3">
                {nashikReplicationAnalysis.reusableAsIs.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1E2D2A]">{item.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-[#2F4541] bg-[#BFCACC]/30 px-2 py-0.5 rounded">
                        {item.provenMetric}
                      </span>
                    </div>
                    <p className="text-xs text-[#3D5855] leading-relaxed font-medium">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#FAF8F6] border border-[#BFCACC] rounded-xl text-xs text-[#2F4541] font-medium">
                <strong>Savings Contribution:</strong> Reusing these 4 items saves Nashik NMC ₹10,00,000 in baseline software calibration, cloud setup, and legal audit costs.
              </div>
            </div>

            {/* RIGHT COLUMN: MUST REVALIDATE LOCALLY (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-[#D2B48C] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EBDDDA]/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#D2B48C]/20 text-[#856441] flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E2D2A]">Must Revalidate Locally (2 Items)</h3>
                    <span className="text-xs text-[#856441] font-semibold font-mono">Scoped into 25-Day Test</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40">
                  Targeted Scope
                </span>
              </div>

              <div className="space-y-3">
                {nashikReplicationAnalysis.mustRevalidateLocally.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1E2D2A]">{item.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-[#856441] bg-[#D2B48C]/25 px-2 py-0.5 rounded">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-[#3D5855] leading-relaxed font-medium">{item.reason}</p>
                    <div className="pt-1 text-[11px] font-mono text-[#556B67] bg-white p-2 rounded-lg border border-[#EBDDDA]">
                      <strong>Testing Protocol:</strong> {item.testingProtocol}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#FAF8F6] border border-[#D2B48C] rounded-xl text-xs text-[#856441] font-medium">
                <strong>Targeted Sandbox Focus:</strong> These 2 constraints form the exact scope of the 25-day adapted pilot (₹4L budget), preventing over-spending on already-proven capabilities.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => setActiveSubTab("comparison")}
              className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Comparison</span>
            </button>

            <button
              onClick={() => setActiveSubTab("failure")}
              className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Next: Institutional Memory Warnings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: FAILURE-AWARE INSTITUTIONAL MEMORY (§9, §19.16)                */}
      {/* ========================================================================= */}
      {activeSubTab === "failure" && (
        <div className="space-y-6">
          {/* Institutional Memory Mandate */}
          <div className="p-4 bg-gradient-to-r from-[#1E2D2A] via-[#2F4541] to-[#1E2D2A] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#EBDDDA]">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  INSTITUTIONAL MEMORY DIRECTIVE
                </span>
                <p className="text-xs text-[#BFCACC] mt-0.5 leading-relaxed font-medium">
                  Past pilot failures contain critical government knowledge. The system automatically scans past pilot termination records for matching constraints to prevent repeating failed trials.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/10 text-[#D2B48C] border border-white/20 rounded-lg text-xs font-mono font-bold shrink-0">
              Active Warning Detected
            </span>
          </div>

          {/* Active Failure Warning Card */}
          {nashikReplicationAnalysis.failureAlert && (
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA]/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D2B48C]/20 text-[#856441] flex items-center justify-center font-bold shrink-0 border border-[#D2B48C]/40">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[#856441] uppercase tracking-wider block">
                    MATCHING FAILURE CONSTRAINT IDENTIFIED
                  </span>
                  <h2 className="text-lg font-black text-[#1E2D2A]">
                    Warning from Past Pilot: {nashikReplicationAnalysis.failureAlert.pilotId}
                  </h2>
                </div>
              </div>

              <span className="px-3 py-1 bg-[#D2B48C]/20 text-[#856441] font-mono text-xs rounded-full font-bold border border-[#D2B48C]/40">
                Severity: High Constraint Flag
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Historical Context</span>
                <span className="text-sm font-bold text-[#1E2D2A] block">
                  {nashikReplicationAnalysis.failureAlert.department}
                </span>
                <span className="text-xs text-[#556B67] font-medium block">
                  Technology: {nashikReplicationAnalysis.failureAlert.technology}
                </span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#D2B48C] space-y-1">
                <span className="text-xs font-bold text-[#856441] uppercase block">Root Cause of Failure</span>
                <p className="text-xs text-[#1E2D2A] font-medium leading-relaxed">
                  {nashikReplicationAnalysis.failureAlert.cause}
                </p>
              </div>
            </div>

            {/* Mandatory Policy Directive */}
            <div className="p-5 rounded-xl border-2 border-[#2F4541] bg-[#1E2D2A] text-white space-y-2">
              <div className="flex items-center gap-2 text-[#D2B48C]">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  MANDATORY ARCHITECTURAL DIRECTIVE APPLIED TO NASHIK WORK ORDER:
                </span>
              </div>
              <p className="text-xs text-[#FAF8F6] font-mono leading-relaxed">
                {nashikReplicationAnalysis.failureAlert.directive}
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#BFCACC] font-mono">
                <span>Enforced by: ProcSync Institutional Memory Engine</span>
                <span className="text-[#D2B48C] font-bold">Safeguard Inserted into Pilot Builder</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]/70">
              <button
                onClick={() => setActiveSubTab("split")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Split</span>
              </button>

              <button
                onClick={() => setActiveSubTab("targeted")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Next: Targeted Pilot Recommendation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: TARGETED PILOT RECOMMENDATION (§13, §23, STEP 21)              */}
      {/* ========================================================================= */}
      {activeSubTab === "targeted" && (
        <div className="space-y-6">
          {/* Recommendation Banner */}
          <div className="p-5 bg-gradient-to-r from-[#FAF8F6] to-[#F0F4F5] border-2 border-[#BFCACC] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-[#2F4541] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#2F4541] uppercase tracking-wider block">
                  PRESCRIPTIVE REPLICATION RECOMMENDATION
                </span>
                <h3 className="text-lg font-black text-[#1E2D2A] mt-0.5">
                  Action: Fast-Track 25-Day Adapted Pilot (Nashik NMC)
                </h3>
                <p className="text-xs text-[#556B67] font-medium mt-0.5">
                  Does not compute a final procurement Decision itself; hands off to Tab 4 (Pilot Builder) for targeted execution.
                </p>
              </div>
            </div>

            <button
              onClick={handleLaunchTargetedPilot}
              className="px-5 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-colors shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D2B48C]" />
              <span>Create in Pilot Builder (Tab 4) →</span>
            </button>
          </div>

          {/* Macro Economic Savings Card */}
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA]/70 pb-4">
              <div>
                <h2 className="text-xl font-black text-[#1E2D2A]">
                  Macro Value Preserved Through Evidence Reuse
                </h2>
                <p className="text-sm text-[#556B67] font-medium mt-0.5">
                  Comparison between repeating a full 90-day trial vs. commissioning the targeted 25-day fast-track pilot.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#BFCACC]/25 text-[#2F4541] px-3 py-1.5 rounded-xl border border-[#BFCACC]/40">
                Net Savings: ₹10,00,000 + 65 Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-1">
                <span className="text-xs font-bold text-[#556B67] uppercase block">Full Pilot Benchmark</span>
                <span className="text-2xl font-black text-[#1E2D2A] font-mono">₹14,00,000</span>
                <span className="text-xs text-[#556B67] font-medium block">90 Days Full Pipeline Sweep</span>
              </div>

              <div className="p-5 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-1">
                <span className="text-xs font-bold text-[#2F4541] uppercase block">Adapted Pilot Budget</span>
                <span className="text-2xl font-black text-[#1E2D2A] font-mono">₹4,00,000</span>
                <span className="text-xs text-[#2F4541] font-medium block">25 Days (15km Basalt Zone Only)</span>
              </div>

              <div className="p-5 rounded-xl border-2 border-[#D2B48C] bg-[#FAF8F6] space-y-1">
                <span className="text-xs font-bold text-[#856441] uppercase block">Public Funds Preserved</span>
                <span className="text-2xl font-black text-[#856441] font-mono">₹10,00,000</span>
                <span className="text-xs text-[#856441] font-bold block">71.4% Cost Reduction</span>
              </div>

              <div className="p-5 rounded-xl border-2 border-[#BFCACC] bg-[#FAF8F6] space-y-1">
                <span className="text-xs font-bold text-[#2F4541] uppercase block">Time-to-Procurement Saved</span>
                <span className="text-2xl font-black text-[#1E2D2A] font-mono">65 Days</span>
                <span className="text-xs text-[#2F4541] font-bold block">From 90 Days to 25 Days</span>
              </div>
            </div>

            {/* Fast-Track Work Order Summary */}
            <div className="p-5 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2F4541]">
                Pre-Configured Pilot Builder Handoff Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#EBDDDA]">
                  <span className="text-[#556B67] block">Milestone 1 (30%)</span>
                  <span className="font-bold text-[#1E2D2A]">₹1,20,000 • Day 1–5 Setup</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#EBDDDA]">
                  <span className="text-[#556B67] block">Milestone 2 (40%)</span>
                  <span className="font-bold text-[#1E2D2A]">₹1,60,000 • 15km Basalt Sweep</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#EBDDDA]">
                  <span className="text-[#556B67] block">Milestone 3 (30%)</span>
                  <span className="font-bold text-[#1E2D2A]">₹1,20,000 • Ground Truth & Audit</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]/70">
              <button
                onClick={() => setActiveSubTab("failure")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Institutional Memory</span>
              </button>

              <button
                onClick={handleLaunchTargetedPilot}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Handoff to Tab 4 Pilot Builder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER DOSSIER EXPORT */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-[#1E2D2A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EBDDDA]/70 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#2F4541]" />
                <h3 className="text-base font-black text-[#1E2D2A]">Evidence Transfer Dossier Export</h3>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                className="text-[#556B67] hover:text-[#1E2D2A] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#3D5855] font-medium leading-relaxed">
              <p>
                The <strong>Evidence Transfer Dossier</strong> packages the 5-dimension compatibility analysis, the 4 reusable proofs, and the 2 revalidation test protocols into a certified PDF for submission to the Municipal Commissioner and Finance Committee.
              </p>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] font-mono text-[11px] space-y-1 text-[#2F4541]">
                <div>• Source Passport: MH-PRP-2025-WTR-0042 (PMC)</div>
                <div>• Target: Nashik Municipal Corporation (NMC)</div>
                <div>• Compatibility Index: 82.0% (Verified)</div>
                <div>• Cryptographic Digest: SHA256: 3c8e41a9...</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#EBDDDA]/70">
              <button
                onClick={() => setShowDossierModal(false)}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowDossierModal(false);
                }}
                className="px-4 py-2 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Print Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReplicationWorkbenchPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#556B67]">Loading Replication Workbench...</div>}>
      <ReplicationWorkbenchContent />
    </React.Suspense>
  );
}
