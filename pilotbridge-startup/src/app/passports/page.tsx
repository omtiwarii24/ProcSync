"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AshokaEmblem } from "@/components/AshokaEmblem";
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Download,
  Printer,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  IndianRupee,
  Layers,
  Award,
  ExternalLink,
  Check,
  Lock,
  Share2,
  Copy,
  Scale,
  RefreshCw,
  AlertTriangle,
  FileText
} from "lucide-react";

function PassportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { passports, startupProfile } = useApp();

  type SubTabId = "passport" | "decision" | "replication";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("passport");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["passport", "decision", "replication"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["passport", "decision", "replication"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/passports?tab=${tab}`, { scroll: false });
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const passport = passports[0];

  const tabs: { id: SubTabId; label: string; desc: string; badge: string }[] = [
    {
      id: "passport",
      label: "Procurement Readiness Passport",
      desc: "MH-EP-2025-WTR-0042 state-certified credential",
      badge: "Verified READY"
    },
    {
      id: "decision",
      label: "Authoritative Decision (SCALE)",
      desc: "STOP / ADAPT / REVALIDATE / SCALE 4-value verdict",
      badge: "SCALE • Direct Buy"
    },
    {
      id: "replication",
      label: "District Replication Guidance",
      desc: "Reusable algorithms vs revalidate local parameters",
      badge: "36 Districts"
    }
  ];

  const handleCopy = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D2B48C]" />
                STATUTORY PROCUREMENT CREDENTIAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/30 text-[#7A5A30] font-mono text-[11px] font-bold border border-[#D2B48C]">
                PASSPORT #{passport.passportId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[11px] font-bold border border-[#BFCACC]">
                GFR RULE 149 SAFE HARBOR
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight flex items-center gap-2">
              Procurement Readiness Passports & Legal Credentials
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Canonical single entity issued under Maharashtra Innovation Sandbox framework. 
              Exempts startups from prior turnover & experience criteria statewide under GFR Rule 149.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#FAF8F6] border-2 border-stone-200 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#2F4541]" />
              <span>Print Official Gazette</span>
            </button>
            <Link
              href="/?tab=discovery"
              className="px-4 py-2.5 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Replicate in New District</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D2B48C]" />
            </Link>
          </div>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#FAF8F6] p-4 rounded-2xl border-2 border-stone-200 space-y-1">
            <span className="text-[11px] uppercase font-bold text-stone-500 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F4541]" /> READINESS STATUS
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#1B3B36] block">
              {passport.readinessStatus} (GRADE A)
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Passed Gate 1 & Gate 2 audits
            </span>
          </div>

          <div className="bg-[#BFCACC]/25 p-4 rounded-2xl border-2 border-[#BFCACC] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#1B3B36] font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#1B3B36]" /> AUTHORITATIVE VERDICT
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#1B3B36] block">
              {passport.verdict} (SCALE)
            </span>
            <span className="text-[11px] text-[#1B3B36] font-medium">
              Route: {passport.procurementRoute}
            </span>
          </div>

          <div className="bg-[#D2B48C]/25 p-4 rounded-2xl border-2 border-[#D2B48C] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#7A5A30] font-mono flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#7A5A30]" /> REPLICATION SAVING
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#7A5A30] block">
              {passport.costEconomics.savingsPct}
            </span>
            <span className="text-[11px] text-[#7A5A30] font-medium">
              {passport.costEconomics.taxpayerSaved}
            </span>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-200">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchSubTab(tab.id)}
                className={`p-3 rounded-2xl text-left transition-all border-2 flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? "bg-[#2F4541] text-white border-[#2F4541] shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black ${isActive ? "text-white" : "text-stone-900"}`}>
                    {tab.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive
                        ? "bg-[#D2B48C] text-[#2F4541]"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </div>
                <span className={`text-[11px] font-medium line-clamp-1 ${isActive ? "text-stone-200" : "text-stone-500"}`}>
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-TAB 1: OFFICIAL GAZETTE SMARTCARD VIEW */}
      {activeSubTab === "passport" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Official Gazette Smartcard (8 cols) */}
          <div className="xl:col-span-8 bg-white rounded-3xl border-2 border-stone-300 overflow-hidden shadow-sm">
            {/* National Tricolor Top Accent */}
            <div className="h-2 w-full flex">
              <div className="bg-[#FF9933] flex-1"></div>
              <div className="bg-white flex-1"></div>
              <div className="bg-[#138808] flex-1"></div>
            </div>

            {/* Smartcard Header */}
            <div className="p-6 sm:p-7 bg-[#2F4541] text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
                    <AshokaEmblem size={38} className="brightness-200" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D2B48C] block tracking-widest font-mono">
                      MSInS • INNOVATION PROCUREMENT SANDBOX
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      PROCUREMENT READINESS PASSPORT
                    </h2>
                    <span className="text-xs text-stone-300 font-mono">
                      Serial: {passport.passportId} • Pilot: {passport.pilotId}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="px-3 py-1 bg-[#D2B48C] text-[#2F4541] text-xs font-mono font-black rounded-full inline-block">
                    VERDICT: {passport.verdict}
                  </span>
                  <span className="block text-[11px] text-stone-300 font-medium mt-1">
                    Route: {passport.procurementRoute}
                  </span>
                </div>
              </div>

              {/* Startup & Municipality Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20 text-xs">
                <div>
                  <span className="text-stone-300 text-[10px] block font-mono">Certified Startup:</span>
                  <span className="font-bold text-white block text-sm">{passport.startupName}</span>
                </div>
                <div>
                  <span className="text-stone-300 text-[10px] block font-mono">DPIIT ID:</span>
                  <span className="font-mono font-bold text-[#D2B48C]">{passport.dpiitId}</span>
                </div>
                <div>
                  <span className="text-stone-300 text-[10px] block font-mono">Host Department:</span>
                  <span className="font-bold text-white">{passport.department}</span>
                </div>
                <div>
                  <span className="text-stone-300 text-[10px] block font-mono">Location & Sector:</span>
                  <span className="text-stone-200">{passport.location}</span>
                </div>
              </div>
            </div>

            {/* Smartcard Body */}
            <div className="p-6 sm:p-7 space-y-6">
              
              {/* Gate 1 & Gate 2 Verification Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-1.5 text-xs">
                  <span className="font-bold text-stone-950 uppercase font-mono text-[10px] flex items-center gap-1.5 text-[#2F4541]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    GATE 1: INNOVATION QUALIFICATION
                  </span>
                  <div className="font-black text-stone-950 text-sm">{passport.innovationQualification.gate1Result}</div>
                  <p className="text-stone-600 leading-relaxed font-medium">
                    {passport.innovationQualification.physicsModel} (Tech Score: {passport.innovationQualification.techScore}/100)
                  </p>
                </div>

                <div className="p-4 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-1.5 text-xs">
                  <span className="font-bold text-stone-950 uppercase font-mono text-[10px] flex items-center gap-1.5 text-[#2F4541]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    GATE 2: PROCUREMENT QUALIFICATION
                  </span>
                  <div className="font-black text-stone-950 text-sm">{passport.procurementQualification.gate2Result}</div>
                  <p className="text-stone-600 leading-relaxed font-medium">
                    {passport.procurementQualification.riskEquivalentPathway} • {passport.procurementQualification.financialRunway}
                  </p>
                </div>
              </div>

              {/* Observed KPI Outcomes Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-stone-700 tracking-wider font-mono">
                  Observed Field Performance Proof (COEP Ground-Truth Audited)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 font-bold text-stone-700 border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">Key Performance Indicator</th>
                        <th className="p-2.5">Baseline</th>
                        <th className="p-2.5">Achieved Outcome</th>
                        <th className="p-2.5">Delta Improvement</th>
                        <th className="p-2.5 text-right">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {passport.observedResults.map((kpi, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="p-2.5 font-bold text-stone-950">{kpi.kpi}</td>
                          <td className="p-2.5 text-stone-600">{kpi.baseline}</td>
                          <td className="p-2.5 font-bold text-[#1B3B36]">{kpi.achieved}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{kpi.delta}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-stone-700">{kpi.confidenceScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unit Economics & Cost Savings */}
              <div className="p-4 bg-[#BFCACC]/20 rounded-2xl border-2 border-[#BFCACC] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] font-mono uppercase">Unit Rate Benchmark:</span>
                  <span className="font-bold text-[#1B3B36] text-sm font-mono">{passport.costEconomics.unitCost}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] font-mono uppercase">Legacy Trenching:</span>
                  <span className="font-bold text-stone-700 text-sm font-mono">{passport.costEconomics.traditionalBenchmark}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] font-mono uppercase">Savings Pct:</span>
                  <span className="font-black text-emerald-700 text-sm font-mono">{passport.costEconomics.savingsPct}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] font-mono uppercase">Taxpayer Savings:</span>
                  <span className="font-black text-[#7A5A30] text-sm font-mono">{passport.costEconomics.taxpayerSaved}</span>
                </div>
              </div>

              {/* Academic Evaluator Sign-Off Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border-2 border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-500 block">
                    INDEPENDENT ACADEMIC EVALUATOR CERTIFICATION
                  </span>
                  <div className="font-black text-stone-950 text-sm">
                    {passport.evaluator.name}, {passport.evaluator.designation}
                  </div>
                  <div className="text-stone-600 font-medium">
                    {passport.evaluator.institution} • Verified on {passport.evaluator.verifiedDate}
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-[10px] text-stone-500 space-y-0.5">
                  <span>Digital Signature Seal:</span>
                  <span className="block font-bold text-stone-900 break-all">
                    {passport.evaluator.digitalSignatureHash}
                  </span>
                  <span className="font-bold text-emerald-700">✓ CERTIFIED AUTHENTIC</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Instant RFP Sharing & Tender Link (4 cols) */}
          <div className="xl:col-span-4 bg-white rounded-3xl border-2 border-stone-200 p-6 space-y-5 shadow-xs">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#2F4541]" />
                <span>RFP Tender Dossier Sharing</span>
              </h3>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                Provide this verified verification URL in municipal e-Tender submissions.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block font-mono">
                Gazette Verification Link:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://pilotbridge.maharashtra.gov.in/verify/MH-EP-2025-WTR-0042"
                  className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 outline-hidden"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2.5 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#D2B48C]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Public Procurement Order:</span>
                <strong className="text-stone-950">Exemption under Section 4.2 of the Maharashtra Innovation Sandbox Policy</strong>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Statewide Validity:</span>
                <strong className="text-emerald-700">All 36 Districts</strong>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>GeM Portal Integration:</span>
                <strong className="text-stone-950">Pre-Approved ID</strong>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Turnover Exemption:</span>
                <strong className="text-emerald-700">Safe Harbor Validated</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#D2B48C]" />
                <span>Export PDF Tender Dossier</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. SUB-TAB 2: AUTHORITATIVE DECISION (SCALE) */}
      {activeSubTab === "decision" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  DECISION FRAMEWORK
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  Statutory Four-Value Evaluation
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                Authoritative Verdict: SCALE
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                The Academic Evaluation Board records strictly one of four verdicts: STOP, ADAPT, REVALIDATE, or SCALE.
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F6] rounded-2xl border border-stone-200 text-xs font-mono text-stone-700 shrink-0 space-y-1">
              <div className="font-bold text-stone-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#7A5A30]" />
                Verdict: SCALE
              </div>
              <div className="text-[11px] text-stone-500">
                Score: 88 / 100
              </div>
            </div>
          </div>

          {/* 4 Verdict Cards Display */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border-2 border-stone-200 bg-stone-50 opacity-40 space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                VERDICT 1
              </span>
              <h3 className="text-base font-black text-stone-700">STOP</h3>
              <p className="text-[11px] text-stone-500 leading-tight">
                Pilot failed critical safety or performance benchmarks. Sandbox terminates.
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-stone-200 bg-stone-50 opacity-40 space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                VERDICT 2
              </span>
              <h3 className="text-base font-black text-stone-700">ADAPT</h3>
              <p className="text-[11px] text-stone-500 leading-tight">
                Core physics proven but engineering parameters require calibration.
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-stone-200 bg-stone-50 opacity-40 space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                VERDICT 3
              </span>
              <h3 className="text-base font-black text-stone-700">REVALIDATE</h3>
              <p className="text-[11px] text-stone-500 leading-tight">
                Transfer to a different geological environment (e.g. alluvial clay vs basalt).
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-[#2F4541] bg-[#BFCACC]/30 ring-2 ring-[#2F4541]/20 space-y-1 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-[#1B3B36] uppercase flex items-center justify-between">
                <span>VERDICT 4</span>
                <span className="px-1.5 py-0.5 bg-[#2F4541] text-white rounded text-[9px]">SELECTED</span>
              </span>
              <h3 className="text-base font-black text-[#2F4541]">SCALE</h3>
              <p className="text-[11px] text-stone-800 leading-tight font-medium">
                Full criteria met. Unlocks statewide direct procurement and GFR Rule 149 waiver.
              </p>
            </div>
          </div>

          {/* Rubric Score Breakdown */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-stone-950">
              7-Dimension Rubric Score Breakdown (Total: 88 / 100)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs">
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Impact</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.impact}/35</span>
              </div>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Cost Eff.</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.costEffectiveness}/20</span>
              </div>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Tech Maturity</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.techMaturity}/15</span>
              </div>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Ops Readiness</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.operationalReadiness}/10</span>
              </div>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Security</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.securityCompliance}/10</span>
              </div>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Adoption</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.userAdoption}/5</span>
              </div>
              <div className="p-3 bg-[#FAF8F6] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Scalability</span>
                <span className="font-mono font-black text-sm text-stone-950">{passport.scoreBreakdown.scalability}/5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 3: DISTRICT REPLICATION GUIDANCE */}
      {activeSubTab === "replication" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  STATEWIDE DIFFUSION PLAYBOOK
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  36 Districts of Maharashtra
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                District Replication Guidance & Boundary Conditions
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Allows municipal commissioners across Maharashtra to rapidly adopt the verified solution without repeating 90-day baseline sandboxes.
              </p>
            </div>

            <Link
              href="/?tab=discovery"
              className="px-4 py-2.5 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <span>Explore Open Challenges</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D2B48C]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reusable Assets */}
            <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 space-y-3">
              <span className="text-xs font-bold text-emerald-950 uppercase font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Reusable Assets (Zero Retesting)
              </span>
              <ul className="space-y-2 text-xs text-stone-700 font-medium">
                {passport.replicationGuidance.reusableAssets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Revalidate Required */}
            <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3">
              <span className="text-xs font-bold text-amber-950 uppercase font-mono flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-700" />
                Revalidation Required (Site Specific)
              </span>
              <ul className="space-y-2 text-xs text-stone-700 font-medium">
                {passport.replicationGuidance.revalidateRequired.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Failure Conditions Avoided */}
            <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-300 space-y-3">
              <span className="text-xs font-bold text-red-950 uppercase font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                Failure Conditions Avoided
              </span>
              <ul className="space-y-2 text-xs text-stone-700 font-medium">
                {passport.replicationGuidance.failureConditionsAvoided.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Operating Envelope Parameters */}
          <div className="p-5 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-2 text-xs">
            <span className="font-bold text-stone-950 uppercase font-mono">
              Validated Physical Operating Envelope:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-stone-700">
              <div>
                <span className="text-stone-500 block text-[10px]">Water Pressure:</span>
                <strong className="text-stone-900">{passport.implementationConditions.waterPressure}</strong>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Soil Type:</span>
                <strong className="text-stone-900">{passport.implementationConditions.soilType}</strong>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Network Connectivity:</span>
                <strong className="text-stone-900">{passport.implementationConditions.networkConnectivity}</strong>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Power Availability:</span>
                <strong className="text-stone-900">{passport.implementationConditions.powerAvailability}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MyPassportsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-mono text-xs text-stone-500">
          Loading Procurement Readiness Passports...
        </div>
      }
    >
      <PassportsContent />
    </Suspense>
  );
}
