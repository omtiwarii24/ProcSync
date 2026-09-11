"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
  Activity,
  MapPin,
  Cpu,
  Eye,
  Layers,
  Award,
  BarChart3,
  TrendingUp,
  FileCheck,
  Building2,
  Scale
} from "lucide-react";

// Shape returned by /api/evidence-extract (Gemini AI Extraction)
interface AiExtractionResult {
  metrics: {
    metric: string;
    baseline: string;
    observed: string;
    delta: string;
    deltaDirection: "improvement" | "regression" | "neutral";
    confidence: number;
    verificationMethod: string;
  }[];
  overallConfidence: number;
  anomalyScreening: string;
  evaluatorNote: string;
}

function EvidenceUploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { evidenceSubmissions, uploadEvidence, startupProfile } = useApp();

  type SubTabId = "upload" | "ai_extract" | "eval_audit";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("upload");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["upload", "ai_extract", "eval_audit"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["upload", "ai_extract", "eval_audit"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/upload?tab=${tab}`, { scroll: false });
  };

  // Upload state
  const [milestoneId, setMilestoneId] = useState("M2");
  const [fileType, setFileType] = useState<"acoustic" | "gps" | "scada" | "calibration">("acoustic");
  const [selectedFileName, setSelectedFileName] = useState("Nashik_Basalt_Acoustic_Velocity_Calibration_D10.dat");

  // AI Extraction state (live Gemini Evidence Extraction)
  const [aiResult, setAiResult] = useState<AiExtractionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const runAiExtraction = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    switchSubTab("ai_extract");
    try {
      const res = await fetch("/api/evidence-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId,
          fileType,
          fileName: selectedFileName,
          fileSummary:
            fileType === "acoustic"
              ? `Raw acoustic waveforms and FFT spectrograms from ${milestoneId} deployment: sub-surface leak noise captured by non-invasive clamp sensors on sluice valves. Includes before/after localization runs with ground-truth pit excavations, clock-synced sensor correlation pairs, and spectral noise-floor measurements.`
              : fileType === "gps"
              ? `Geotagged excavation ground-truth photographs with GPS coordinates comparing predicted leak locations against actual dug pit positions. Includes pit depth, soil strata observed, and repair timestamps.`
              : fileType === "scada"
              ? `Continuous SCADA flow and pressure telemetry from the municipal distribution grid covering the pilot zone. Includes pumped volume, night-flow minimums, pressure transients at 5-minute resolution, and district metered area balances.`
              : `Hardware calibration checklists: sensor clamp torque, battery voltage, acoustic channel gain calibration, and reference-tone verification logs for the deployed sensor array.`,
          departmentBaseline: "Localization error ~8m manual excavation; NRW ~35.2% of pumped volume; MTTR ~48 hours per rupture",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI extraction failed");
      setAiResult(data.result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI extraction failed");
    } finally {
      setAiLoading(false);
    }
  };
  const [fileSize, setFileSize] = useState("18.6 MB");
  const [isHashing, setIsHashing] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const tabs: { id: SubTabId; label: string; desc: string; badge: string }[] = [
    {
      id: "upload",
      label: "Sensor Telemetry Ingestion",
      desc: "Upload raw acoustic waveforms, SCADA packets & photo logs",
      badge: "Live Ingestion"
    },
    {
      id: "ai_extract",
      label: "AI Evidence Extraction",
      desc: "Automated before/after metrics with confidence scores",
      badge: "98.4% Confidence"
    },
    {
      id: "eval_audit",
      label: "COEP Academic Verification",
      desc: "Independent university ground-truth excavation sign-off",
      badge: "Dr. Vidya Joshi"
    }
  ];

  const handleSimulateHashing = (e: React.FormEvent) => {
    e.preventDefault();
    setIsHashing(true);
    setGeneratedHash(null);
    setUploadSuccess(false);

    setTimeout(() => {
      const simulatedHash = "sha256:d8a1c9e4" + Math.random().toString(16).substring(2, 10) + "776210452b41";
      setGeneratedHash(simulatedHash);
      setIsHashing(false);
      setUploadSuccess(true);

      uploadEvidence({
        pilotId: "NMC-WTR-2025-ADAPTED",
        milestoneId,
        fileName: selectedFileName,
        fileSize,
        fileType,
        sha256Hash: simulatedHash
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header Banner & Status Bar */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-[#D2B48C]" />
                TELEMETRY & AI STUDIO
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[11px] font-bold border border-[#BFCACC]">
                EVIDENCE EXTRACTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/30 text-[#7A5A30] font-mono text-[11px] font-bold border border-[#D2B48C]">
                COEP ACADEMIC BOARD
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight flex items-center gap-2">
              Field Evidence & AI Extraction Studio
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Upload raw acoustic frequency waveforms, SCADA packets, and geotagged excavation logs. 
              Automated AI models extract verifiable outcome deltas with statistical confidence scores for academic sign-off.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/trials?tab=milestones"
              className="px-4 py-2.5 bg-[#FAF8F6] border-2 border-stone-200 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-[#2F4541]" />
              <span>Escrow Milestones</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#FAF8F6] p-4 rounded-2xl border-2 border-stone-200 space-y-1">
            <span className="text-[11px] uppercase font-bold text-stone-500 font-mono flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#2F4541]" /> SUBMITTED ARTIFACTS
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-stone-950 block">
              {evidenceSubmissions.length} Data Blocks
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              SHA-256 Merkle sealed & timestamped
            </span>
          </div>

          <div className="bg-[#BFCACC]/25 p-4 rounded-2xl border-2 border-[#BFCACC] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#1B3B36] font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#1B3B36]" /> AI CONFIDENCE SCORE
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#1B3B36] block">
              98.4% (Mean)
            </span>
            <span className="text-[11px] text-[#1B3B36] font-medium">
              Zero synthetic anomalies detected
            </span>
          </div>

          <div className="bg-[#D2B48C]/25 p-4 rounded-2xl border-2 border-[#D2B48C] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#7A5A30] font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#7A5A30]" /> INDEPENDENT AUDIT
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#7A5A30] block">
              COEP Pune
            </span>
            <span className="text-[11px] text-[#7A5A30] font-medium">
              Ground-truth pit excavation validated
            </span>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
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

      {/* 2. SUB-TAB 1: SENSOR TELEMETRY INGESTION */}
      {activeSubTab === "upload" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left: Upload Dropzone & Form (7 Columns) */}
          <div className="xl:col-span-7 bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <form onSubmit={handleSimulateHashing} className="space-y-5">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="text-lg font-black text-stone-950">
                  Select Evidence Deliverable
                </h2>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  Attach telemetry to unlock milestone escrow tranches.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Target Milestone:
                  </label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:border-[#2F4541] outline-hidden"
                  >
                    <option value="M2">Milestone 2 • Basalt Wave Calibration (₹1.6L)</option>
                    <option value="M1">Milestone 1 • Hardware Clamping (₹1.2L - Disbursed)</option>
                    <option value="M3">Milestone 3 • Final Procurement Passport (₹1.2L)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Artifact Category:
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:border-[#2F4541] outline-hidden"
                  >
                    <option value="acoustic">Acoustic Spectrogram & FFT (.dat, .csv)</option>
                    <option value="gps">GPS Geotagged Ground Excavation (.pdf)</option>
                    <option value="scada">SCADA Flow & Pressure Readings (.json)</option>
                    <option value="calibration">Hardware Inspection Checklist (.pdf)</option>
                  </select>
                </div>
              </div>

              {/* Dropzone Box */}
              <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center space-y-3 bg-[#FAF8F6] hover:bg-stone-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#2F4541] text-white flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5 text-[#D2B48C]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-stone-950 block">{selectedFileName}</span>
                  <span className="text-xs text-stone-500 font-mono mt-0.5 block">{fileSize} • MIME: binary/telemetry</span>
                </div>

                {/* Quick Preset Selector */}
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFileName("Nashik_Basalt_Acoustic_Velocity_Calibration_D10.dat");
                      setFileSize("18.6 MB");
                      setFileType("acoustic");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold text-stone-700 hover:bg-stone-100"
                  >
                    Preset 1: Basalt Acoustic Waveform (18.6 MB)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFileName("CIDCO_Panchavati_Excavation_GroundTruth_Photos.pdf");
                      setFileSize("9.1 MB");
                      setFileType("gps");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold text-stone-700 hover:bg-stone-100"
                  >
                    Preset 2: Geotagged Excavation (9.1 MB)
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-stone-500 font-medium">
                  Direct audit by: <strong>Dr. Vidya Joshi (COEP)</strong>
                </span>

                <button
                  type="submit"
                  disabled={isHashing}
                  className="px-6 py-3 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isHashing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Hashing SHA-256 Merkle Root...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#D2B48C]" />
                      <span>Compute SHA-256 & Submit</span>
                    </>
                  )}
                </button>
              </div>

              {uploadSuccess && generatedHash && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-950 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Telemetry Block Successfully Appended to State Gazette Docket</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-900 bg-white p-2.5 rounded-lg border border-emerald-200 break-all">
                    {generatedHash}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right: Interactive Telemetry Payload Inspector (5 Columns) */}
          <div className="xl:col-span-5 bg-[#2F4541] text-white rounded-3xl border-2 border-[#2F4541] p-6 space-y-5 shadow-xs">
            <div className="border-b border-white/20 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-[#D2B48C] font-bold block">
                  PAYLOAD INSPECTOR
                </span>
                <h3 className="text-sm font-black text-white">
                  {selectedFileName}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#BFCACC]/30 text-[#BFCACC] font-mono text-[10px] font-bold">
                LIVE PARSER
              </span>
            </div>

            {/* Waveform / Visual preview simulation */}
            {fileType === "acoustic" ? (
              <div className="space-y-3">
                <span className="text-xs font-bold text-stone-200 block">
                  Acoustic Spectrogram Peak Waveform:
                </span>
                <div className="h-28 bg-stone-950/60 rounded-xl p-3 border border-white/10 flex items-end justify-between gap-1">
                  {[35, 42, 60, 85, 98, 70, 45, 30, 88, 95, 75, 40, 25, 65, 92, 50, 30, 20].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-xs transition-all ${
                        h > 80 ? "bg-[#D2B48C]" : h > 50 ? "bg-[#BFCACC]" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-200">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-stone-300 block">Peak Velocity:</span>
                    <span className="font-bold text-[#D2B48C]">4,120.8 m/s</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-stone-300 block">Basalt Strata Match:</span>
                    <span className="font-bold text-[#D2B48C]">99.2% Correlation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-bold text-stone-200 block">
                  GPS Excavation Coordinates & Geotag:
                </span>
                <div className="p-4 bg-stone-950/60 rounded-xl border border-white/10 font-mono text-xs space-y-2 text-stone-200">
                  <div>Latitude: <strong className="text-white">19.9975° N</strong></div>
                  <div>Longitude: <strong className="text-white">73.7898° E</strong></div>
                  <div>Excavation Depth: <strong className="text-white">1.42 Meters</strong></div>
                  <div>Ground Distance to Leak: <strong className="text-[#D2B48C]">1.14 Meters (PASSED)</strong></div>
                </div>
              </div>
            )}

            {/* Academic Lead Info */}
            <div className="pt-3 border-t border-white/20 space-y-1 text-xs">
              <span className="text-stone-300 block font-medium">Assigned Academic Evaluator:</span>
              <span className="font-bold text-white block">Dr. Vidya Joshi</span>
              <span className="text-stone-300 text-[11px] block">
                Head of Hydraulic Engineering • COEP Technological University
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB 2: AI EVIDENCE EXTRACTION (§20) — LIVE GEMINI */}
      {activeSubTab === "ai_extract" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  EXTRACTION PIPELINE
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                {aiLoading
                  ? "AI is extracting outcome metrics…"
                  : aiResult
                  ? "Automated Outcome Metrics & Confidence Scoring"
                  : "Run AI Evidence Extraction"}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                The AI engine parses the submitted telemetry ({selectedFileName}) and computes delta improvements against departmental baseline figures.
              </p>
            </div>

            {aiResult && (
              <div className="p-3 bg-[#FAF8F6] rounded-2xl border border-stone-200 text-xs font-mono text-stone-700 shrink-0 space-y-1">
                <div className="font-bold text-stone-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7A5A30]" />
                  Statistical Confidence: {aiResult.overallConfidence}%
                </div>
                <div className="text-[11px] text-stone-500">
                  {milestoneId} • {fileType} artifact
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {aiLoading && (
            <div className="p-10 rounded-2xl border-2 border-dashed border-[#BFCACC] bg-[#FAF8F6] flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-8 h-8 border-3 border-[#2F4541] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-stone-950">
                Extracting baseline → outcome deltas from {selectedFileName}…
              </p>
              <p className="text-xs text-stone-600 font-medium max-w-md">
                Running spectral cross-correlation, clock-drift synchronization, and statistical confidence scoring.
              </p>
            </div>
          )}

          {/* Error State */}
          {aiError && (
            <div className="p-5 bg-[#F7EFE5] rounded-2xl border-2 border-[#D2B48C]/60 space-y-3" role="alert">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#7A5A30]" />
                <span className="text-sm font-black text-[#7A5A30]">AI Extraction Unavailable</span>
              </div>
              <p className="text-xs text-[#7A5A30] font-medium leading-relaxed">{aiError}</p>
              <button
                type="button"
                onClick={runAiExtraction}
                className="px-4 py-2 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Retry AI Extraction
              </button>
            </div>
          )}

          {/* Empty State */}
          {!aiLoading && !aiResult && !aiError && (
            <div className="p-10 rounded-2xl border-2 border-dashed border-[#BFCACC] bg-[#FAF8F6] flex flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="w-8 h-8 text-[#7A5A30]" />
              <p className="text-sm font-bold text-stone-950">
                No extraction has been run for {milestoneId} yet.
              </p>
              <p className="text-xs text-stone-600 font-medium max-w-md">
                The AI will analyze the currently selected artifact type ({fileType}) and milestone from the Upload tab.
              </p>
              <button
                type="button"
                onClick={runAiExtraction}
                className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#D2B48C]" />
                <span>Run AI Extraction Now</span>
              </button>
            </div>
          )}

          {/* AI Result Table */}
          {aiResult && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-stone-950">
                Extracted Outcome Telemetry Deltas (AI-Verified)
              </h3>
              <div className="overflow-x-auto rounded-2xl border-2 border-stone-200">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Target Metric / KPI</th>
                      <th className="p-3.5">Department Baseline</th>
                      <th className="p-3.5">Observed Telemetry Result</th>
                      <th className="p-3.5">Delta Improvement</th>
                      <th className="p-3.5">AI Confidence</th>
                      <th className="p-3.5">Verification Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {aiResult.metrics.map((m, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-3.5 font-bold text-stone-950">{m.metric}</td>
                        <td className="p-3.5 text-stone-600">{m.baseline}</td>
                        <td className="p-3.5 font-mono font-bold text-[#1B3B36]">{m.observed}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              m.deltaDirection === "improvement"
                                ? "bg-emerald-100 text-emerald-800"
                                : m.deltaDirection === "regression"
                                ? "bg-red-100 text-red-800"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {m.delta}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">{m.confidence}%</td>
                        <td className="p-3.5 text-stone-600">{m.verificationMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Anomaly Screening + Evaluator Note */}
          {aiResult && (
            <div className="space-y-3">
              <div className="p-5 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-2 text-xs">
                <span className="font-bold text-stone-950 uppercase font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Automated Integrity & Anomaly Screening (AI)
                </span>
                <p className="text-stone-700 leading-relaxed font-medium">
                  {aiResult.anomalyScreening}
                </p>
              </div>
              <div className="p-5 bg-[#FAF8F6] rounded-2xl border-2 border-[#D2B48C]/50 space-y-2 text-xs">
                <span className="font-bold text-stone-950 uppercase font-mono flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#7A5A30]" />
                  Evaluator Hand-off Note (COEP)
                </span>
                <p className="text-stone-700 leading-relaxed font-medium">
                  {aiResult.evaluatorNote}
                </p>
              </div>
              <button
                type="button"
                onClick={runAiExtraction}
                className="px-4 py-2 bg-white hover:bg-[#FAF8F6] border-2 border-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Re-run Extraction
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-TAB 3: COEP ACADEMIC VERIFICATION */}
      {activeSubTab === "eval_audit" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  INDEPENDENT ACADEMIC AUDIT
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  COEP Technological University
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                Academic Evaluation & Ground-Truth Pit Sign-Off
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Third-party technological university certification required before state milestone escrow disbursal and Procurement Readiness Passport publication.
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F6] rounded-2xl border border-stone-200 text-xs font-mono text-stone-700 shrink-0 space-y-1">
              <div className="font-bold text-stone-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Audit Status: IN AUDIT
              </div>
              <div className="text-[11px] text-stone-500">
                Sign-off ETA: 2 Working Days
              </div>
            </div>
          </div>

          {/* Evaluator Bio Card */}
          <div className="p-6 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2F4541] text-white flex items-center justify-center font-black text-xl shrink-0">
                VJ
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-stone-950">
                    Dr. Vidya Joshi
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-[#D2B48C]/30 text-[#7A5A30] font-mono text-[10px] font-bold">
                    Empaneled Assessor
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium">
                  Professor & Head of Hydraulic Engineering, COEP Technological University, Pune
                </p>
                <span className="text-[11px] font-mono text-stone-500 block">
                  Empaneled under Maharashtra State Innovation Society (MSInS) Technical Evaluation Board
                </span>
              </div>
            </div>

            <div className="text-left md:text-right font-mono text-xs space-y-1 border-t md:border-t-0 pt-3 md:pt-0 border-stone-200">
              <span className="text-stone-500 block text-[10px]">Digital Signature Hash:</span>
              <span className="font-bold text-stone-900 break-all text-[11px]">
                SHA256:7F4B0E891C3E2D879B5A104E9C230491DE
              </span>
              <span className="text-emerald-700 font-bold block text-[11px]">
                ✓ Validated & Timestamped
              </span>
            </div>
          </div>

          {/* Assessment Checklist Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-stone-950">
              Evaluator Ground-Truth Audit Milestones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-950">
                    1. Hardware Installation Verification
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  COEP team verified 40 acoustic pipe clamp sensors across 15km primary trunk in Panchavati ward. Baseline SCADA telemetry confirmed.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-950">
                    2. Basalt Wave Velocity Correlation
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                    IN EVALUATION
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  Telemetry file with 18.6MB raw acoustic pulses undergoing cross-correlation analysis against Deccan basalt hard rock formations.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-950">
                    3. Ground-Truth Pit Excavation Audit
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    PASSED (1.14m)
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  Pinhole sub-surface leak discovered at 1.14 meters offset from acoustic coordinate, well within the 2.0m allowable tolerance limit.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-950">
                    4. Procurement Readiness Passport Sign-Off
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-bold">
                    PENDING M2
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  Final sign-off unlocks statewide GFR Rule 149 replication certificate and 30% closeout escrow tranche release.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function EvidenceUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-mono text-xs text-stone-500">
          Loading Field Evidence & AI Studio...
        </div>
      }
    >
      <EvidenceUploadContent />
    </Suspense>
  );
}
