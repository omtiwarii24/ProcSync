"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Compass,
  Activity,
  UploadCloud,
  FileCheck,
  Building2,
  ShieldCheck,
  Zap,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  Sparkles,
  Lock,
  ArrowRight,
  Sliders,
  Scale,
  Award,
  FileText
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AshokaEmblem } from "./AshokaEmblem";

export const StartupHeader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "";
  const { startupProfile } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const navItems = [
    {
      id: "opportunities",
      label: "Opportunities & Proposals",
      shortLabel: "Opportunities",
      href: "/?tab=discovery",
      icon: Compass,
      subTabs: [
        { id: "discovery", label: "Municipal Challenge Radar", desc: "Open departmental outcome challenges across Maharashtra" },
        { id: "precheck", label: "Readiness Pre-Check", desc: "DPIIT, Maharashtra entity & risk-equivalent turnover runway" },
        { id: "submit", label: "Outcome Proposal Submission", desc: "Define measurable target KPIs & 25-day adapted budget" },
        { id: "status", label: "Gate 1 & Gate 2 Evaluation Status", desc: "Live screening score (88.5 Rank #1) & consensus rank" },
      ]
    },
    {
      id: "trials",
      label: "Trials & Escrow",
      shortLabel: "Trials & Escrow",
      href: "/trials?tab=milestones",
      icon: Activity,
      subTabs: [
        { id: "milestones", label: "3-Phase Milestone Execution", desc: "M1 Deployment, M2 Basalt Calibration, M3 Audit Closeout" },
        { id: "terms", label: "Legal Terms & IP Custody", desc: "TMPL-IP-2024-v1.8 Zero IP Leakage & Sandbox Agreements" },
        { id: "payments", label: "SBI Escrow Payment State Machine", desc: "Pending → Invoiced → Approved → Disbursed" },
        { id: "clarifications", label: "Clarification Query Log", desc: "Direct communication with COEP Evaluators & NMC Engineers" },
      ]
    },
    {
      id: "upload",
      label: "Field Evidence & AI",
      shortLabel: "Evidence & AI",
      href: "/upload?tab=upload",
      icon: UploadCloud,
      subTabs: [
        { id: "upload", label: "Sensor Telemetry Ingestion", desc: "Upload raw acoustic waveforms, SCADA packets & photo logs" },
        { id: "ai_extract", label: "AI Evidence Extraction", desc: "Automated before/after metrics with confidence scores" },
        { id: "eval_audit", label: "COEP Academic Verification", desc: "Independent university ground-truth excavation sign-off" },
      ]
    },
    {
      id: "passports",
      label: "Readiness Passports",
      shortLabel: "Passports",
      href: "/passports?tab=passport",
      icon: FileCheck,
      subTabs: [
        { id: "passport", label: "Verified Passport Viewer", desc: "#MH-EP-2025-WTR-0042 full single-artifact record" },
        { id: "decision", label: "Official Four-Value Decision", desc: "STOP / ADAPT / REVALIDATE / SCALE outcome" },
        { id: "replication", label: "Cross-Department Replication", desc: "Reusable evidence vs revalidation assets for state local bodies" },
      ]
    },
    {
      id: "profile",
      label: "Startup Profile",
      shortLabel: "Profile",
      href: "/profile?tab=venture",
      icon: ShieldCheck,
      subTabs: [
        { id: "venture", label: "Venture Credentials & Solvency", desc: "DPIIT #DIPP99421, Maharashtra entity, 14m audited runway" },
        { id: "technology", label: "Technology & TRL 7 Architecture", desc: "Basalt acoustic wave propagation & non-invasive clamping" },
      ]
    }
  ];

  return (
    <header className="bg-white border-b-2 border-[#EBDDDA] sticky top-0 z-40 shadow-xs">

      {/* 1. National Tricolor Ribbon (4px) */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]"></div>
        <div className="h-full flex-1 bg-[#FFFFFF]"></div>
        <div className="h-full flex-1 bg-[#138808]"></div>
      </div>

      {/* Top Micro-Bar: Official State Banner */}
      <div className="bg-[#2F4541] text-white text-xs px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-3 font-medium border-b border-[#2F4541]/40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#BFCACC] hidden md:inline">
              MSInS Innovation Procurement Sandbox
            </span>
            <span className="text-[#BFCACC] hidden sm:inline">•</span>
            <span className="text-[#D2B48C] font-mono font-bold bg-[#D2B48C]/15 px-2 py-0.5 rounded border border-[#D2B48C]/30">
              PORTAL A: STARTUP ACCESS
            </span>
          </div>
        </div>

        {/* Startup Identity Display */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#BFCACC]">
            <span>Startup:</span>
            <strong className="text-white font-mono">{startupProfile.startupName}</strong>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#BFCACC]/20 text-[#BFCACC] border border-[#BFCACC]/30 font-mono">
              {startupProfile.dpiitId}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo & Name */}
          <Link href="/?tab=discovery" className="flex items-center gap-2.5 shrink-0 group focus:outline-hidden">            <AshokaEmblem size={38} className="shrink-0 group-hover:opacity-90 transition-opacity" />
            <div className="h-8 w-px bg-[#EBDDDA]"></div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-black tracking-tight text-[#1E2D2A] font-sans">
                ProcSync
              </span>
              <span className="text-[11px] text-[#3D5855] font-medium tracking-tight truncate">
                Startup &amp; Innovation Access Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Dropdowns */}
          <nav className="hidden xl:flex items-center gap-0.5 min-w-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isBaseActive = pathname === item.href.split("?")[0];
              const isDropdownActive = activeDropdown === item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isBaseActive
                        ? "bg-[#2F4541] text-white shadow-xs"
                        : "text-[#3D5855] hover:text-[#1E2D2A] hover:bg-[#FAF8F6]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isBaseActive ? "text-[#D2B48C]" : "text-[#556B67]"}`} />
                    <span>{item.shortLabel}</span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isDropdownActive ? "rotate-180 text-white" : "opacity-60"}`} />
                  </Link>

                  {/* Dropdown Menu */}
                  {isDropdownActive && (
                    <div className="absolute left-0 mt-1 w-80 bg-white rounded-2xl border-2 border-[#EBDDDA] shadow-lg p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 border-b border-[#EBDDDA]/70 mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#556B67] uppercase tracking-wider">
                          {item.label} Views
                        </span>
                      </div>
                      <div className="space-y-1">
                        {item.subTabs.map((sub) => {
                          const isSubActive = isBaseActive && currentTab === sub.id;
                          return (
                            <Link
                              key={sub.id}
                              href={`${item.href.split("?")[0]}?tab=${sub.id}`}
                              onClick={() => setActiveDropdown(null)}
                              className={`block px-3 py-2 rounded-xl transition-all ${
                                isSubActive
                                  ? "bg-[#FAF8F6] border-l-4 border-[#2F4541] text-[#1E2D2A]"
                                  : "hover:bg-[#FAF8F6] text-[#3D5855]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${isSubActive ? "font-black text-[#2F4541]" : "font-bold text-[#1E2D2A]"}`}>
                                  {sub.label}
                                </span>
                                {isSubActive && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#2F4541] text-white">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#556B67] mt-0.5 leading-snug line-clamp-1 font-medium">
                                {sub.desc}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Escrow Quick Pill */}
          <div className="hidden min-[1400px]:flex items-center gap-2 pl-3 border-l-2 border-[#EBDDDA] shrink-0">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-[#556B67] block">SBI Sandbox Escrow</span>
              <span className="text-xs font-mono font-black text-[#2F4541]">₹4,00,000 RESERVED</span>
            </div>
            <Link
              href="/trials?tab=payments"
              className="p-2 rounded-xl bg-[#BFCACC]/20 hover:bg-[#BFCACC]/30 text-[#2F4541] border border-[#BFCACC]/40 transition-colors"
              title="View Escrow Payment State"
            >
              <Zap className="w-4 h-4 text-[#2F4541]" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#2F4541] hover:bg-[#FAF8F6] border border-[#EBDDDA]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t-2 border-[#EBDDDA] bg-white px-4 pt-3 pb-6 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isBaseActive = pathname === item.href.split("?")[0];
            return (
              <div key={item.id} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                    isBaseActive ? "bg-[#2F4541] text-white" : "text-[#1E2D2A] hover:bg-[#FAF8F6]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isBaseActive ? "text-[#D2B48C]" : "text-[#556B67]"}`} />
                  <span>{item.label}</span>
                </Link>
                <div className="pl-6 space-y-1 border-l-2 border-[#EBDDDA] ml-3">
                  {item.subTabs.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`${item.href.split("?")[0]}?tab=${sub.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-2 py-1 text-[11px] text-[#556B67] hover:text-[#1E2D2A] font-medium"
                    >
                      • {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </header>
  );
};

