"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Activity,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  UploadCloud,
  FileCheck,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Check,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  MessageSquare,
  HelpCircle,
  Layers,
  Building2,
  Scale,
  Award,
  Send,
  UserCheck,
  FileSignature
} from "lucide-react";

function TrialsWorkbenchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    startupProfile,
    evidenceSubmissions,
    milestones,
    templates,
    clarifications,
    submitMilestoneInvoice,
    acceptTermsTemplate,
    sendClarificationResponse
  } = useApp();

  type SubTabId = "milestones" | "terms" | "payments" | "clarifications";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("milestones");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["milestones", "terms", "payments", "clarifications"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["milestones", "terms", "payments", "clarifications"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/trials?tab=${tab}`, { scroll: false });
  };

  const [activePilotId, setActivePilotId] = useState("NMC-WTR-2025-ADAPTED");
  const [selectedMilestone, setSelectedMilestone] = useState<"M1" | "M2" | "M3">("M2");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [invoiceSubmitted, setInvoiceSubmitted] = useState(false);

  // Clarification reply state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newQueryRecipient, setNewQueryRecipient] = useState<string>("Dr. Vidya Joshi (COEP Evaluator)");
  const [newQueryText, setNewQueryText] = useState("");
  const [newQuerySuccess, setNewQuerySuccess] = useState(false);

  const isNashik = activePilotId === "NMC-WTR-2025-ADAPTED";

  const tabs: { id: SubTabId; label: string; desc: string; badge: string }[] = [
    {
      id: "milestones",
      label: "3-Phase Milestone Stepper",
      desc: "M1 Disbursed, M2 In-Audit, M3 Locked",
      badge: "Live Pipeline"
    },
    {
      id: "terms",
      label: "Legal Terms & IP Custody",
      desc: "TMPL-IP-2024-v1.8 Zero IP Leakage",
      badge: `${templates.filter((t) => t.accepted).length}/${templates.length} Active`
    },
    {
      id: "payments",
      label: "SBI Escrow State Machine",
      desc: "Pending → Invoiced → Approved → Disbursed",
      badge: "₹1.2L Released"
    },
    {
      id: "clarifications",
      label: "Clarification Query Log",
      desc: "Direct Q&A with COEP & NMC Evaluators",
      badge: `${clarifications.length} Threads`
    }
  ];

  const activeMilestoneInfo = milestones[selectedMilestone];

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    sendClarificationResponse(id, replyText);
    setReplyText("");
    setActiveReplyId(null);
  };

  const handleCreateNewQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueryText.trim()) return;
    setNewQuerySuccess(true);
    setTimeout(() => {
      setNewQuerySuccess(false);
      setNewQueryText("");
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header Banner & Financial Metric Strip */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#D2B48C]" />
                GOVERNMENT SANDBOX WORKBENCH
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/30 text-[#7A5A30] font-mono text-[11px] font-bold border border-[#D2B48C]">
                SBI ESCROW: #9102-4412-8821
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[11px] font-bold border border-[#BFCACC]">
                GFR RULE 149 SAFE HARBOR
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight flex items-center gap-2">
              Active Sandbox Trials & Escrow Workbench
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Real-time milestone tracking, Zero-IP-Leakage legal terms custody, SBI automated virtual escrow releases, and direct evaluative communications.
            </p>
          </div>

          {/* Trial Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F6] p-1.5 rounded-2xl border-2 border-stone-200 shrink-0">
            <button
              onClick={() => {
                setActivePilotId("NMC-WTR-2025-ADAPTED");
                setSelectedMilestone("M2");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isNashik
                  ? "bg-[#2F4541] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#D2B48C]" />
              <span>Nashik NMC (Adapted 25-Day • Active)</span>
            </button>
            <button
              onClick={() => {
                setActivePilotId("PMC-WTR-2025-01");
                setSelectedMilestone("M1");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isNashik
                  ? "bg-[#2F4541] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>Pune PMC (90-Day • Settled)</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Stat Widgets with Pastel Backgrounds */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F6] p-4 rounded-2xl border-2 border-stone-200 space-y-1">
            <span className="text-[11px] uppercase font-bold text-stone-500 font-mono flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#2F4541]" /> TOTAL WORK ORDER
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-stone-950 block">
              {isNashik ? "₹4,00,000" : "₹14,00,000"}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              {isNashik ? "Adapted 25-Day Fast-Track" : "90-Day Full Baseline Sandbox"}
            </span>
          </div>

          <div className="bg-[#BFCACC]/25 p-4 rounded-2xl border-2 border-[#BFCACC] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#1B3B36] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1B3B36]" /> RELEASED (TRANCHE 1)
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#1B3B36] block">
              {isNashik ? "₹1,20,000" : "₹14,00,000"}
            </span>
            <span className="text-[11px] text-[#1B3B36] font-medium">
              30% Advance Settled via SBI Escrow
            </span>
          </div>

          <div className="bg-[#D2B48C]/25 p-4 rounded-2xl border-2 border-[#D2B48C] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#7A5A30] font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#7A5A30]" /> IN COEP AUDIT (TRANCHE 2)
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#7A5A30] block">
              {isNashik ? "₹1,60,000" : "₹0 (Settled)"}
            </span>
            <span className="text-[11px] text-[#7A5A30] font-medium">
              40% Basalt Calibration Pending Sign-Off
            </span>
          </div>

          <div className="bg-[#EBDDDA]/35 p-4 rounded-2xl border-2 border-[#EBDDDA] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#5A3832] font-mono flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#5A3832]" /> CLOSEOUT (TRANCHE 3)
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#5A3832] block">
              {isNashik ? "₹1,20,000" : "₹0 (Settled)"}
            </span>
            <span className="text-[11px] text-[#5A3832] font-medium">
              30% Unlocks upon Passport Publication
            </span>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-stone-200">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchSubTab(tab.id)}
                className={`p-3 rounded-2xl text-left transition-all border-2 flex flex-col justify-between gap-2 ${
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

      {/* 2. SUB-TAB 1: 3-PHASE MILESTONE EXECUTION */}
      {activeSubTab === "milestones" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-950">
                  Escrow Tranche Progression Stepper
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  Rule: Automated 30% Advance • 40% Telemetry Calibration • 30% Final Passport Sign-Off.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">
                  Active Trial: {isNashik ? "NMC Adapted (25 Days)" : "PMC Full (90 Days)"}
                </span>
              </div>
            </div>

            {/* Stepper Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* M1 */}
              <div
                onClick={() => setSelectedMilestone("M1")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedMilestone === "M1"
                    ? "border-[#2F4541] bg-[#BFCACC]/30 ring-2 ring-[#2F4541]/20 shadow-xs"
                    : "border-stone-200 bg-stone-50/70 hover:bg-stone-100/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-stone-700 uppercase">
                    TRANCHE 1 • 30%
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                    <Check className="w-3 h-3" /> DISBURSED
                  </span>
                </div>
                <h3 className="text-sm font-black text-stone-950 mt-2">
                  Hardware Clamping & Baseline
                </h3>
                <span className="text-base font-mono font-black text-[#1B3B36] block mt-1">
                  {milestones.M1.amount} Released
                </span>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {milestones.M1.description}
                </p>
              </div>

              {/* M2 */}
              <div
                onClick={() => setSelectedMilestone("M2")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedMilestone === "M2"
                    ? "border-[#2F4541] bg-[#D2B48C]/30 ring-2 ring-[#2F4541]/20 shadow-xs"
                    : isNashik
                    ? "border-[#D2B48C]/80 bg-[#FAF8F6] hover:bg-[#D2B48C]/20"
                    : "border-stone-200 bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-stone-700 uppercase">
                    TRANCHE 2 • 40%
                  </span>
                  {isNashik ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1 border border-amber-300">
                      <Clock className="w-3 h-3" /> IN COEP AUDIT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                      <Check className="w-3 h-3" /> DISBURSED
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black text-stone-950 mt-2">
                  Basalt Wave Velocity Calibration
                </h3>
                <span className="text-base font-mono font-black text-[#7A5A30] block mt-1">
                  {milestones.M2.amount} {isNashik ? "Under Audit" : "Paid"}
                </span>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {milestones.M2.description}
                </p>
              </div>

              {/* M3 */}
              <div
                onClick={() => setSelectedMilestone("M3")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedMilestone === "M3"
                    ? "border-[#2F4541] bg-[#EBDDDA]/40 ring-2 ring-[#2F4541]/20 shadow-xs"
                    : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-stone-700 uppercase">
                    TRANCHE 3 • 30%
                  </span>
                  {isNashik ? (
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold text-[10px] flex items-center gap-1 border border-stone-300">
                      <Lock className="w-3 h-3" /> LOCKED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                      <Check className="w-3 h-3" /> DISBURSED
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black text-stone-950 mt-2">
                  Procurement Passport Closeout
                </h3>
                <span className="text-base font-mono font-black text-stone-700 block mt-1">
                  {milestones.M3.amount} Pending
                </span>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {milestones.M3.description}
                </p>
              </div>
            </div>

            {/* Selected Milestone Inspection Drawer */}
            <div className="bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-stone-500 uppercase font-mono">
                    ACTIVE SELECTION INSPECTION
                  </span>
                  <h3 className="text-base font-black text-stone-950">
                    {activeMilestoneInfo.name}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-sm font-mono font-black text-[#1B3B36] block">
                    Escrow Value: {activeMilestoneInfo.amount}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">
                    Tx: {activeMilestoneInfo.txHash}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-bold text-stone-950 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#2F4541]" />
                    Technical Verification Trigger:
                  </span>
                  <p className="text-stone-700 font-medium leading-relaxed">
                    {activeMilestoneInfo.technicalCondition}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-bold text-stone-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#7A5A30]" />
                    Evaluator Audit Assessment:
                  </span>
                  <p className="text-stone-700 font-medium leading-relaxed">
                    {activeMilestoneInfo.auditNote}
                  </p>
                </div>
              </div>

              {selectedMilestone === "M2" && isNashik && (
                <div className="p-4 bg-[#D2B48C]/20 rounded-xl border border-[#D2B48C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#7A5A30] block">
                      Acoustic Basalt Telemetry In Review
                    </span>
                    <span className="text-stone-700 font-medium">
                      Assigned Lead: Dr. Vidya Joshi (COEP Technological University) • Task EV-CLAIM-03
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/upload?tab=upload"
                      className="px-4 py-2 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <UploadCloud className="w-4 h-4 text-[#D2B48C]" />
                      <span>Upload Supplementary Data</span>
                    </Link>
                    <button
                      onClick={() => switchSubTab("clarifications")}
                      className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl font-bold transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4 text-[#2F4541]" />
                      <span>Message Evaluator</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedMilestone === "M1" && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setReceiptModalOpen(true)}
                    className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-stone-600" />
                    <span>View SBI Escrow Disbursement Advice Voucher</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB 2: LEGAL TERMS & IP CUSTODY (§21) */}
      {activeSubTab === "terms" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  IP & LEGAL COMPLIANCE
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  DPIIT Safe Harbor Legal Shield
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                Pre-Approved Legal Templates & Zero-IP-Leakage Protection
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                All pilot agreements on the Maharashtra Innovation Sandbox execute under standardized terms protecting startup proprietary algorithms, models, and firmware.
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F6] rounded-2xl border border-stone-200 text-xs font-mono text-stone-700 shrink-0 space-y-1">
              <div className="font-bold text-stone-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Legal Shield Certified
              </div>
              <div className="text-[11px] text-stone-500">
                CIN: U72900PN2022PTC209182
              </div>
            </div>
          </div>

          {/* Legal Clause Cards */}
          <div className="grid grid-cols-1 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.code}
                className="p-5 rounded-2xl border-2 border-stone-200 bg-[#FAF8F6] hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#2F4541] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      <Lock className="w-4 h-4 text-[#D2B48C]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#7A5A30]">
                          {tpl.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono font-bold">
                          {tpl.category}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-stone-950 mt-0.5">
                        {tpl.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {tpl.accepted ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Accepted ({tpl.acceptedDate})
                      </span>
                    ) : (
                      <button
                        onClick={() => acceptTermsTemplate(tpl.code)}
                        className="px-3.5 py-1.5 bg-[#2F4541] text-white hover:bg-[#2F4541]/90 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <FileSignature className="w-3.5 h-3.5 text-[#D2B48C]" />
                        <span>Accept Clause</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
                  {tpl.description}
                </p>

                {tpl.code === "TMPL-IP-2024-v1.8" && (
                  <div className="p-3 bg-[#BFCACC]/30 rounded-xl border border-[#BFCACC] text-xs space-y-1">
                    <span className="font-bold text-[#1B3B36] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#1B3B36]" />
                      Specific Clause Highlight (Zero IP Expropriation):
                    </span>
                    <p className="text-stone-700 leading-relaxed font-sans">
                      &quot;The Municipal Corporation explicitly acknowledges that all neural weights, feature extraction mathematical algorithms, acoustic FFT filtering parameters, and firmware binaries remain the sole and exclusive intellectual property of the Startup. The Corporation is granted non-exclusive operational execution rights solely during the pilot sandbox duration.&quot;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 3: SBI ESCROW PAYMENT STATE MACHINE */}
      {activeSubTab === "payments" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  STATE BANK OF INDIA ESCROW
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  Virtual Account #9102-4412-8821
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                SBI Automated Milestone Escrow State Machine
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Escrow funds are ring-fenced upfront in a state virtual account and disbursed directly upon academic audit certification.
              </p>
            </div>

            <button
              onClick={() => setReceiptModalOpen(true)}
              className="px-4 py-2 bg-[#FAF8F6] border-2 border-stone-200 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#2F4541]" />
              <span>Download Settlement Advice</span>
            </button>
          </div>

          {/* State Machine Visualization Strip */}
          <div className="p-5 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-3">
            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase block">
              SMART DISBURSEMENT STATE MACHINE
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="text-xs font-bold text-stone-950 block">1. Trigger Verified</span>
                <span className="text-[10px] text-stone-500">Sensor pings & ground logs</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-xs font-bold text-stone-950 block">2. Invoice Raised</span>
                <span className="text-[10px] text-stone-500">GST-compliant e-Bill</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-xs font-bold text-stone-950 block">3. COEP Sign-Off</span>
                <span className="text-[10px] text-stone-500">Digital signature verified</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  ₹
                </div>
                <span className="text-xs font-bold text-stone-950 block">4. Direct RTGS</span>
                <span className="text-[10px] text-stone-500">SBI Escrow automated release</span>
              </div>
            </div>
          </div>

          {/* Milestone Action Strip */}
          <div className="p-5 bg-stone-50 rounded-2xl border-2 border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#7A5A30]">
                  Milestone 2 Action Required
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  {invoiceSubmitted ? "INVOICE SUBMITTED" : "AWAITING INVOICE"}
                </span>
              </div>
              <h4 className="text-sm font-bold text-stone-950">
                Basalt Velocity Calibration Tranche (₹1,60,000 • 40%)
              </h4>
              <p className="text-xs text-stone-600">
                You can raise the GST e-invoice for Milestone 2 now. The funds will disburse automatically once COEP evaluator Dr. Vidya Joshi enters the digital signature.
              </p>
            </div>

            <button
              onClick={() => {
                submitMilestoneInvoice("M2");
                setInvoiceSubmitted(true);
              }}
              disabled={invoiceSubmitted}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                invoiceSubmitted
                  ? "bg-stone-300 text-stone-600 cursor-not-allowed"
                  : "bg-[#2F4541] hover:bg-[#2F4541]/90 text-white shadow-xs"
              }`}
            >
              <FileSignature className="w-4 h-4 text-[#D2B48C]" />
              <span>{invoiceSubmitted ? "Invoice Submitted (Pending Sign-Off)" : "Raise GST Milestone 2 Invoice (₹1.6L)"}</span>
            </button>
          </div>

          {/* Payment Ledger Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-stone-950">
              Escrow Banking Ledger (Nashik & Pune Pilots)
            </h3>
            <div className="overflow-x-auto rounded-2xl border-2 border-stone-200">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Tranche</th>
                    <th className="p-3.5">Pilot / Municipal Corp</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">UTR Reference</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  <tr className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono text-stone-600">2025-04-29</td>
                    <td className="p-3.5 font-bold text-stone-950">M1 Advance (30%)</td>
                    <td className="p-3.5 text-stone-700">Nashik Municipal Corp (NMC)</td>
                    <td className="p-3.5 font-mono font-black text-[#1B3B36]">₹1,20,000</td>
                    <td className="p-3.5 font-mono text-stone-600">SBIN00294102948102</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        SETTLED
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setReceiptModalOpen(true)}
                        className="text-xs text-[#2F4541] font-bold hover:underline"
                      >
                        Advice
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono text-stone-600">2025-05-02</td>
                    <td className="p-3.5 font-bold text-stone-950">M2 Basalt Calibration (40%)</td>
                    <td className="p-3.5 text-stone-700">Nashik Municipal Corp (NMC)</td>
                    <td className="p-3.5 font-mono font-black text-[#7A5A30]">₹1,60,000</td>
                    <td className="p-3.5 font-mono text-stone-400">Pending Sign-Off</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {invoiceSubmitted ? "INVOICED" : "IN AUDIT"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-stone-400">--</td>
                  </tr>
                  <tr className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono text-stone-600">2025-04-18</td>
                    <td className="p-3.5 font-bold text-stone-950">Total Pilot Settlement</td>
                    <td className="p-3.5 text-stone-700">Pune Municipal Corp (PMC)</td>
                    <td className="p-3.5 font-mono font-black text-[#1B3B36]">₹14,00,000</td>
                    <td className="p-3.5 font-mono text-stone-600">SBIN00188920194012</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        COMPLETED
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setReceiptModalOpen(true)}
                        className="text-xs text-[#2F4541] font-bold hover:underline"
                      >
                        Advice
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 4: CLARIFICATION QUERY LOG */}
      {activeSubTab === "clarifications" && (
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[10px] font-bold border border-[#BFCACC]">
                  TWO-WAY AUDIT DIALOGUE
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  Official Record Tracked
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-950 mt-1">
                Evaluator Clarification Query Threads
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Direct communication channel between startup technical founders and municipal engineers / COEP evaluators.
              </p>
            </div>
          </div>

          {/* Clarification Threads */}
          <div className="space-y-4">
            {clarifications.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border-2 border-stone-200 bg-[#FAF8F6] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2F4541] text-white flex items-center justify-center font-bold text-xs">
                      {item.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-950">{item.author}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#D2B48C]/30 text-[#7A5A30] text-[10px] font-mono font-bold">
                          {item.role}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-500">
                        {item.timestamp} • Query #{item.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      item.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {item.status === "RESOLVED" ? "✓ RESOLVED & LOGGED" : "AWAITING STARTUP INPUT"}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200">
                  <strong className="text-stone-950 block mb-1 font-semibold">Inquiry:</strong>
                  {item.query}
                </div>

                {item.response ? (
                  <div className="bg-[#BFCACC]/20 p-4 rounded-xl border border-[#BFCACC] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B3B36] flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#1B3B36]" />
                        Startup Response (Er. Vikram Deshmukh):
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        {item.respondedAt}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed font-sans">
                      {item.response}
                    </p>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === item.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Enter technical clarification with data references..."
                          className="w-full p-3 text-xs bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2F4541]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(item.id)}
                            className="px-4 py-1.5 bg-[#2F4541] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Send className="w-3 h-3 text-[#D2B48C]" />
                            <span>Submit Response</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReplyId(item.id)}
                        className="px-3 py-1.5 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#2F4541]/90 flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#D2B48C]" />
                        <span>Reply to Evaluator</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* New Query Formulation Box */}
          <div className="p-5 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#2F4541]" />
              <h3 className="text-sm font-black text-stone-950">
                Initiate New Technical Clarification to Evaluator / NMC
              </h3>
            </div>
            {newQuerySuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Clarification request successfully submitted to Dr. Vidya Joshi (COEP). Logged to audit ledger.
              </div>
            )}
            <form onSubmit={handleCreateNewQuery} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Addressed To:</label>
                <select
                  value={newQueryRecipient}
                  onChange={(e) => setNewQueryRecipient(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2F4541]"
                >
                  <option>Dr. Vidya Joshi (COEP Independent Evaluator)</option>
                  <option>Er. Sanjay Deshmukh (Chief Engineer, NMC Water Works)</option>
                  <option>MSInS Sandbox Directorate (Legal & Escrow)</option>
                </select>
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Clarification Query / Site Request:</label>
                <textarea
                  rows={2}
                  value={newQueryText}
                  onChange={(e) => setNewQueryText(e.target.value)}
                  placeholder="e.g. Requesting permission to install 2 supplementary hydrophone nodes at CIDCO booster pump chamber..."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2F4541]"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-[#D2B48C]" />
                  <span>Send Clarification Query</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-stone-300 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-mono font-bold text-xs uppercase text-stone-500">
                  OFFICIAL ESCROW ADVICE VOUCHER
                </span>
              </div>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b border-stone-200">
                <span className="font-black text-stone-900 block text-sm">
                  STATE BANK OF INDIA
                </span>
                <span className="text-[11px] text-stone-500">
                  Maharashtra Innovation Sandbox Escrow Division
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tranche:</span>
                <span className="font-bold text-stone-900">M1 (30% Advance)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount Released:</span>
                <span className="font-black text-[#1B3B36] text-sm">₹1,20,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Beneficiary:</span>
                <span className="font-bold text-stone-900">AcoustiLeak Sensors Pvt Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Escrow Account:</span>
                <span className="font-bold text-stone-900">#9102-4412-8821</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">UTR Reference:</span>
                <span className="font-bold text-stone-900">SBIN00294102948102</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Sanction Authority:</span>
                <span className="font-bold text-stone-900">NMC Municipal Comm. & MSInS</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="px-5 py-2 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold"
              >
                Close Advice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActiveTrialsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-mono text-xs text-stone-500">
          Loading Sandbox Trials Workbench...
        </div>
      }
    >
      <TrialsWorkbenchContent />
    </Suspense>
  );
}
