"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useApp, PersonaType } from "@/context/AppContext";
import { useTranslation } from "@/context/TranslationContext";
import { AshokaEmblem } from "@/components/AshokaEmblem";
import {
  ChevronDown,
  Check,
  Search,
  Globe,
  Shield,
  Layers,
  FileCheck,
  TrendingUp,
  Cpu,
  Award,
  BookOpen,
  ArrowRight,
  Menu,
  X
} from "lucide-react";

interface SubTabItem {
  id: string;
  name: string;
  desc: string;
  queryParam?: string;
}

interface NavTab {
  id: string;
  label: string;
  href: string;
  badge?: string;
  subTabs: SubTabItem[];
}

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const { activePersona, setActivePersona } = useApp();
  const { language, setLanguage, translating } = useTranslation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedTab, setMobileExpandedTab] = useState<string | null>(null);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard accessibility: Escape key closes all open menus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setRoleDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Graceful hover handlers with 220ms debounce so cursor never drops when moving into the menu
  const handleTabMouseEnter = (id: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(id);
  };

  const handleTabMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 220);
  };

  // Canonical 6 Roles from GOVERNMENT_PORTAL_TABS_v4.md Section 0
  const personas: {
    id: PersonaType;
    roleTitle: string;
    name: string;
    org: string;
    badge: string;
    serviceId: string;
  }[] = [
    {
      id: "MSINS_ADMIN",
      roleTitle: "MSInS / Admin",
      name: "State Administrator",
      org: "MSInS • Mantralaya, Mumbai",
      badge: "Full Access (All 7 Tabs)",
      serviceId: "MSINS-ADM-001",
    },
    {
      id: "DEPT_NASHIK",
      roleTitle: "Department / Problem Owner",
      name: "Er. Sanjay Deshmukh",
      org: "Chief Engineer • Nashik Municipal Corp",
      badge: "Problem Owner",
      serviceId: "NMC-CE-2201",
    },
    {
      id: "EVALUATOR",
      roleTitle: "Independent Evaluator",
      name: "Dr. Vidya Joshi",
      org: "Head of Hydraulics • COEP Pune",
      badge: "Academic Lead",
      serviceId: "COEP-HYD-007",
    },
    {
      id: "STARTUP",
      roleTitle: "Pilot Manager",
      name: "Pilot Field Manager",
      org: "Water Works Dept • Nashik Zone 4",
      badge: "Field Operations",
      serviceId: "NMC-WTR-3301",
    },
    {
      id: "DEPT_PUNE",
      roleTitle: "Finance / Accounts",
      name: "Chief Accounts Officer",
      org: "Municipal Accounts & Audit Dept",
      badge: "Finance Gate",
      serviceId: "PMC-FA-1104",
    },
  ];

  const currentPersona = personas.find((p) => p.id === activePersona) || personas[0];

  // The 7 Top-Level Tabs & Sub-Tabs defined in GOVERNMENT_PORTAL_TABS_v4.md
  const tabs: NavTab[] = [
    {
      id: "analytics",
      label: "Analytics",
      href: "/?tab=metrics",
      subTabs: [
        {
          id: "metrics",
          name: "Statewide Pipeline & Macro Metrics",
          desc: "Total pilots, active trial funding, evidence-reuse time saved, avg time-to-decision",
          queryParam: "tab=metrics",
        },
        {
          id: "queue",
          name: "Urgent Action & Approval Queue",
          desc: "Pending final selections, milestone payment releases, and human decision authorizations",
          queryParam: "tab=queue",
        },
        {
          id: "duplicate",
          name: "Zero-Duplication Tracker",
          desc: "Real-time alerts on duplicate pilots prevented because an Evidence Passport existed",
          queryParam: "tab=duplicate",
        },
        {
          id: "map",
          name: "Statewide Pilot Map",
          desc: "Geographic live status of active, completed, and fast-tracked pilots by district",
          queryParam: "tab=map",
        },
      ],
    },
    {
      id: "challenges",
      label: "Challenges",
      href: "/challenge?tab=problem",
      subTabs: [
        {
          id: "problem",
          name: "Problem & Baseline Definition",
          desc: "Outcome-based problem statement, baseline metric, target reduction, constraints, KPIs",
          queryParam: "tab=problem",
        },
        {
          id: "evidence_check",
          name: "Historical Evidence Check",
          desc: "Automatic search across finalized Passports to prevent duplicate spend before publishing",
          queryParam: "tab=evidence_check",
        },
        {
          id: "startup_discovery",
          name: "Startup Discovery Scan",
          desc: "AI-generated queries scan the live public web and rank relevant Indian startups for this challenge",
          queryParam: "tab=startup_discovery",
        },
        {
          id: "eligibility",
          name: "Eligibility & Risk-Equivalent Criteria",
          desc: "Deterministic eligibility checks and alternative-evidence mappings for early-stage startups",
          queryParam: "tab=eligibility",
        },
        {
          id: "templates",
          name: "Template Library Selection",
          desc: "Pre-fill standardized data, IP, and milestone clauses from the approved MSInS library",
          queryParam: "tab=templates",
        },
      ],
    },
    {
      id: "evaluation",
      label: "Evaluation",
      href: "/evaluator?tab=dossier",
      subTabs: [
        {
          id: "dossier",
          name: "Proposal Dossier & Screening",
          desc: "Deterministic automated eligibility checks and manual exception/waiver review",
          queryParam: "tab=dossier",
        },
        {
          id: "gate1",
          name: "Gate 1 — Innovation Qualification",
          desc: "Solution quality: TRL maturity, technical capability, deployments, and expected outcomes",
          queryParam: "tab=gate1",
        },
        {
          id: "gate2",
          name: "Gate 2 — Risk-Equivalent Qualification",
          desc: "Requirement → Underlying Risk → Alternative Evidence → Safeguard → Human Decision",
          queryParam: "tab=gate2",
        },
        {
          id: "consensus",
          name: "Consensus Scoring & Selection Sign-off",
          desc: "Deterministic weighted ranking (Impact 35%, Cost 20%) with mandatory human award sign-off",
          queryParam: "tab=consensus",
        },
      ],
    },
    {
      id: "pilots",
      label: "Pilots & Decision",
      href: "/pilot",
      subTabs: [
        {
          id: "builder",
          name: "Pilot Builder & Milestones",
          desc: "Scope, timeline, milestone deliverables, KPIs, data/IP terms, and risk register",
          queryParam: "tab=builder",
        },
        {
          id: "dashboard",
          name: "Execution Dashboard",
          desc: "Live tracking of active pilot execution, milestone health, and field deliverables",
          queryParam: "tab=dashboard",
        },
        {
          id: "validation",
          name: "Evidence Engine & Validation Lab",
          desc: "AI extraction with source traceability, confidence triage, and independent evaluator sign-off",
          queryParam: "tab=validation",
        },
        {
          id: "payment",
          name: "Milestone Payment Approval",
          desc: "Strict state machine: Pending → Invoiced → Approved → Disbursed linked to verified evidence",
          queryParam: "tab=payment",
        },
        {
          id: "decision",
          name: "Decision & Procurement Route",
          desc: "Deterministic STOP / ADAPT / REVALIDATE / SCALE; selects Procurement Route if SCALE",
          queryParam: "tab=decision",
        },
      ],
    },
    {
      id: "replication",
      label: "Replication",
      href: "/replication",
      subTabs: [
        {
          id: "comparison",
          name: "5-Dimension Context Comparison",
          desc: "Algorithmic match: Problem, Technology, Infrastructure, Data, and Environment",
          queryParam: "tab=comparison",
        },
        {
          id: "split",
          name: "Reusable vs. Revalidate Split",
          desc: "Explicit separation of Reusable protocols/algorithms vs. Must-Revalidate local factors",
          queryParam: "tab=split",
        },
        {
          id: "memory",
          name: "Failure-Aware Institutional Memory",
          desc: "Replication warnings from past historical pilots with matching failure constraints",
          queryParam: "tab=failure",
        },
        {
          id: "targeted",
          name: "Targeted Pilot Recommendation",
          desc: "Scaled-down 25-day follow-up pilot recommendation; hands off to Tab 4 Pilot Builder",
          queryParam: "tab=targeted",
        },
      ],
    },
    {
      id: "passports",
      label: "Passports",
      href: "/passport",
      subTabs: [
        {
          id: "unified",
          name: "Unified Passport Record",
          desc: "Master credential record with running readiness status: READY / CONDITIONAL / NOT READY",
          queryParam: "tab=unified",
        },
        {
          id: "kpis",
          name: "Audited KPIs & Baseline Deltas",
          desc: "Baseline vs. achieved field outcomes with independent academic validator signature",
          queryParam: "tab=kpis",
        },
        {
          id: "conditions",
          name: "Operational, Data & IP Conditions",
          desc: "Implementation conditions, cybersecurity checks, data requirements, and IP ownership firewall",
          queryParam: "tab=conditions",
        },
        {
          id: "compliance",
          name: "Compliance Documentation Bundle",
          desc: "Pre-compiled reference bundle for the Procurement Authority's compliance filing",
          queryParam: "tab=compliance",
        },
      ],
    },
    {
      id: "templates",
      label: "Templates",
      href: "/templates",
      subTabs: [
        {
          id: "registry",
          name: "Approved Templates Registry",
          desc: "Draft → LegalApproved lifecycle across 7 standard government pilot template types",
          queryParam: "tab=registry",
        },
        {
          id: "usage",
          name: "Template Usage & Version Tracking",
          desc: "Audit trace showing which challenge or pilot generated documents from which template version",
          queryParam: "tab=usage",
        },
        {
          id: "audit",
          name: "Immutable Governance Audit Log",
          desc: "Complete immutable log of all human approvals, waivers, sign-offs, and authorizations",
          queryParam: "tab=audit",
        },
      ],
    },
  ];

  // Helper to determine if a top-level tab is currently active
  const isTabActive = (tabHref: string) => {
    const basePath = tabHref.split("?")[0];
    // Home ("/") must match exactly, otherwise every route highlights Analytics
    if (basePath === "/") return pathname === "/";
    return pathname.startsWith(basePath);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EBDDDA] text-[#1E2D2A] shadow-xs">
      
      {/* 1. National Tricolor Ribbon (4px) */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]"></div>
        <div className="h-full flex-1 bg-[#FFFFFF]"></div>
        <div className="h-full flex-1 bg-[#138808]"></div>
      </div>

      {/* 1b. Top Micro-Bar: Official State Banner & Active Officer Identity */}
      <div className="bg-[#2F4541] text-white text-xs px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 font-medium border-b border-[#2F4541]/40">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#BFCACC] hidden md:inline">
            MSInS Innovation Procurement Sandbox
          </span>
          <span className="text-[#BFCACC] hidden sm:inline">•</span>
          <span className="text-[#D2B48C] font-mono font-bold bg-[#D2B48C]/15 px-2 py-0.5 rounded border border-[#D2B48C]/30">
            PORTAL B: GOVERNMENT ACCESS
          </span>
        </div>

        {/* Active Officer Identity Display */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#BFCACC]">
            <span>Officer:</span>
            <strong className="text-white font-mono">{currentPersona.name}</strong>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#BFCACC]/20 text-[#BFCACC] border border-[#BFCACC]/30 font-mono">
              {currentPersona.serviceId}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Government Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3">

          {/* Logo Block: Ashoka Emblem + Divider + ProcSync Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-hidden"
            title="ProcSync • Government Innovation Procurement Portal"
          >
            {/* Ashoka Stambh Emblem Icon (38px tall) */}
            <AshokaEmblem size={38} className="shrink-0 group-hover:opacity-90 transition-opacity" />

            {/* Thin Vertical Divider in Alabaster */}
            <div className="h-8 w-px bg-[#EBDDDA]"></div>

            {/* Brand Wordmark & Subtitle */}
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#1E2D2A] font-sans">
                ProcSync
              </span>
              <span className="text-[11px] text-[#3D5855] font-medium tracking-tight">
                Government Innovation Procurement Portal
              </span>
            </div>
          </Link>

          {/* 3. The 7 Top-Level Tabs with Hover/Tap Caret Dropdowns (Desktop & Laptop >= xl) */}
          <nav
            ref={navContainerRef}
            className="hidden xl:flex items-center gap-1"
            aria-label="Government Portal Primary Navigation"
          >
            {tabs.map((tab, idx) => {
              const active = isTabActive(tab.href);
              const isOpen = activeDropdown === tab.id;

              return (
                <div
                  key={tab.id}
                  className="relative"
                  onMouseEnter={() => handleTabMouseEnter(tab.id)}
                  onMouseLeave={handleTabMouseLeave}
                >
                  <div
                    className={`flex items-center rounded-xl text-xs transition-all border ${
                      active
                        ? "bg-[#FAF8F6] text-[#1E2D2A] border-[#D2B48C] font-black shadow-2xs"
                        : "text-[#3D5855] border-transparent hover:bg-[#FAF8F6] hover:text-[#1E2D2A] font-semibold"
                    }`}
                  >
                    {/* Tab Navigation Link */}
                    <Link
                      href={tab.href}
                      className="px-2.5 py-2 flex items-center gap-1.5 focus:outline-hidden"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-black bg-[#D2B48C]/25 text-[#856441] border border-[#D2B48C]/40">
                          {tab.badge}
                        </span>
                      )}
                    </Link>

                    {/* Dedicated Caret Button for Explicit Click / Tap Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                        setActiveDropdown(isOpen ? null : tab.id);
                      }}
                      className={`pr-2.5 pl-0.5 py-2 hover:text-[#1E2D2A] focus:outline-hidden transition-colors cursor-pointer ${
                        isOpen ? "text-[#1E2D2A]" : "text-[#556B67]"
                      }`}
                      aria-label={`Toggle ${tab.label} sub-tabs menu`}
                      aria-expanded={isOpen}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#2F4541] font-bold" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Hover Dropdown Menu with Seamless Invisible Bridge (pt-1.5) */}
                  {isOpen && (
                    <div
                      className={`absolute top-full pt-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                        idx >= 4 ? "right-0" : "left-0"
                      }`}
                      onMouseEnter={() => handleTabMouseEnter(tab.id)}
                      onMouseLeave={handleTabMouseLeave}
                    >
                      <div className="w-88 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-xl py-2 overflow-hidden">
                        <div className="px-3.5 py-1.5 border-b border-[#EBDDDA] flex items-center justify-between bg-[#FAF8F6]">
                          <span className="text-[10px] font-mono uppercase font-black text-[#4B7069] tracking-wider">
                            {tab.label.replace(/^\d+\.\s*/, "")} Sub-Tabs
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#2F4541] bg-white px-1.5 py-0.5 rounded border border-[#EBDDDA]">
                            {tab.subTabs.length} Views
                          </span>
                        </div>

                        <div className="py-1">
                          {tab.subTabs.map((sub, subIdx) => {
                            const basePath = tab.href.split("?")[0];
                            const isCurrentPage = basePath === "/" ? pathname === "/" : pathname.startsWith(basePath);
                            const isSubActive = isCurrentPage && (currentTab === sub.id || (!currentTab && subIdx === 0));

                            return (
                              <Link
                                key={sub.id}
                                href={sub.queryParam ? `${basePath}?${sub.queryParam}` : tab.href}
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 transition-colors block group cursor-pointer ${
                                  isSubActive
                                    ? "bg-[#FAF8F6] border-l-3 border-[#2F4541]"
                                    : "hover:bg-[#FAF8F6]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                                        isSubActive
                                          ? "bg-[#2F4541]"
                                          : "bg-[#BFCACC] group-hover:bg-[#2F4541]"
                                      }`}
                                    />
                                    <span
                                      className={`text-xs truncate transition-colors ${
                                        isSubActive
                                          ? "font-black text-[#2F4541]"
                                          : "font-bold text-[#1E2D2A] group-hover:text-[#2F4541]"
                                      }`}
                                    >
                                      {sub.name}
                                    </span>
                                  </div>
                                  {isSubActive && (
                                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#BFCACC]/30 text-[#2F4541] font-black border border-[#BFCACC]/50 shrink-0">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#556B67] font-medium pl-7 mt-0.5 line-clamp-1 leading-normal">
                                  {sub.desc}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 4. Far Right Utility Controls: Switch to Startup, Language, Persona Switcher, Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Language Toggle: English | हिन्दी (live AI translation) */}
            <div className="hidden sm:flex items-center text-xs font-medium text-[#3D5855] bg-[#FAF8F6] rounded-lg p-1 border border-[#EBDDDA]" data-no-translate>
              <button
                type="button"
                onClick={() => setLanguage("EN")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  language === "EN" ? "bg-white text-[#1E2D2A] shadow-2xs border border-[#EBDDDA]" : "text-[#556B67] hover:text-[#1E2D2A]"
                }`}
              >
                English
              </button>
              <span className="text-[#EBDDDA] px-0.5">|</span>
              <button
                type="button"
                onClick={() => setLanguage("HI")}
                disabled={translating}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  language === "HI" ? "bg-white text-[#1E2D2A] shadow-2xs border border-[#EBDDDA]" : "text-[#556B67] hover:text-[#1E2D2A]"
                } ${translating ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
              >
                {translating && language === "HI" ? "अनुवाद…" : "हिन्दी"}
              </button>
            </div>

            {/* Canonical 6-Role Persona Switcher (Section 0) */}
            <div className="relative shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F6] hover:bg-white border border-[#EBDDDA] rounded-xl text-xs transition-colors"
                title="Simulate canonical role"
              >
                <div className="w-2 h-2 rounded-full bg-[#4B7069]"></div>
                <div className="text-left hidden md:block">
                  <div className="text-[11px] font-bold text-[#1E2D2A] leading-tight">
                    {currentPersona.name}
                  </div>
                  <div className="text-[10px] text-[#556B67] leading-none truncate max-w-[120px] mt-0.5 font-medium">
                    {currentPersona.roleTitle}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#556B67]" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-[#EBDDDA] rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#EBDDDA] bg-[#FAF8F6]">
                    <span className="text-[10px] font-mono uppercase font-black text-[#4B7069] block tracking-wider">
                      Role-Based Access (RBAC)
                    </span>
                    <span className="text-[11px] text-[#556B67] block mt-0.5 font-medium">
                      Select persona to simulate authorized views:
                    </span>
                  </div>

                  <div className="py-1">
                    {personas.map((p) => {
                      const isSelected = activePersona === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setActivePersona(p.id);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-[#FAF8F6] transition-colors ${
                            isSelected ? "bg-[#FAF8F6] font-bold text-[#1E2D2A] border-l-2 border-[#4B7069]" : "text-[#3D5855]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#1E2D2A]">{p.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#BFCACC]/20 text-[#2F4541] border border-[#BFCACC]/40">
                                {p.roleTitle}
                              </span>
                            </div>
                            <span className="block text-[11px] text-[#556B67] mt-0.5">{p.org}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#4B7069] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Menu Button (xl:hidden) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-[#FAF8F6] hover:bg-[#FAF8F6]/80 text-[#1E2D2A] border border-[#EBDDDA] transition-colors focus:outline-hidden"
              aria-label="Toggle Navigation Drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* 5. Mobile & Tablet Navigation Accordion Drawer (xl:hidden) */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#EBDDDA] bg-white shadow-xl max-h-[80vh] overflow-y-auto px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBDDDA]">
            <span className="text-xs font-mono font-bold uppercase text-[#4B7069]">
              Government Portal Navigation
            </span>
            <span className="text-xs text-[#556B67] font-medium">Tap tab to expand sub-views</span>
          </div>

          {/* Language toggle for small screens */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#EBDDDA]">
            <div className="flex items-center text-xs font-medium text-[#3D5855] bg-[#FAF8F6] rounded-lg p-1 border border-[#EBDDDA]">
              <button
                type="button"
                onClick={() => setLanguage("EN")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  language === "EN" ? "bg-white text-[#1E2D2A] shadow-2xs border border-[#EBDDDA]" : "text-[#556B67] hover:text-[#1E2D2A]"
                }`}
              >
                English
              </button>
              <span className="text-[#EBDDDA] px-0.5">|</span>
              <button
                type="button"
                onClick={() => setLanguage("HI")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  language === "HI" ? "bg-white text-[#1E2D2A] shadow-2xs border border-[#EBDDDA]" : "text-[#556B67] hover:text-[#1E2D2A]"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {tabs.map((tab) => {
              const isExpanded = mobileExpandedTab === tab.id;
              const active = isTabActive(tab.href);

              return (
                <div key={tab.id} className="border border-[#EBDDDA] rounded-xl overflow-hidden">
                  <div
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      active ? "bg-[#FAF8F6] font-black text-[#1E2D2A] border-l-3 border-[#D2B48C]" : "bg-white hover:bg-[#FAF8F6] text-[#1E2D2A]"
                    }`}
                    onClick={() => setMobileExpandedTab(isExpanded ? null : tab.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{tab.label}</span>
                      {tab.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-[#D2B48C]/20 text-[#856441] border border-[#D2B48C]/40">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={tab.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[11px] font-mono text-[#2F4541] hover:underline px-2 py-0.5 rounded bg-[#BFCACC]/20 border border-[#BFCACC]/40"
                      >
                        Visit
                      </Link>
                      <ChevronDown
                        className={`w-4 h-4 text-[#556B67] transition-transform ${
                          isExpanded ? "rotate-180 text-[#1E2D2A]" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-[#FAF8F6] p-2 border-t border-[#EBDDDA] space-y-1">
                      {tab.subTabs.map((sub, sIdx) => (
                        <Link
                          key={sub.id}
                          href={sub.queryParam ? `${tab.href.split("?")[0]}?${sub.queryParam}` : tab.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block p-2.5 rounded-lg hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#BFCACC] shrink-0" />
                            <span className="text-xs font-bold text-[#1E2D2A]">{sub.name}</span>
                          </div>
                          <p className="text-[11px] text-[#556B67] font-medium pl-7 mt-0.5 leading-normal">
                            {sub.desc}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Mobile Horizontal Scrollable Tab Strip (xl:hidden) — hidden on desktop
             because the dedicated desktop nav row above replaces it */}
      <div className="xl:hidden border-t border-[#EBDDDA] px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#FAF8F6] scrollbar-none">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all shrink-0 ${
                active
                  ? "bg-[#2F4541] text-white shadow-2xs"
                  : "text-[#3D5855] bg-white border border-[#EBDDDA] hover:bg-[#FAF8F6]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
