"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Layers,
  IndianRupee,
  Activity,
  FileCheck,
  Compass,
  Users,
  Check,
  Lock,
  Sparkles,
  ChevronDown,
  Bell,
  CheckCheck,
  Search,
  Zap,
  Repeat,
  FileSearch,
  ExternalLink,
  ShieldAlert,
  DownloadCloud,
  ChevronRight,
  Award,
  Filter,
  CheckSquare,
  MapPin,
  ArrowLeft
} from "lucide-react";

function AnalyticsCommandContent() {
  const searchParams = useSearchParams();
  const { activePersona } = useApp();

  // Tab 1 Sub-tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2
  type SubTabId = "metrics" | "queue" | "duplicate" | "map";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  
  const [defaultSubTab] = useState<SubTabId>("metrics");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["metrics", "queue", "duplicate", "map"].includes(tabParam) ? tabParam : defaultSubTab
  );

  // Sync sub-tab from query parameter (e.g. from navbar dropdown ?tab=queue)
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["metrics", "queue", "duplicate", "map"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState("all");
  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [sanctionSuccess, setSanctionSuccess] = useState(false);

  const subTabs = [
    {
      id: "metrics",
      label: "Statewide Pipeline & Macro Metrics",
      shortLabel: "Pipeline & Metrics",
      badge: "28 Pilots",
      desc: "Total pilots, active trial funding, evidence-reuse time saved, avg time-to-decision",
      href: "/?tab=metrics",
    },
    {
      id: "queue",
      label: "Urgent Action & Approval Queue",
      shortLabel: "Approval Queue",
      badge: "3 Pending",
      desc: "Pending final selections, milestone payment releases, and human authorizations",
      href: "/?tab=queue",
    },
    {
      id: "duplicate",
      label: "Zero-Duplication Tracker",
      shortLabel: "Zero-Duplication",
      badge: "₹14.8Cr Saved",
      desc: "Real-time alerts on duplicate pilots prevented because an Evidence Passport existed",
      href: "/?tab=duplicate",
    },
    {
      id: "map",
      label: "Statewide Pilot Map",
      shortLabel: "District Matrix",
      badge: "36 Districts",
      desc: "Geographic live status of active, completed, and fast-tracked pilots by district",
      href: "/?tab=map",
    },
  ];

  const handleApproveSanction = () => {
    setSanctionSuccess(true);
    setTimeout(() => {
      setSanctionSuccess(false);
      setSanctionModalOpen(false);
    }, 2500);
  };

  const municipalPilots = [
    {
      id: "NMC-WTR-2025-ADAPTED",
      district: "Nashik",
      department: "Nashik Municipal Corp (NMC)",
      division: "Water Supply & Distribution",
      title: "Panchavati Basalt Strata Acoustic Leak Localization",
      startup: "AcoustiLeak Sensors Pvt Ltd",
      type: "ADAPTED FAST-TRACK",
      timeframe: "25 Days (was 90d)",
      budget: "₹4,00,000",
      status: "UNDER_EVALUATION",
      statusBadge: "Milestone 2 In Audit",
      evaluator: "COEP Technological University",
      fundsPreserved: "₹10,00,000 Saved",
      sourceRef: "PMC-WTR-2025-01"
    },
    {
      id: "PMC-WTR-2025-01",
      district: "Pune",
      department: "Pune Municipal Corp (PMC)",
      division: "Water Supply Dept",
      title: "Sub-Surface Acoustic Leak Detection (120km Grid)",
      startup: "AcoustiLeak Sensors Pvt Ltd",
      type: "SOURCE EVIDENCE BENCHMARK",
      timeframe: "90 Days Sandbox",
      budget: "₹14,00,000",
      status: "VERIFIED_SCALED",
      statusBadge: "Passport Finalized",
      evaluator: "COEP Technological University",
      fundsPreserved: "Baseline Asset",
      sourceRef: "MH-EP-2025-WTR-0042"
    },
    {
      id: "TMC-ENG-2025-02",
      district: "Thane",
      department: "Thane Municipal Corp (TMC)",
      division: "Mechanical & Electrical Pumping",
      title: "Surge-Isolated Pumping Station Telemetry",
      startup: "VoltGuard Dynamics",
      type: "ADAPTED REPLICATION",
      timeframe: "30 Days Fast-Track",
      budget: "₹6,50,000",
      status: "SANCTIONED",
      statusBadge: "Escrow Locked",
      evaluator: "VJTI Mumbai",
      fundsPreserved: "₹8,50,000 Saved",
      sourceRef: "PMC-ENG-2024-02"
    },
    {
      id: "NMC-TRF-2025-09",
      district: "Nagpur",
      department: "Nagpur Smart City (NSSCDCL)",
      division: "Urban Mobility Directorate",
      title: "Wardha Road AI Corridor Adaptive Traffic Splits",
      startup: "SensoryFlow AI Labs",
      type: "SANDBOX PROVING TRIAL",
      timeframe: "45 Days Sandbox",
      budget: "₹5,00,000",
      status: "ACTIVE_TRIAL",
      statusBadge: "Milestone 1 Disbursed",
      evaluator: "VNIT Nagpur",
      fundsPreserved: "New Baseline",
      sourceRef: "NMC-TRF-09"
    },
    {
      id: "KMC-WTR-2025-03",
      district: "Kolhapur",
      department: "Kolhapur Municipal Corp (KMC)",
      division: "Panchganga River Works",
      title: "Deccan Basalt Pipeline Acoustic Flow Calibration",
      startup: "AcoustiLeak Sensors Pvt Ltd",
      type: "REPLICATION PENDING",
      timeframe: "25 Days Fast-Track",
      budget: "₹4,00,000",
      status: "PENDING_APPROVAL",
      statusBadge: "Council Resolution Ready",
      evaluator: "COEP Technological University",
      fundsPreserved: "₹10,00,000 Saved",
      sourceRef: "PMC-WTR-2025-01"
    }
  ];

  const filteredPilots =
    selectedDistrictFilter === "all"
      ? municipalPilots
      : municipalPilots.filter((p) => p.district.toLowerCase() === selectedDistrictFilter.toLowerCase());

  return (
    <div className="space-y-6 py-4 w-full animate-in fade-in duration-200">
          
          {/* 1. SLIM PERSISTENT BREADCRUMB & CONTEXT INDICATOR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#EBDDDA] pb-3 font-mono">
            <div className="flex items-center gap-2 text-[#556B67] flex-wrap">
              <Link href="/" className="hover:text-[#1E2D2A] font-bold transition-colors">
                ProcSync
              </Link>
              <span>/</span>
              <Link href="/" className="hover:text-[#1E2D2A] font-medium transition-colors">
                Analytics & Command
              </Link>
              <span>/</span>
              <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
                {subTabs.find((t) => t.id === activeSubTab)?.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-[#556B67] hover:text-[#1E2D2A] flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Overview</span>
              </Link>
              <span className="text-[#EBDDDA]">•</span>
              <div className="flex items-center gap-1.5 text-[#3D5855]">
                <span className="text-[11px] text-[#556B67]">Role:</span>
                <strong className="text-[#1E2D2A]">Chief Engineer (NMC)</strong>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SUB-TAB 1: STATEWIDE PIPELINE & MACRO METRICS                         */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === "metrics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Officer Delegated Financial Sanction Banner */}
              <div className="bg-gradient-to-r from-[#1E2D2A] via-[#2F4541] to-[#1E2D2A] text-white p-6 sm:p-8 rounded-2xl border-2 border-[#3D5855] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#D2B48C] font-mono text-[10px] font-bold border border-[#D2B48C]/40">
                      DELEGATED AUTHORITY CARD
                    </span>
                    <span className="text-[#556B67] text-xs">•</span>
                    <span className="text-xs text-[#BFCACC] font-mono">
                      MSInS Sandbox Regulation 2024
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Officer Financial Sanction Authority: ₹50,00,000
                  </h2>
                  <p className="text-xs sm:text-sm text-[#EBDDDA] max-w-2xl leading-relaxed">
                    You are authorized under Section 4.2 of the Maharashtra Innovation Sandbox Policy to sanction and disburse fast-track pilot replications without standard tender delays.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href="/replication"
                    className="px-5 py-3 bg-[#4B7069] hover:bg-[#3D5855] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                  >
                    <Repeat className="w-4 h-4 text-[#BFCACC]" />
                    <span>Execute 25-Day Fast Track</span>
                  </Link>
                </div>
              </div>

              {/* 4 Statewide Macro Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-5 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#556B67] font-mono">
                      Active Municipal Pilots
                    </span>
                    <Activity className="w-4 h-4 text-[#4B7069]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-[#1E2D2A]">
                    28 Pilots
                  </div>
                  <p className="text-[11px] text-[#556B67] font-medium">
                    Underway across 14 Urban Local Bodies
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#556B67] font-mono">
                      Locked Escrow Liquidity
                    </span>
                    <IndianRupee className="w-4 h-4 text-[#2F4541]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-[#2F4541]">
                    ₹4.20 Cr
                  </div>
                  <p className="text-[11px] text-[#556B67] font-medium">
                    Protected in SBI Virtual Accounts
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#556B67] font-mono">
                      Funds Preserved via Reuse
                    </span>
                    <Sparkles className="w-4 h-4 text-[#856441]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-[#856441]">
                    ₹14.80 Cr
                  </div>
                  <p className="text-[11px] text-[#556B67] font-medium">
                    Saved by eliminating duplicate trials
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#556B67] font-mono">
                      Average Deployment Time
                    </span>
                    <Clock className="w-4 h-4 text-[#4B7069]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-[#1E2D2A]">
                    25 Days
                  </div>
                  <p className="text-[11px] text-[#556B67] font-medium">
                    vs. 180 days standard government tender
                  </p>
                </div>

              </div>

              {/* Innovation Pipeline Progress Funnel */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBDDDA] pb-4">
                  <div>
                    <h3 className="text-base font-black text-[#1E2D2A]">
                      Statewide Innovation Procurement Pipeline
                    </h3>
                    <p className="text-xs text-[#556B67] font-medium">
                      Lifecycle progression across all 36 Maharashtra districts
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#556B67]">
                    Canonical Lifecycle
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#556B67] block">1. Challenges</span>
                    <span className="text-lg font-black text-[#1E2D2A] block">14</span>
                    <span className="text-[10px] text-[#556B67] block">Active RFPs</span>
                  </div>
                  <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#556B67] block">2. Qualified</span>
                    <span className="text-lg font-black text-[#1E2D2A] block">32</span>
                    <span className="text-[10px] text-[#556B67] block">Gate 1 & 2 Clear</span>
                  </div>
                  <div className="p-3 bg-[#BFCACC]/20 rounded-xl border border-[#BFCACC]/40 text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#2F4541] block">3. In Sandbox</span>
                    <span className="text-lg font-black text-[#1E2D2A] block">28</span>
                    <span className="text-[10px] text-[#2F4541] block">Active Pilots</span>
                  </div>
                  <div className="p-3 bg-[#D2B48C]/20 rounded-xl border border-[#D2B48C]/40 text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#856441] block">4. Passports</span>
                    <span className="text-lg font-black text-[#856441] block">19</span>
                    <span className="text-[10px] text-[#856441] block">Finalized</span>
                  </div>
                  <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#556B67] block">5. Replicated</span>
                    <span className="text-lg font-black text-[#1E2D2A] block">12</span>
                    <span className="text-[10px] text-[#556B67] block">Scale Orders</span>
                  </div>
                </div>
              </div>

              {/* Active Municipal Pilots Table */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBDDDA] pb-4">
                  <div>
                    <h3 className="text-base font-black text-[#1E2D2A]">
                      Active Municipal Pilots Registry
                    </h3>
                    <p className="text-xs text-[#556B67] font-medium">
                      28 monitored sandbox deployments
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDistrictFilter}
                      onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                      className="p-2 bg-[#FAF8F6] border border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] outline-hidden"
                    >
                      <option value="all">All Districts (36)</option>
                      <option value="nashik">Nashik</option>
                      <option value="pune">Pune</option>
                      <option value="thane">Thane</option>
                      <option value="nagpur">Nagpur</option>
                      <option value="kolhapur">Kolhapur</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#EBDDDA] text-[#556B67] font-mono text-[11px]">
                        <th className="py-2.5 px-3">Pilot ID & Division</th>
                        <th className="py-2.5 px-3">Challenge & Innovation</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Escrow Budget</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Evaluator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FAF8F6]">
                      {filteredPilots.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF8F6] transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-[#1E2D2A] block">{p.id}</span>
                            <span className="text-[10px] text-[#556B67]">{p.department}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#1E2D2A] block">{p.title}</span>
                            <span className="text-[10px] text-[#556B67]">{p.startup}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FAF8F6] text-[#3D5855] border border-[#EBDDDA]">
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#1E2D2A]">
                            {p.budget}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40">
                              {p.statusBadge}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#556B67] font-medium">
                            {p.evaluator}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* SUB-TAB 2: URGENT ACTION & APPROVAL QUEUE                             */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === "queue" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBDDDA] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#1E2D2A]">
                    Officer Action Queue & Approvals
                  </h3>
                  <p className="text-xs text-[#556B67] font-medium">
                    Statutory authorizations requiring your digital signature under General Financial Rules (GFR).
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 rounded-full text-xs font-mono font-black">
                  3 Pending Signatures
                </span>
              </div>

              {/* Action Item 1: Milestone 2 Escrow Release */}
              <div className="p-6 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#4B7069]/15 text-[#2F4541] text-[10px] font-mono font-bold border border-[#4B7069]/30">
                        ESCROW TRANCHE RELEASE
                      </span>
                      <span className="text-xs text-[#EBDDDA]">•</span>
                      <span className="text-xs font-mono font-bold text-[#556B67]">NMC-WTR-2025-ADAPTED</span>
                    </div>
                    <h4 className="text-base font-black text-[#1E2D2A]">
                      Release Milestone 2 Escrow: ₹1,60,000 for Basalt Wave Calibration
                    </h4>
                    <p className="text-xs text-[#3D5855] font-medium">
                      Vendor: <strong>AcoustiLeak Sensors Pvt Ltd</strong> • Academic Evaluator: <strong>Dr. Vidya Joshi (COEP)</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSanctionModalOpen(true)}
                    className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#BFCACC]" />
                    <span>Sanction Release</span>
                  </button>
                </div>

                <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] text-xs font-mono text-[#556B67] flex flex-wrap items-center justify-between gap-2">
                  <span>COEP Verification Stamp: <strong className="text-[#1E2D2A]">RSA-4096 VALIDATED</strong></span>
                  <span>SHA-256: d8a1c9e47762...10452b41</span>
                </div>
              </div>

              {/* Action Item 2: High-Priority Replication Request */}
              <div className="p-6 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#BFCACC]/20 text-[#2F4541] text-[10px] font-mono font-bold border border-[#BFCACC]/40">
                        REPLICATION INTAKE
                      </span>
                      <span className="text-xs text-[#EBDDDA]">•</span>
                      <span className="text-xs font-mono font-bold text-[#556B67]">Kolhapur Municipal Corp</span>
                    </div>
                    <h4 className="text-base font-black text-[#1E2D2A]">
                      Fast-Track Replication Request: Panchganga Basalt Water Network
                    </h4>
                    <p className="text-xs text-[#3D5855] font-medium">
                      Requested 25-Day Adaptation of Pune PMC Benchmark • Context Match: <strong>81%</strong>
                    </p>
                  </div>

                  <Link
                    href="/replication"
                    className="px-5 py-2.5 bg-[#4B7069] hover:bg-[#2F4541] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 shrink-0"
                  >
                    <span>Review Evidence Split</span>
                    <ArrowRight className="w-4 h-4 text-[#BFCACC]" />
                  </Link>
                </div>
              </div>

              {/* Action Item 3: Zero-Duplication Spend Warning */}
              <div className="p-6 bg-[#FAF8F6] rounded-2xl border-2 border-[#D2B48C] shadow-2xs space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#856441] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#D2B48C]/25 text-[#856441] text-[10px] font-mono font-bold border border-[#D2B48C]/40">
                        DUPLICATE SPEND ALERT
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-[#1E2D2A]">
                      Thane Municipal Corp attempted redundant 90-Day Water Acoustic Trial
                    </h4>
                    <p className="text-xs text-[#3D5855] font-medium">
                      The Zero-Duplication Engine detected a 94% problem match with Pune (PMC-WTR-2025-01). 
                      Recommended action: Convert to a 25-Day Adapted Pilot, saving <strong className="text-[#856441]">₹10,00,000</strong> in municipal funds.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* SUB-TAB 3: ZERO-DUPLICATION TRACKER                                   */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === "duplicate" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-4">
                <div className="border-b border-[#EBDDDA] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#4B7069]/15 text-[#2F4541] text-xs font-mono font-bold border border-[#4B7069]/30">
                      PREVENTED SPEND ENGINE
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#1E2D2A] mt-1">
                    Zero-Duplication Tracker & Public Funds Saved
                  </h3>
                  <p className="text-xs text-[#556B67] font-medium">
                    Every time a department searches or creates a challenge, ProcSync scans finalized Passports to stop repetitive trials before tender issuance.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#556B67] block">
                      Duplicate Pilots Blocked
                    </span>
                    <span className="text-2xl font-mono font-black text-[#1E2D2A]">14 Trials</span>
                    <p className="text-xs text-[#556B67]">Across 8 Urban Local Bodies</p>
                  </div>
                  <div className="p-5 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#2F4541] block">
                      Direct Public Money Saved
                    </span>
                    <span className="text-2xl font-mono font-black text-[#2F4541]">₹1,48,00,000</span>
                    <p className="text-xs text-[#3D5855]">Saved by reusing testing protocols</p>
                  </div>
                  <div className="p-5 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#4B7069] block">
                      Procurement Time Preserved
                    </span>
                    <span className="text-2xl font-mono font-black text-[#1E2D2A]">1,820 Days</span>
                    <p className="text-xs text-[#3D5855]">Cumulative civil engineer hours saved</p>
                  </div>
                </div>

                {/* Case History Table */}
                <div className="space-y-3 pt-4">
                  <span className="text-xs font-mono font-bold uppercase text-[#556B67] tracking-wider block">
                    Recent Zero-Duplication Interceptions
                  </span>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#EBDDDA] text-[#556B67] font-mono text-[11px]">
                          <th className="py-2.5 px-3">Target District</th>
                          <th className="py-2.5 px-3">Problem Identified</th>
                          <th className="py-2.5 px-3">Matched Source Passport</th>
                          <th className="py-2.5 px-3">Outcome</th>
                          <th className="py-2.5 px-3">Savings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#FAF8F6]">
                        <tr>
                          <td className="py-3 px-3 font-bold text-[#1E2D2A]">Nashik NMC</td>
                          <td className="py-3 px-3 text-[#3D5855]">Basalt Water Pipe Leaks</td>
                          <td className="py-3 px-3 font-mono text-[#556B67]">PMC-WTR-2025-01 (Pune)</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] font-bold text-[10px] border border-[#BFCACC]/40">
                              Converted to 25d Adapted Pilot
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#2F4541]">₹10,00,000</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 font-bold text-[#1E2D2A]">Pimpri Chinchwad</td>
                          <td className="py-3 px-3 text-[#3D5855]">Pothole Radar Sensor</td>
                          <td className="py-3 px-3 font-mono text-[#556B67]">TMC-ROD-2024-02 (Thane)</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#FAF8F6] text-[#1E2D2A] font-bold text-[10px] border border-[#EBDDDA]">
                              Direct Scale Order (GFR 149)
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#2F4541]">₹8,50,000</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 font-bold text-[#1E2D2A]">Chhatrapati Sambhajinagar</td>
                          <td className="py-3 px-3 text-[#3D5855]">Smart SCADA Valve Flow</td>
                          <td className="py-3 px-3 font-mono text-[#556B67]">NMC-WTR-2025-ADAPTED</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] font-bold text-[10px] border border-[#BFCACC]/40">
                              Adapted 30d Sandbox
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#2F4541]">₹6,00,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* SUB-TAB 4: STATEWIDE PILOT MAP                                        */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === "map" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#EBDDDA] shadow-2xs space-y-5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#1E2D2A]">
                      36-District Municipal Pilot Matrix
                    </h3>
                    <p className="text-xs text-[#556B67] font-medium">
                      Live operational deployment map across all Urban Local Bodies in Maharashtra.
                    </p>
                  </div>

                  {/* District Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#556B67]">Filter District:</span>
                    <select
                      value={selectedDistrictFilter}
                      onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                      className="p-2 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] outline-hidden"
                    >
                      <option value="all">All 36 Districts (Maharashtra)</option>
                      <option value="nashik">Nashik (Adapted Fast Track)</option>
                      <option value="pune">Pune (Benchmark Baseline)</option>
                      <option value="thane">Thane (Escrow Sanctioned)</option>
                      <option value="nagpur">Nagpur (Sandbox Trial)</option>
                      <option value="kolhapur">Kolhapur (Replication Pending)</option>
                    </select>
                  </div>
                </div>

                {/* District Deployment Cards */}
                <div className="space-y-3">
                  {filteredPilots.map((pilot) => (
                    <div
                      key={pilot.id}
                      className="p-5 bg-white rounded-xl border-2 border-[#EBDDDA] hover:border-[#D2B48C] transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#556B67] uppercase">
                              {pilot.district} • {pilot.department}
                            </span>
                            <span className="px-2 py-0.2 rounded bg-[#FAF8F6] text-[#3D5855] border border-[#EBDDDA] font-mono text-[10px] font-bold">
                              {pilot.type}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-[#1E2D2A] mt-0.5">
                            {pilot.title}
                          </h4>
                        </div>

                        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 self-start sm:self-auto">
                          {pilot.statusBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-[#EBDDDA] font-medium text-[#556B67]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#556B67]/70 block">Startup:</span>
                          <strong className="text-[#1E2D2A]">{pilot.startup}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#556B67]/70 block">Duration:</span>
                          <strong className="text-[#1E2D2A]">{pilot.timeframe}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#556B67]/70 block">Escrow Budget:</span>
                          <strong className="text-[#1E2D2A] font-mono">{pilot.budget}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#556B67]/70 block">Evidence Benefit:</span>
                          <strong className="text-[#2F4541] font-bold">{pilot.fundsPreserved}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

      {/* ========================================================================= */}
      {/* 5. SANCTION APPROVAL MODAL (Simulates Human Signature)                     */}
      {/* ========================================================================= */}
      {sanctionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E2D2A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EBDDDA] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4B7069]" />
                <span className="text-sm font-black text-[#1E2D2A]">
                  Officer Financial Sanction Authorization
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSanctionModalOpen(false)}
                className="text-[#556B67] hover:text-[#1E2D2A] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-2 text-xs">
              <div className="flex justify-between text-[#3D5855]">
                <span>Sanctioning Officer:</span>
                <strong className="text-[#1E2D2A]">Er. Sanjay Deshmukh (Chief Engineer)</strong>
              </div>
              <div className="flex justify-between text-[#3D5855]">
                <span>Vendor:</span>
                <strong className="text-[#1E2D2A]">AcoustiLeak Sensors Pvt Ltd</strong>
              </div>
              <div className="flex justify-between text-[#3D5855]">
                <span>Milestone:</span>
                <strong className="text-[#1E2D2A]">Milestone 2 • Basalt Calibration</strong>
              </div>
              <div className="flex justify-between text-[#3D5855]">
                <span>Escrow Tranche Amount:</span>
                <strong className="text-[#2F4541] font-mono font-black text-sm">₹1,60,000</strong>
              </div>
              <div className="flex justify-between text-[#3D5855] pt-1 border-t border-[#EBDDDA]">
                <span>Evaluator Audit:</span>
                <strong className="text-[#4B7069]">Dr. Vidya Joshi (COEP) — Passed</strong>
              </div>
            </div>

            {sanctionSuccess ? (
              <div className="p-4 bg-[#BFCACC]/30 text-[#1E2D2A] rounded-xl text-xs font-bold flex items-center gap-2 border border-[#BFCACC]/50">
                <Check className="w-5 h-5 text-[#2F4541] shrink-0" />
                <span>Sanction Approved! SBI Escrow Virtual Disbursal initiated.</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSanctionModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#EBDDDA]/50 text-[#3D5855] border border-[#EBDDDA] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveSanction}
                  className="px-5 py-2.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-[#BFCACC]" />
                  <span>Sign & Authorize Disbursal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function AnalyticsCommandPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#556B67]">Loading Analytics Command Center...</div>}>
      <AnalyticsCommandContent />
    </React.Suspense>
  );
}
