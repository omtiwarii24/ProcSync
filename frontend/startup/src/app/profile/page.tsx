"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AshokaEmblem } from "@/components/AshokaEmblem";
import {
  ShieldCheck,
  Building2,
  Cpu,
  CheckCircle2,
  Award,
  Layers,
  IndianRupee,
  Lock,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  UserCheck,
  Zap,
  Activity,
  FileCheck,
  Scale,
  Sparkles
} from "lucide-react";

function StartupProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { startupProfile, passports } = useApp();

  type SubTabId = "venture" | "technology";
  const tabParam = searchParams.get("tab") as SubTabId | null;
  const [defaultSubTab] = useState<SubTabId>("venture");
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(
    tabParam && ["venture", "technology"].includes(tabParam) ? tabParam : defaultSubTab
  );

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam && ["venture", "technology"].includes(tabParam)) {
      setActiveSubTab(tabParam);
    }
  }

  const switchSubTab = (tab: SubTabId) => {
    setActiveSubTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  const tabs: { id: SubTabId; label: string; desc: string; badge: string }[] = [
    {
      id: "venture",
      label: "Venture Credentials & Solvency",
      desc: "DPIIT #DIPP99421, Maharashtra entity, 14m audited runway",
      badge: "DPIIT Verified"
    },
    {
      id: "technology",
      label: "Technology & TRL 7 Architecture",
      desc: "Basalt acoustic wave propagation & non-invasive clamping",
      badge: "TRL 7 Validated"
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2F4541] text-white font-mono text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#D2B48C]" />
                REGISTERED VENTURE DOSSIER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D2B48C]/30 text-[#7A5A30] font-mono text-[11px] font-bold border border-[#D2B48C]">
                DPIIT: #{startupProfile.dpiitId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#BFCACC]/40 text-[#1B3B36] font-mono text-[11px] font-bold border border-[#BFCACC]">
                {startupProfile.trlLevel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight flex items-center gap-2">
              {startupProfile.startupName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              {startupProfile.legalEntity} • Founded by {startupProfile.founders} ({startupProfile.almaMater}).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/passports?tab=passport"
              className="px-4 py-2.5 bg-[#2F4541] hover:bg-[#2F4541]/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#D2B48C]" />
              <span>View Readiness Passport</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
            </Link>
          </div>
        </div>

        {/* 4 Key Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F6] p-4 rounded-2xl border-2 border-stone-200 space-y-1">
            <span className="text-[11px] uppercase font-bold text-stone-500 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#2F4541]" /> CASH RUNWAY
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-stone-950 block">
              {startupProfile.financialRunwayMonths} Months
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              ₹48.6 Lakhs liquid balance
            </span>
          </div>

          <div className="bg-[#BFCACC]/25 p-4 rounded-2xl border-2 border-[#BFCACC] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#1B3B36] font-mono flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#1B3B36]" /> ESCROW DISBURSED
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#1B3B36] block">
              {startupProfile.disbursedToDate.split(" ")[0]}
            </span>
            <span className="text-[11px] text-[#1B3B36] font-medium">
              Total State Pilot Earnings
            </span>
          </div>

          <div className="bg-[#D2B48C]/25 p-4 rounded-2xl border-2 border-[#D2B48C] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#7A5A30] font-mono flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-[#7A5A30]" /> TECH READINESS
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#7A5A30] block">
              TRL 7
            </span>
            <span className="text-[11px] text-[#7A5A30] font-medium">
              Field operational validated
            </span>
          </div>

          <div className="bg-[#EBDDDA]/35 p-4 rounded-2xl border-2 border-[#EBDDDA] space-y-1">
            <span className="text-[11px] uppercase font-bold text-[#5A3832] font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#5A3832]" /> MSINS AWARD
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#5A3832] block">
              Winner 2024
            </span>
            <span className="text-[11px] text-[#5A3832] font-medium">
              Maharashtra Startup Week
            </span>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchSubTab(tab.id)}
                className={`p-3.5 rounded-2xl text-left transition-all border-2 flex flex-col justify-between gap-1.5 ${
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

      {/* 2. SUB-TAB 1: VENTURE CREDENTIALS & SOLVENCY */}
      {activeSubTab === "venture" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-200 pb-4">
              <h2 className="text-xl font-black text-stone-950">
                Statutory Corporate Profile & Registration Identity
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Verified against Ministry of Corporate Affairs (MCA) and DPIIT Startup India central database.
              </p>
            </div>

            {/* Corporate Profile Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-4 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-500 block">
                  CORPORATE ENTITY
                </span>
                <div className="text-sm font-bold text-stone-950">{startupProfile.legalEntity}</div>
                <div className="text-stone-600 space-y-1 pt-1">
                  <div>Headquarters: <strong>{startupProfile.headquarters}</strong></div>
                  <div>Incorporation Date: <strong>{startupProfile.incorporationDate}</strong></div>
                  <div>UDYAM Registration: <strong className="font-mono">{startupProfile.udyamId}</strong></div>
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-500 block">
                  TECHNICAL FOUNDERS
                </span>
                <div className="text-sm font-bold text-stone-950">{startupProfile.founders}</div>
                <div className="text-stone-600 space-y-1 pt-1">
                  <div>Alma Mater: <strong>{startupProfile.almaMater}</strong></div>
                  <div>Domain: <strong>{startupProfile.sector}</strong></div>
                  <div>Award: <strong className="text-emerald-700">{startupProfile.msinsAward}</strong></div>
                </div>
              </div>
            </div>

            {/* §10 Risk-Equivalent Qualification Deconstruction */}
            <div className="p-6 bg-[#BFCACC]/20 rounded-2xl border-2 border-[#BFCACC] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BFCACC] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2F4541] text-white font-mono text-[10px] font-bold">
                    SAFE HARBOR COMPLIANCE
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-[#1B3B36]">
                    Archaic ₹5 Crore Turnover Barrier Legally Deconstructed
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold font-mono">
                  SAFE HARBOR QUALIFIED
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
                Traditional municipal tenders mandate ₹5 Cr annual turnover, automatically disqualifying early-stage deep-tech innovations. 
                Under the Maharashtra Innovation Framework, the startup substitutes the turnover requirement with two legally binding risk-equivalent safeguards:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    1. Audited Liquid Cash Runway
                  </span>
                  <p className="text-stone-600 font-medium leading-relaxed">
                    14 months verified cash runway (₹48.6 Lakhs) certified via State Bank of India virtual escrow ledger.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    2. Milestone Escrow Ring-Fencing
                  </span>
                  <p className="text-stone-600 font-medium leading-relaxed">
                    Zero upfront municipal risk. 30%-40%-30% disbursement linked strictly to independent COEP telemetry audits.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#BFCACC] flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-stone-600">
                <span>Bank Solvency Hash: <strong>{startupProfile.bankSolvencyHash}</strong></span>
                <span>Virtual Escrow: <strong>{startupProfile.bankAccount}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB 2: TECHNOLOGY & TRL 7 ARCHITECTURE */}
      {activeSubTab === "technology" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-200 pb-4">
              <h2 className="text-xl font-black text-stone-950">
                Core Technology Domain & Hardware Architecture
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Sub-surface acoustic wave propagation physics model validated by COEP Technological University.
              </p>
            </div>

            {/* Architecture Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-3 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-500 block">
                  PHYSICAL DEPLOYMENT METHOD
                </span>
                <h3 className="text-sm font-black text-stone-950">
                  Non-Invasive Pipe Wall Clamping (Zero Drilling)
                </h3>
                <p className="text-stone-700 leading-relaxed font-medium">
                  {startupProfile.deploymentMethod}. Piezoelectric acoustic sensors clamp securely onto existing municipal sluice valves and air valves, eliminating the need to shut down pressurized water distribution mains.
                </p>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>Battery Lifetime: <strong>18 Months</strong></span>
                  <span>Mounting Time: <strong>12 Mins / Node</strong></span>
                </div>
              </div>

              <div className="p-5 bg-[#FAF8F6] rounded-2xl border-2 border-stone-200 space-y-3 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-500 block">
                  ALGORITHMIC PHYSICS ENGINE
                </span>
                <h3 className="text-sm font-black text-stone-950">
                  Basalt Wave Velocity Calibration & Cross-Correlation
                </h3>
                <p className="text-stone-700 leading-relaxed font-medium">
                  Dual-pulse acoustic transit-time modeling calibrated for Deccan hard basalt formations. Pins down sub-surface pinhole leaks with a mean ground excavation error of only 1.14 meters.
                </p>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>Sampling Rate: <strong>96 kHz FFT</strong></span>
                  <span>Accuracy Margin: <strong>&lt; 2.0m Radius</strong></span>
                </div>
              </div>
            </div>

            {/* Firmware Safeguards Box */}
            <div className="p-5 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-3 text-xs">
              <span className="font-bold text-stone-950 uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#7A5A30]" />
                Firmware v2.4 Operational Safeguards:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700 font-medium">
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <strong className="text-stone-950 block mb-1">Intermittent Night-Supply Mode:</strong>
                  When dynamic pipeline pressure falls below 1.8 Bar, sensor nodes automatically enter power-saving standby and resume cross-correlation only during high-head pumping cycles.
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <strong className="text-stone-950 block mb-1">High-Salinity Acoustic Attenuation:</strong>
                  In areas with high soil salinity (&gt;12 dS/m), firmware automatically switches to a 2 kHz low-frequency transit pulse to eliminate acoustic frequency dissipation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StartupProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-mono text-xs text-stone-500">
          Loading Startup Profile Dossier...
        </div>
      }
    >
      <StartupProfileContent />
    </Suspense>
  );
}
