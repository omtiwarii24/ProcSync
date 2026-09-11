"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Check,
  History,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Sliders,
  Scale,
  Hash,
  ExternalLink
} from "lucide-react";

function TemplatesAndGovernanceContent() {
  const searchParams = useSearchParams();
  const { currentRole } = useApp();

  // 3 Canonical Sub-Tabs per GOVERNMENT_PORTAL_TABS_v4.md Section 2 (Tab 7)
  type SubTabId = "registry" | "usage" | "audit";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("registry");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["registry", "usage", "audit"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["registry", "usage", "audit"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  // Selected Category filter in Registry
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTemplateId, setSelectedTemplateId] = useState("TPL-DATA-IP-01");
  const [approvalSimulation, setApprovalSimulation] = useState<string | null>(null);

  const subTabs = [
    {
      id: "registry",
      label: "Approved Templates Registry",
      shortLabel: "Approved Templates",
      badge: "7 Standard Types",
      desc: "Draft → LegalApproved lifecycle across standard government innovation templates",
    },
    {
      id: "usage",
      label: "Template Usage & Version Tracking",
      shortLabel: "Usage & Versions",
      badge: "Version Pinned",
      desc: "Audit trace showing which challenge or pilot generated documents from which template version",
    },
    {
      id: "audit",
      label: "Immutable Governance Audit Log",
      shortLabel: "Governance Audit Log",
      badge: "SHA-256 Sealed",
      desc: "Complete immutable log of all human approvals, waivers, sign-offs, and authorizations",
    },
  ];

  const templates = [
    {
      id: "TPL-DATA-IP-01",
      code: "TPL-DATA-IP-v2.1",
      category: "Data & IP",
      name: "Standard Government Telemetry & Startup Model IP Separation Clause",
      version: "v2.1",
      status: "LegalApproved",
      approvedBy: "State Law & Judiciary Dept (Govt of Maharashtra)",
      approvalDate: "2025-01-14",
      sha256: "4d8a1c9e3b72f108a9c40217ef65ba10",
      description:
        "Strictly bifurcates telemetry ownership. Raw sensor streams and ground truth coordinates are declared public government assets; startup retains all core ML neural network weights and proprietary hardware firmware.",
      preview:
        "Clause 14.2: All raw data, sensor time-series telemetry, acoustic recordings, and GIS coordinates ingested during the Pilot Sandbox shall vest unconditionally with the Municipal Corporation / State Department as Public Data Assets. The Innovator shall retain full, unencumbered proprietary title and intellectual property rights in their underlying algorithmic weights, signal filtering heuristics, and hardware firmware.",
    },
    {
      id: "TPL-RISK-01",
      code: "TPL-RISK-v1.4",
      category: "Risk Register",
      name: "Hardware Attenuation & Environmental Soil Boundary Risk Clause",
      version: "v1.4",
      status: "LegalApproved",
      approvedBy: "State Innovation Society (MSInS) Technical Directorate",
      approvalDate: "2025-02-02",
      sha256: "7f4b0e891c3e2d879b5a104e9c230491",
      description:
        "Mandates standard mitigation protocols for terrain differences. Pre-empts attenuation in hard basalt rock via 16 kHz sampling and edge store-and-forward buffers.",
      preview:
        "Clause 8.1: In the event of geological or terrain anomalies exceeding pre-trial baseline envelopes (e.g. hard Deccan basalt strata vs. alluvial loam), the Innovator shall deploy multi-sensor cross-correlation arrays at intervals not exceeding 1.25 km, maintaining an independent edge buffer of no less than 72 hours.",
    },
    {
      id: "TPL-ESCROW-01",
      code: "TPL-ESCROW-v3.0",
      category: "Pilot Agreement",
      name: "Automated Three-Stage Escrow Sandbox Disbursement Agreement",
      version: "v3.0",
      status: "LegalApproved",
      approvedBy: "Finance Department & SBI Special Escrow Cell",
      approvalDate: "2025-02-18",
      sha256: "9b5a104e9c230491de882190ac7731f2",
      description:
        "Enforces the canonical 30% - 40% - 30% milestone release roadmap linked mathematically to third-party academic evaluation sign-offs.",
      preview:
        "Clause 4.3: Milestone disbursements from the SBI State Innovation Escrow Sandbox shall proceed under the following strict schedule: (i) Stage 1: 30% on hardware deployment; (ii) Stage 2: 40% upon field telemetry capture and third-party academic PASS evaluation; (iii) Stage 3: 30% upon final physical ground-truth excavation sign-off.",
    },
    {
      id: "TPL-CYBER-01",
      code: "TPL-CYBER-v2.0",
      category: "Cybersecurity",
      name: "State Digital Infrastructure & CERT-In VPC Isolation Schedule",
      version: "v2.0",
      status: "LegalApproved",
      approvedBy: "Maharashtra State Cyber Security Cell",
      approvalDate: "2025-03-01",
      sha256: "104e9c230491de882190ac7731f27f4b",
      description:
        "Mandates AES-256 encryption at rest and in transit. Restricts all cloud API endpoints to India-region sovereign cloud instances.",
      preview:
        "Clause 19.1: All edge telemetry transmitters shall execute cryptographic signing using SHA-256 HMAC tokens. Ingestion servers must reside strictly within MeitY-empaneled sovereign cloud data centers situated within the physical boundaries of the Republic of India.",
    },
    {
      id: "TPL-GFR166-01",
      code: "TPL-PROC-v1.1",
      category: "Procurement Pathway",
      name: "GFR Rule 166 Single-Source Exemption Justification Filing",
      version: "v1.1",
      status: "LegalApproved",
      approvedBy: "Directorate of Public Procurement (Finance Dept)",
      approvalDate: "2025-03-22",
      sha256: "3c8e41a987d60f54b2a110e982143091",
      description:
        "Standardized justification memo citing empirical pilot outcomes and economic savings to satisfy CAG and CVC audit scrutiny.",
      preview:
        "Clause 2.4: Whereas the Innovator has completed a formal Pilot Sandbox under the Maharashtra State Innovation Procurement Framework, achieving 91.4% verified accuracy and demonstrating an 80.7% cost reduction against legacy manual methods, single-source procurement is justified under GFR Rule 166 safe harbor provisions.",
    },
    {
      id: "TPL-DRAFT-01",
      code: "TPL-EVAL-v3.0-DRAFT",
      category: "Evaluation Criteria",
      name: "Standard Multi-Disciplinary Expert Jury Scoring Rubric (Draft)",
      version: "v3.0-DRAFT",
      status: "Draft",
      approvedBy: "Pending Law Dept Review",
      approvalDate: "In Draft",
      sha256: "Pending-Approval",
      description:
        "Updated evaluation weights incorporating sustainability KPIs (water conservation deltas) into the Gate 1 Innovation scoring framework.",
      preview:
        "Draft Clause: Environmental impact metrics shall contribute up to 10 bonus points in Gate 1 evaluation where verifiable carbon offset or potable water preservation exceeding 10 Lakh liters/month is demonstrated.",
    },
  ];

  const filteredTemplates =
    selectedCategory === "ALL"
      ? templates
      : templates.filter((t) => t.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleSimulateApproval = () => {
    setApprovalSimulation("Submitting draft template to State Legal Dept for formal clearance...");
    setTimeout(() => {
      setApprovalSimulation(
        "Formally Cleared! Status updated to LegalApproved (SHA-256: 8a1c9e4d... Stamped)."
      );
    }, 900);
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
          <span className="text-[#3D5855] font-bold">Template Library &amp; Governance</span>
          <span>/</span>
          <span className="text-[#2F4541] font-bold bg-[#BFCACC]/20 px-2 py-0.5 rounded border border-[#BFCACC]/40">
            {subTabs.find((t) => t.id === activeSubTab)?.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#556B67] hidden sm:inline">Governance Status:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold">
            LegalApproved Sandbox
          </span>
        </div>
      </div>

      {/* 2. HERO & GOVERNANCE HEADER */}
      <div className="bg-white rounded-2xl border-2 border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E2D2A] tracking-tight flex flex-wrap items-center gap-3">
              <span>Template Library &amp; Governance</span>
              <span className="text-xs font-bold px-3 py-1 bg-[#BFCACC]/25 text-[#2F4541] rounded-full border border-[#BFCACC]/40 font-mono">
                Immutable State Audit Trail
              </span>
            </h1>

            <p className="text-[#3D5855] text-sm sm:text-base font-medium mt-1 max-w-3xl leading-relaxed">
              Admin &amp; Legal author and formally approve standardized clauses once (Draft &rarr; LegalApproved). Challenge Builder and Pilot Builder pull these approved templates as pre-filled starting points, creating a tamper-evident audit trace.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono font-bold text-[#2F4541] bg-[#FAF8F6] px-3 py-2 rounded-xl border border-[#EBDDDA]">
              Role: MSInS / State Admin
            </span>
          </div>
        </div>

        {/* 3. HORIZONTAL SUB-TAB SWITCHER (v4 Full-width pattern) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-[#EBDDDA] pt-5 scrollbar-thin">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/templates?tab=${tab.id}`}
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
      {/* SUB-TAB 1: APPROVED TEMPLATES REGISTRY (§21)                              */}
      {/* ========================================================================= */}
      {activeSubTab === "registry" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            {["ALL", "Data & IP", "Risk Register", "Pilot Agreement", "Cybersecurity", "Procurement Pathway", "Evaluation Criteria"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 border cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#2F4541] text-white border-[#2F4541] shadow-2xs"
                      : "bg-white text-[#3D5855] border-[#EBDDDA] hover:bg-[#FAF8F6]"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Master Two-Column Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Template List (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EBDDDA] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EBDDDA] pb-3">
                <span className="text-xs font-mono font-bold uppercase text-[#3D5855] tracking-wider">
                  APPROVED REGISTRY ({filteredTemplates.length})
                </span>
                <span className="text-xs text-[#556B67] font-mono">Draft &rarr; LegalApproved</span>
              </div>

              <div className="space-y-2.5">
                {filteredTemplates.map((t) => {
                  const isSelected = selectedTemplateId === t.id;
                  const isApproved = t.status === "LegalApproved";
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#2F4541] bg-[#FAF8F6] shadow-xs"
                          : "border-[#EBDDDA] hover:border-[#BFCACC] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#2F4541]">{t.code}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isApproved
                              ? "bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60"
                              : "bg-[#D2B48C]/25 text-[#856441] border border-[#D2B48C]/50"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#2F4541] mt-1 line-clamp-1">{t.name}</h4>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-[#556B67] font-medium">
                        <span>{t.category}</span>
                        <span>{t.version}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Template Detail & Legal Clause Inspector (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBDDDA] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] px-2.5 py-0.5 rounded">
                      {activeTemplate.code}
                    </span>
                    <span className="text-xs font-mono text-[#556B67]">Category: {activeTemplate.category}</span>
                  </div>
                  <h3 className="text-lg font-black text-[#2F4541]">{activeTemplate.name}</h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold shrink-0 ${
                    activeTemplate.status === "LegalApproved"
                      ? "bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60"
                      : "bg-[#D2B48C]/25 text-[#856441] border border-[#D2B48C]/50"
                  }`}
                >
                  {activeTemplate.status}
                </span>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F6] p-4 rounded-xl border border-[#EBDDDA]">
                <div>
                  <span className="text-[#556B67] font-bold block">Authorizing Authority:</span>
                  <span className="text-[#2F4541] font-medium">{activeTemplate.approvedBy}</span>
                </div>
                <div>
                  <span className="text-[#556B67] font-bold block">Effective Clearance Date:</span>
                  <span className="text-[#2F4541] font-mono">{activeTemplate.approvalDate}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#556B67] font-bold block">Cryptographic Template Digest:</span>
                  <code className="text-[#2F4541] font-mono text-[11px]">{activeTemplate.sha256}</code>
                </div>
              </div>

              {/* Rationale */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2F4541] block">
                  Clause Purpose &amp; Regulatory Rationale
                </span>
                <p className="text-xs text-[#3D5855] leading-relaxed font-medium">
                  {activeTemplate.description}
                </p>
              </div>

              {/* Official Standard Clause Text */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2F4541] block">
                  Formal Standardized Legal Language (Pre-Filled into Workflows)
                </span>
                <div className="p-4 bg-[#1E2D2A] text-[#FAF8F6] rounded-xl font-mono text-xs leading-relaxed border border-[#2F4541]">
                  {activeTemplate.preview}
                </div>
              </div>

              {activeTemplate.status === "Draft" && (
                <div className="p-4 bg-[#D2B48C]/20 border border-[#D2B48C]/50 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#856441] shrink-0" />
                    <span className="text-xs font-medium text-[#856441]">
                      Draft template awaiting formal approval from Legal Department.
                    </span>
                  </div>
                  <button
                    onClick={handleSimulateApproval}
                    className="px-4 py-2 bg-[#856441] text-white rounded-lg text-xs font-bold hover:bg-[#6b5033] transition-colors shrink-0 cursor-pointer"
                  >
                    Simulate Formal Approval
                  </button>
                </div>
              )}

              {approvalSimulation && (
                <div className="p-3 bg-[#BFCACC]/20 border border-[#BFCACC]/50 rounded-xl text-xs font-mono font-bold text-[#2F4541] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F4541] shrink-0" />
                  <span>{approvalSimulation}</span>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
                <Link
                  href="/challenge"
                  className="text-xs font-bold text-[#2F4541] hover:text-[#1E2D2A] flex items-center gap-1.5"
                >
                  <span>Use in Challenge Builder (Tab 2)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setActiveSubTab("usage")}
                  className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>View Template Usage Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TEMPLATE USAGE & VERSION TRACKING (§21)                        */}
      {/* ========================================================================= */}
      {activeSubTab === "usage" && (
        <div className="space-y-6">
          {/* Safe Harbor Rule Box (§21 Step 3) */}
          <div className="p-5 bg-[#2F4541] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  VERSION PINNING GUARANTEE
                </span>
                <p className="text-xs text-[#EBDDDA] mt-0.5 leading-relaxed font-medium">
                  Every issued pilot agreement and challenge document records its source template version. A later template revision never retroactively alters already-issued legal documents.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#1E2D2A] text-[#D2B48C] border border-[#D2B48C]/40 rounded-lg text-xs font-mono font-bold shrink-0">
              Immutable TemplateUsage Entity
            </span>
          </div>

          {/* Traceability Table Card */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Active Document Template Traceability Matrix
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Audit trail mapping challenges and active pilot sandbox contracts to their pinned template versions.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] font-mono text-xs rounded-lg font-bold">
                5 Active Work Orders Bound
              </span>
            </div>

            <div className="border border-[#EBDDDA] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF8F6] text-[#2F4541] font-bold uppercase text-[11px] font-mono border-b border-[#EBDDDA]">
                  <tr>
                    <th className="py-3 px-4">Contract / Challenge ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Template Applied</th>
                    <th className="py-3 px-4">Pinned Version</th>
                    <th className="py-3 px-4">Execution Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBDDDA] text-xs">
                  <tr className="hover:bg-[#FAF8F6]">
                    <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">NMC-PLT-2025-04</td>
                    <td className="py-3 px-4 font-medium text-[#3D5855]">Nashik Municipal Corp</td>
                    <td className="py-3 px-4 text-[#2F4541]">TPL-DATA-IP (Telemetry Ownership)</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#2F4541] bg-[#BFCACC]/20 border border-[#BFCACC]/40 px-2 py-0.5 rounded">
                        v2.1
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#556B67]">2025-05-01</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60 rounded-full font-bold text-[10px]">
                        ACTIVE SANDBOX
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F6]">
                    <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">NMC-PLT-2025-04</td>
                    <td className="py-3 px-4 font-medium text-[#3D5855]">Nashik Municipal Corp</td>
                    <td className="py-3 px-4 text-[#2F4541]">TPL-RISK (Basalt Rock Mitigation)</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#2F4541] bg-[#BFCACC]/20 border border-[#BFCACC]/40 px-2 py-0.5 rounded">
                        v1.4
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#556B67]">2025-05-01</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60 rounded-full font-bold text-[10px]">
                        ACTIVE SANDBOX
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F6]">
                    <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">PMC-WTR-2025-01</td>
                    <td className="py-3 px-4 font-medium text-[#3D5855]">Pune Municipal Corp</td>
                    <td className="py-3 px-4 text-[#2F4541]">TPL-ESCROW (Disbursement Roadmap)</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#3D5855] bg-[#FAF8F6] border border-[#EBDDDA] px-2 py-0.5 rounded">
                        v3.0
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#556B67]">2025-01-18</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#FAF8F6] text-[#3D5855] border border-[#EBDDDA] rounded-full font-bold text-[10px]">
                        SETTLED / CLOSED
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F6]">
                    <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">NMC-CHAL-2025-01</td>
                    <td className="py-3 px-4 font-medium text-[#3D5855]">Nashik Municipal Corp</td>
                    <td className="py-3 px-4 text-[#2F4541]">TPL-DATA-IP (Data Custody)</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#2F4541] bg-[#BFCACC]/20 border border-[#BFCACC]/40 px-2 py-0.5 rounded">
                        v2.1
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#556B67]">2025-04-12</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#D2B48C]/25 text-[#856441] border border-[#D2B48C]/50 rounded-full font-bold text-[10px]">
                        PUBLISHED
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F6]">
                    <td className="py-3 px-4 font-mono font-bold text-[#2F4541]">NGP-MND-2025-02</td>
                    <td className="py-3 px-4 font-medium text-[#3D5855]">Nagpur APMC Mandi</td>
                    <td className="py-3 px-4 text-[#2F4541]">TPL-CYBER (Edge Sovereignty)</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#2F4541] bg-[#BFCACC]/20 border border-[#BFCACC]/40 px-2 py-0.5 rounded">
                        v2.0
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#556B67]">2025-03-25</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#D2B48C]/25 text-[#856441] border border-[#D2B48C]/50 rounded-full font-bold text-[10px]">
                        PUBLISHED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
              <button
                onClick={() => setActiveSubTab("registry")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Registry</span>
              </button>

              <button
                onClick={() => setActiveSubTab("audit")}
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View Immutable Governance Audit Log</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: IMMUTABLE GOVERNANCE AUDIT LOG (§20, §27)                      */}
      {/* ========================================================================= */}
      {activeSubTab === "audit" && (
        <div className="space-y-6">
          {/* Zero AI Authority Box (§20) */}
          <div className="p-5 bg-[#2F4541] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-[#D2B48C] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-[#D2B48C] uppercase tracking-wider block">
                  IMMUTABLE GOVERNANCE INTEGRITY
                </span>
                <p className="text-xs text-[#EBDDDA] mt-0.5 leading-relaxed font-medium">
                  Every challenge publish, eligibility waiver, evaluator scoring, milestone disbursement, and scale decision is immutably logged with actor identity and SHA-256 state stamp. Zero unchecked AI authority.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#1E2D2A] text-[#D2B48C] border border-[#D2B48C]/40 rounded-lg text-xs font-mono font-bold shrink-0">
              Tamper-Evident Ledger Active
            </span>
          </div>

          {/* Chronological Audit Stream */}
          <div className="bg-white rounded-2xl border border-[#EBDDDA] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBDDDA] pb-4">
              <div>
                <h2 className="text-xl font-black text-[#2F4541]">
                  Statewide Procurement Governance Audit Stream
                </h2>
                <p className="text-sm text-[#3D5855] font-medium mt-0.5">
                  Chronological record of official human determinations and cryptographic transactions.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#FAF8F6] text-[#2F4541] border border-[#EBDDDA] font-mono text-xs rounded-lg font-bold">
                6 Verified Entries Logged
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  step: "DECISION AUTHORIZED",
                  action: "PROCUREMENT_DECISION_AUTHORIZED",
                  actor: "Shri Sanjay More (Procurement Authority, NMC)",
                  role: "Procurement Authority",
                  timestamp: "2025-05-14 16:22 IST",
                  details: "Decision SCALE formally authorized for AcoustiLeak Sensors via Direct Procurement (Rule 166 GFR). Written justification memo committed.",
                  sha256: "SHA256: 8f4b0e891c3e2d879b5a104e9c230491",
                  status: "COMMITTED",
                },
                {
                  step: "PAYMENT DISBURSED",
                  action: "MILESTONE_PAYMENT_DISBURSED",
                  actor: "Smt. Ananya Deshmukh (Chief Accounts Officer, NMC)",
                  role: "Finance",
                  timestamp: "2025-05-02 11:15 IST",
                  details: "Milestone 1 (30% Escrow = ₹1,20,000) disbursed via SBI Escrow Gateway (UTR: SBIN00492810284). Verified hardware deployment.",
                  sha256: "SHA256: 3c8e41a987d60f54b2a110e982143091",
                  status: "SETTLED",
                },
                {
                  step: "EVALUATION SIGNED",
                  action: "INDEPENDENT_EVALUATION_SIGNED",
                  actor: "Dr. Vidya Joshi (Professor & Head, COEP Univ)",
                  role: "Independent Evaluator",
                  timestamp: "2025-05-12 14:32 IST",
                  details: "Milestone 2 technical evidence evaluated. Acoustic frequency waveform verified; 1.14m excavation accuracy confirmed. PASS verdict stamped.",
                  sha256: "SHA256: 7F4B0E891C3E2D879B5A104E9C230491DE",
                  status: "VERIFIED",
                },
                {
                  step: "SELECTION SIGN-OFF",
                  action: "FINAL_STARTUP_SELECTION_SIGNOFF",
                  actor: "Municipal Commissioner (NMC) & Selection Panel",
                  role: "Department Owner",
                  timestamp: "2025-04-28 17:40 IST",
                  details: "AcoustiLeak Sensors Pvt Ltd selected (Score: 88.5, Rank 1). Procurement Readiness Passport minted in IN_PROGRESS state.",
                  sha256: "SHA256: 9b5a104e9c230491de882190ac7731f2",
                  status: "AWARDED",
                },
                {
                  step: "WAIVER APPROVED",
                  action: "RISK_EQUIVALENT_WAIVER_APPROVED",
                  actor: "Shri Rajesh Patwardhan (Chief Engineer, Water)",
                  role: "Problem Owner",
                  timestamp: "2025-04-20 10:05 IST",
                  details: "Turnover criterion waived under the safe harbor provision. Replaced by audited 14-month cash runway and COEP testbed report.",
                  sha256: "SHA256: 104e9c230491de882190ac7731f27f4b",
                  status: "WAIVED",
                },
                {
                  step: "CHALLENGE PUBLISHED",
                  action: "CHALLENGE_OFFICIALLY_PUBLISHED",
                  actor: "Nashik Municipal Corporation (Water Supply Division)",
                  role: "Department Owner",
                  timestamp: "2025-04-12 09:00 IST",
                  details: "Outcome challenge NMC-WTR-2025 published to state portal after zero-duplication historical passport check.",
                  sha256: "SHA256: 4d8a1c9e3b72f108a9c40217ef65ba10",
                  status: "PUBLISHED",
                },
              ].map((entry, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-white text-[#2F4541] border border-[#EBDDDA] px-2 py-0.5 rounded">
                        {entry.step}
                      </span>
                      <h4 className="text-xs font-mono font-bold text-[#2F4541]">{entry.action}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#556B67]">{entry.timestamp}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/60">
                        {entry.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#2F4541] font-medium leading-relaxed">{entry.details}</p>

                  <div className="pt-1 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#556B67] border-t border-[#EBDDDA]">
                    <span>Actor: <strong className="text-[#2F4541]">{entry.actor}</strong></span>
                    <span>State Hash: <code>{entry.sha256}</code></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#EBDDDA]">
              <button
                onClick={() => setActiveSubTab("usage")}
                className="px-4 py-2 border border-[#EBDDDA] text-[#2F4541] rounded-xl text-xs font-bold hover:bg-[#FAF8F6] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Usage Tracking</span>
              </button>

              <Link
                href="/"
                className="px-6 py-3 bg-[#2F4541] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D2A] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Return to Analytics &amp; Command Center (Tab 1)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplatesAndGovernancePage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#3D5855]">Loading Templates & Governance...</div>}>
      <TemplatesAndGovernanceContent />
    </React.Suspense>
  );
}
