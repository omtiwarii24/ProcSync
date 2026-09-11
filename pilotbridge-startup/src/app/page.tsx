"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Compass,
  Zap,
  Building2,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Filter,
  FileCheck,
  Sparkles,
  ChevronDown,
  Info,
  Check,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Scale,
  Award,
  Layers,
  MapPin,
  Lock
} from "lucide-react";

function StartupOpportunitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { opportunities, appliedChallenges, applyToOpportunity, startupProfile } = useApp();

  type SubTabId = "discovery" | "precheck" | "submit" | "status";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("discovery");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["discovery", "precheck", "submit", "status"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["discovery", "precheck", "submit", "status"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/?tab=${tab}`, { scroll: false });
  };

  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeOppId, setActiveOppId] = useState<string>("OPP-NMC-2025-01");
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Proposal Submission State
  const [proposalOppId, setProposalOppId] = useState<string>("OPP-NMC-2025-01");
  const [proposedSolution, setProposedSolution] = useState<string>(
    "Sub-surface acoustic wave transit-time velocity array mounted non-invasively on 40 sluice valves across 15km Panchavati trunk grid."
  );
  const [proposedKpiDelta, setProposedKpiDelta] = useState<string>(
    "Projected reduction of NRW water loss from 32% to 18.2%; pinpoint sub-surface leaks within 2m in < 4 hours."
  );
  const [proposedBudget, setProposedBudget] = useState<string>("4,00,000");
  const [proposedDuration, setProposedDuration] = useState<string>("25 Days (Fast-Track Revalidation)");
  const [proposalSubmitted, setProposalSubmitted] = useState<boolean>(false);

  const subTabs = [
    { id: "discovery", label: "Municipal Challenge Radar", shortLabel: "Challenge Radar", badge: `${opportunities.length} Open` },
    { id: "precheck", label: "Readiness Pre-Check", shortLabel: "Readiness Check", badge: "Safe Harbor Pass" },
    { id: "submit", label: "Outcome Proposal Submission", shortLabel: "Submit Proposal", badge: "25-Day Fast-Track" },
    { id: "status", label: "Gate 1 & Gate 2 Evaluation Status", shortLabel: "Evaluation Status", badge: "Rank #1 (88.5)" },
  ];

  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedSector !== "all" && !opp.sector.toLowerCase().includes(selectedSector.toLowerCase())) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return opp.title.toLowerCase().includes(q) || opp.department.toLowerCase().includes(q) || opp.district.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedOpp = opportunities.find((o) => o.id === activeOppId) || filteredOpportunities[0] || opportunities[0];
  const isSelectedApplied = appliedChallenges.some((a) => a.opportunityId === selectedOpp?.id);

  const handleApply = (oppId: string) => {
    applyToOpportunity(oppId, proposedKpiDelta);
    setApplySuccessMessage(`Proposal formally submitted for ${oppId}! Escrow sandbox reserved.`);
    setTimeout(() => setApplySuccessMessage(null), 4000);
    switchSubTab("status");
  };

  const handleProposalFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyToOpportunity(proposalOppId, proposedKpiDelta);
    setProposalSubmitted(true);
    setTimeout(() => {
      setProposalSubmitted(false);
      switchSubTab("status");
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* 1. Slim Persistent Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-[#556B67]">
          <Link href="/?tab=discovery" className="font-bold text-[#1E2D2A] hover:underline">
            ProcSync
          </Link>
          <span>/</span>
          <span>Opportunities & Proposals</span>
          <span>/</span>
          <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
            {subTabs.find((t) => t.id === activeSubTab)?.shortLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#556B67]">
          <strong className="text-[#1E2D2A]">{subTabs.find((t) => t.id === activeSubTab)?.label}</strong>
        </div>
      </div>

      {/* 2. Top Title & Quick Stats Card */}
      <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] font-mono text-[10px] font-bold border border-[#D2B48C]/40">
              PORTAL A • STARTUP ACCESS
            </span>
            <span className="text-[#EBDDDA] text-xs">•</span>
            <span className="text-xs text-[#556B67] font-mono">
              DPIIT: {startupProfile.dpiitId} • MSInS Sandbox
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E2D2A] tracking-tight">
            Municipal Opportunity Radar & Proposal Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#3D5855] font-medium max-w-3xl leading-relaxed">
            Discover departmental outcome-based challenges across Maharashtra municipal corporations. Verify risk-equivalent qualification, submit quantifiable proposals, and track evaluation verdicts.
          </p>
        </div>

        {/* Quick Founder Metric Cards */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#FAF8F6] border border-[#EBDDDA] p-3.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-[#556B67] uppercase block">Linked Passport</span>
            <span className="text-xs font-mono font-black text-[#1E2D2A]">MH-EP-2025-WTR-0042</span>
          </div>
          <div className="bg-[#BFCACC]/20 border border-[#BFCACC]/50 p-3.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-[#2F4541] uppercase block">Fast-Track Status</span>
            <span className="text-xs font-mono font-black text-[#2F4541]">65-Day Bypass Ready</span>
          </div>
        </div>
      </div>

      {applySuccessMessage && (
        <div className="p-4 bg-[#BFCACC]/25 border-2 border-[#BFCACC] text-[#1E2D2A] rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2F4541] shrink-0" />
            {applySuccessMessage}
          </span>
          <span className="text-xs font-mono text-[#2F4541] font-semibold hidden sm:inline">
            Sandbox Escrow Reserved
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MUNICIPAL CHALLENGE RADAR                                      */}
      {/* ========================================================================= */}
      {activeSubTab === "discovery" && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-[#EBDDDA] shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#556B67] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search municipal challenges by title, district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#FAF8F6] border border-[#EBDDDA] rounded-xl text-xs text-[#1E2D2A] placeholder:text-[#556B67] font-medium focus:border-[#2F4541] outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["all", "Water", "Energy", "Agri-Tech"].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec.toLowerCase())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSector === sec.toLowerCase()
                      ? "bg-[#2F4541] text-white shadow-2xs"
                      : "bg-[#FAF8F6] text-[#3D5855] hover:text-[#1E2D2A] border border-[#EBDDDA]"
                  }`}
                >
                  {sec === "all" ? "All Sectors" : sec}
                </button>
              ))}
            </div>
          </div>

          {/* Split Workspace: Left Feed (60%) + Right Interactive Studio (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Feed */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#556B67] font-bold px-1">
                <span>{filteredOpportunities.length} Active Challenges Open in Maharashtra</span>
                <span>Click a challenge to inspect details</span>
              </div>

              {filteredOpportunities.map((opp) => {
                const isSelected = selectedOpp?.id === opp.id;
                const hasApplied = appliedChallenges.some((a) => a.opportunityId === opp.id);

                return (
                  <div
                    key={opp.id}
                    onClick={() => setActiveOppId(opp.id)}
                    className={`bg-white rounded-2xl border-2 transition-all p-5 cursor-pointer relative shadow-2xs hover:shadow-xs ${
                      isSelected
                        ? "border-[#2F4541] bg-[#FAF8F6]"
                        : opp.fastTrackEligible
                        ? "border-[#BFCACC] hover:border-[#2F4541]"
                        : "border-[#EBDDDA] hover:border-[#D2B48C]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA]">
                            {opp.challengeCode}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40">
                            {opp.sector}
                          </span>
                          {opp.fastTrackEligible && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-[#856441]" />
                              <span>EVIDENCE PRE-QUALIFIED</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-[#1E2D2A] tracking-tight mt-1">
                          {opp.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#556B67] font-medium">
                          <Building2 className="w-3.5 h-3.5 text-[#556B67]" />
                          <span>{opp.department} • {opp.district}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-[#2F4541] block">
                          {opp.budgetCap}
                        </span>
                        <span className="text-[10px] font-bold text-[#556B67] font-mono">
                          {opp.duration}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#3D5855] font-medium line-clamp-2 mt-2.5 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EBDDDA]/70 text-xs">
                      {opp.fastTrackEligible ? (
                        <span className="text-[#856441] font-bold text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#856441]" />
                          <span>Saves {opp.timeReduction?.split(" ")[0]} Days via Pune COEP Evidence</span>
                        </span>
                      ) : (
                        <span className="text-[#556B67] text-[11px]">Standard 45-Day Sandbox</span>
                      )}

                      <div className="flex items-center gap-2">
                        {hasApplied && (
                          <span className="text-[11px] font-bold text-[#2F4541] flex items-center gap-1 bg-[#BFCACC]/25 px-2 py-0.5 rounded border border-[#BFCACC]/40">
                            <Check className="w-3.5 h-3.5" /> Proposal Submitted
                          </span>
                        )}
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          isSelected ? "text-[#2F4541]" : "text-[#556B67]"
                        }`}>
                          View Details <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Studio Panel */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              {selectedOpp && (
                <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 space-y-5 shadow-xs">
                  <div className="border-b border-[#EBDDDA]/70 pb-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#556B67]">
                        Challenge Specifications
                      </span>
                      {selectedOpp.fastTrackEligible && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/50 text-[10px] font-mono font-black">
                          94% Match Compatibility
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-black text-[#1E2D2A] tracking-tight">
                      {selectedOpp.title}
                    </h2>
                    <p className="text-xs text-[#556B67] font-medium">
                      {selectedOpp.department}
                    </p>
                  </div>

                  {/* Baseline vs Target Outcome */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA] space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#556B67] block">
                        Measured Baseline Problem:
                      </span>
                      <p className="text-[#1E2D2A] font-medium leading-relaxed">
                        {selectedOpp.baselineProblem}
                      </p>
                    </div>

                    <div className="p-3 bg-[#FAF8F6] rounded-xl border border-[#BFCACC] space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#2F4541] block">
                        Target Quantifiable KPI Threshold:
                      </span>
                      <p className="text-[#1E2D2A] font-bold leading-relaxed">
                        {selectedOpp.targetKPI}
                      </p>
                    </div>
                  </div>

                  {/* Local Constraints */}
                  <div className="space-y-2 pt-2 border-t border-[#EBDDDA]/70">
                    <span className="text-[11px] font-bold text-[#1E2D2A] uppercase tracking-wider block">
                      Local Environmental Constraints:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                        <span className="text-[#556B67] block">Strata</span>
                        <strong className="text-[#1E2D2A] truncate block">{selectedOpp.constraints.soilStrata}</strong>
                      </div>
                      <div className="p-2 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                        <span className="text-[#556B67] block">Pressure</span>
                        <strong className="text-[#1E2D2A] truncate block">{selectedOpp.constraints.pressure}</strong>
                      </div>
                      <div className="p-2 bg-[#FAF8F6] rounded-xl border border-[#EBDDDA]">
                        <span className="text-[#556B67] block">Network</span>
                        <strong className="text-[#1E2D2A] truncate block">{selectedOpp.constraints.network}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Direct Actions */}
                  <div className="pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProposalOppId(selectedOpp.id);
                        switchSubTab("submit");
                      }}
                      className="w-full py-3.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#BFCACC]" />
                      <span>Prepare Outcome Proposal for this Challenge →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchSubTab("precheck")}
                      className="w-full py-2.5 bg-white hover:bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Check Risk-Equivalent Eligibility
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: READINESS PRE-CHECK (§10 RISK-EQUIVALENT ENGINE)               */}
      {/* ========================================================================= */}
      {activeSubTab === "precheck" && (
        <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
          
          <div className="border-b border-[#EBDDDA]/70 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#856441] font-mono text-xs font-bold border border-[#D2B48C]/40">
                STATUTORY QUALIFICATION ENGINE
              </span>
            </div>
            <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
              Readiness Pre-Check & Risk-Equivalent Eligibility
            </h2>
            <p className="text-xs text-[#556B67] font-medium mt-0.5">
              Core principle: <em>"Lower the barrier, not the quality bar."</em> The system verifies deterministic credentials and deconstructs traditional barriers into audited runway and milestone escrow safeguards.
            </p>
          </div>

          {/* Deterministic Verification Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#556B67] tracking-wider">
              Automated Deterministic Entity Checks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-[#1E2D2A]">DPIIT Startup India</strong>
                  <span className="px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] font-mono font-bold text-[10px]">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-[#556B67]">
                  Certificate: <strong>{startupProfile.dpiitId}</strong>
                </p>
                <span className="text-[10px] text-[#2F4541] font-bold block">Status: Active Recognized Startup</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-[#1E2D2A]">Maharashtra Entity</strong>
                  <span className="px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] font-mono font-bold text-[10px]">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-[#556B67]">
                  Registered: <strong>Shivajinagar, Pune</strong>
                </p>
                <span className="text-[10px] text-[#2F4541] font-bold block">Status: MSInS Policy Covered</span>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-[#1E2D2A]">Technology Maturity</strong>
                  <span className="px-2 py-0.5 rounded bg-[#D2B48C]/20 text-[#856441] font-mono font-bold text-[10px]">
                    TRL 7
                  </span>
                </div>
                <p className="text-[11px] text-[#556B67]">
                  Prototype: <strong>Acoustic Correlator Array</strong>
                </p>
                <span className="text-[10px] text-[#856441] font-bold block">Status: Field Trial Proved (PMC)</span>
              </div>
            </div>
          </div>

          {/* Canonical Risk-Equivalent Loop Box (§10) */}
          <div className="p-6 bg-[#FAF8F6] rounded-3xl border-2 border-[#EBDDDA] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#2F4541]" />
                <h3 className="text-sm font-black text-[#1E2D2A]">
                  Deconstruction of Traditional ₹5 Cr Turnover Barrier
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#856441] bg-[#D2B48C]/20 px-2.5 py-1 rounded-full border border-[#D2B48C]/40">
                GFR Rule 149 Safe Harbor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 block">1. Requirement</span>
                <strong className="text-[#1E2D2A] block">₹5 Cr Turnover</strong>
                <p className="text-[11px] text-[#556B67]">Standard municipal RFP exclusion barrier</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#556B67] block">2. Underlying Risk</span>
                <strong className="text-[#1E2D2A] block">Contract Abandonment</strong>
                <p className="text-[11px] text-[#556B67]">Risk of vendor running out of cash mid-trial</p>
              </div>

              <div className="p-3.5 bg-[#F0F4F5] rounded-xl border border-[#BFCACC] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#2F4541] block">3. Alternative Evidence</span>
                <strong className="text-[#1E2D2A] block">14m Cash Runway</strong>
                <p className="text-[11px] text-[#3D5855]">₹48.6L liquid bank balance in SBI Escrow</p>
              </div>

              <div className="p-3.5 bg-[#F7EFE5] rounded-xl border border-[#D2B48C] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#856441] block">4. Assigned Safeguard</span>
                <strong className="text-[#856441] block">Milestone Escrow</strong>
                <p className="text-[11px] text-[#856441]">Zero upfront cash; paid only post-COEP audit</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#EBDDDA] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#2F4541] block">5. Official Outcome</span>
                <strong className="text-[#1E2D2A] block">Exemption Authorized</strong>
                <p className="text-[11px] text-[#556B67]">State Chief Engineer GFR 149 protected</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#EBDDDA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2F4541] shrink-0" />
                <span className="font-bold text-[#1E2D2A]">
                  Your startup qualifies for statutory turnover exemption on all open municipal challenges.
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchSubTab("submit")}
                className="px-5 py-2 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Proceed to Submit Proposal →
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: OUTCOME PROPOSAL SUBMISSION                                    */}
      {/* ========================================================================= */}
      {activeSubTab === "submit" && (
        <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
          
          <div className="border-b border-[#EBDDDA]/70 pb-4">
            <h2 className="text-xl font-black text-[#1E2D2A]">
              Submit Outcome-Based Sandbox Proposal
            </h2>
            <p className="text-xs text-[#556B67] font-medium mt-1">
              Submit your technical proposal against measurable baseline metrics and target outcome KPIs rather than generic marketing claims.
            </p>
          </div>

          <form onSubmit={handleProposalFormSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Target Municipal Challenge:
                </label>
                <select
                  value={proposalOppId}
                  onChange={(e) => setProposalOppId(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                >
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.challengeCode} • {opp.title} ({opp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Proposed Solution & Technical Methodology:
                </label>
                <textarea
                  rows={3}
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-medium text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Target Outcome Metric & Quantifiable Improvement:
                </label>
                <input
                  type="text"
                  value={proposedKpiDelta}
                  onChange={(e) => setProposedKpiDelta(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                />
                <span className="text-[11px] text-[#556B67] font-medium">
                  Must objectively correlate with municipal baseline (e.g. NRW reduction percentage or detection hours).
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Sandbox Trial Budget (Milestone Escrow):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-[#556B67]">₹</span>
                  <input
                    type="text"
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-mono font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                  Sandbox Duration:
                </label>
                <select
                  value={proposedDuration}
                  onChange={(e) => setProposedDuration(e.target.value)}
                  className="w-full p-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-xl text-xs font-bold text-[#1E2D2A] focus:bg-white focus:border-[#2F4541] outline-hidden"
                >
                  <option value="25 Days (Fast-Track Revalidation)">25 Days (Fast-Track Revalidation via PMC Evidence)</option>
                  <option value="45 Days (Proving Sandbox)">45 Days (Mid-Scale Sandbox)</option>
                  <option value="90 Days (Full Sandbox)">90 Days (Full Ground Proving Sandbox)</option>
                </select>
              </div>

            </div>

            {/* Statutory Acknowledgement */}
            <div className="p-4 bg-[#FAF8F6] rounded-2xl border border-[#EBDDDA] text-xs text-[#556B67] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2F4541] shrink-0" />
              <span>
                By submitting, your proposal enters deterministic Gate 1 (Innovation Qualification) and Gate 2 (Procurement Qualification) under COEP independent evaluation.
              </span>
            </div>

            <div className="pt-4 border-t border-[#EBDDDA]/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchSubTab("discovery")}
                className="px-4 py-2 bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ← Back to Challenge Radar
              </button>

              <button
                type="submit"
                disabled={proposalSubmitted}
                className="px-8 py-3.5 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {proposalSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#BFCACC]" />
                    <span>Submitting to Department Registry...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D2B48C]" />
                    <span>Submit Proposal to Municipal Corporation</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: GATE 1 & GATE 2 EVALUATION STATUS                              */}
      {/* ========================================================================= */}
      {activeSubTab === "status" && (
        <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-200">
          
          <div className="border-b border-[#EBDDDA]/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40 text-xs font-mono font-bold">
                  DETERMINISTIC EVALUATION STATUS
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1E2D2A] mt-1">
                Proposal Qualification & Consensus Ranking
              </h2>
            </div>
            <span className="text-xs font-mono font-black text-[#2F4541] bg-[#FAF8F6] border border-[#EBDDDA] px-3 py-1 rounded-full">
              Rank #1 of 3 Proposals (Score: 88.5/100)
            </span>
          </div>

          {/* Active Proposal Card */}
          <div className="p-6 bg-[#FAF8F6] rounded-3xl border-2 border-[#2F4541] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#556B67]">
                  Target Challenge: NMC-WTR-2025 • Nashik Municipal Corp
                </span>
                <h3 className="text-base font-black text-[#1E2D2A]">
                  Sub-Surface Acoustic Leak Detection Array (15km Basalt Pipeline)
                </h3>
                <p className="text-xs text-[#556B67] font-medium mt-0.5">
                  Submitted by: <strong>AcoustiLeak Sensors Pvt Ltd</strong> (DPIIT: DIPP99421)
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-mono font-bold text-[#556B67] block">Weighted Consensus</span>
                <span className="text-3xl font-mono font-black text-[#2F4541]">88.5 / 100</span>
              </div>
            </div>

            {/* Three-Gate Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 bg-white rounded-2xl border border-[#EBDDDA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2F4541] uppercase tracking-wider block">
                    Gate 1 — Innovation Qualification
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#BFCACC]/25 text-[#2F4541] border border-[#BFCACC]/40">
                    PASSED (95/100)
                  </span>
                </div>
                <p className="text-xs text-[#556B67] leading-relaxed font-medium">
                  TRL 7 verified by COEP Technological University. Physics model proves acoustic velocity transit time matching basalt geology without pipe perforation.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EBDDDA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#856441] uppercase tracking-wider block">
                    Gate 2 — Procurement Qualification
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40">
                    SAFE HARBOR PASS
                  </span>
                </div>
                <p className="text-xs text-[#556B67] leading-relaxed font-medium">
                  Turnover barrier exempted under GFR Rule 149 Safe Harbor in lieu of 14-month audited cash runway and milestone escrow safeguards.
                </p>
              </div>

            </div>

            {/* Next Milestone Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#556B67]">
                <Award className="w-4 h-4 text-[#2F4541] shrink-0" />
                <span>Selection Memo Signed! Procurement Readiness Passport #MH-EP-2025-WTR-0042 created in IN_PROGRESS.</span>
              </div>

              <Link
                href="/trials?tab=milestones"
                className="px-6 py-3 bg-[#2F4541] hover:bg-[#1E2D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Proceed to Sandbox Trials & Escrow</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function StartupOpportunitiesPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#3D5855]">Loading Opportunities & Proposal Studio...</div>}>
      <StartupOpportunitiesContent />
    </React.Suspense>
  );
}

