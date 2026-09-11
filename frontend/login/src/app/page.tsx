"use client";

import React, { useState, useEffect } from "react";
import {
  Rocket,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Fingerprint,
  BadgeCheck,
  CheckCircle2,
  UserPlus,
  LogIn,
  Info,
  User,
  Mail,
  Building2,
} from "lucide-react";
import { AshokaEmblem } from "@/components/AshokaEmblem";

type PortalRole = "GOVERNMENT" | "STARTUP";
type AuthMode = "signin" | "signup";

const GOV_PORTAL_URL = "http://localhost:3000";
const STARTUP_PORTAL_URL = "http://localhost:3001";

// Registry of pre-issued government IDs (mock of the MSInS identity service)
const GOV_ID_REGISTRY: Record<string, { name: string; org: string }> = {
  "MSINS-ADM-001": { name: "State Administrator", org: "MSInS • Mantralaya, Mumbai" },
  "NMC-CE-2201": { name: "Er. Sanjay Deshmukh", org: "Chief Engineer • Nashik Municipal Corp" },
  "COEP-HYD-007": { name: "Dr. Vidya Joshi", org: "Head of Hydraulics • COEP Pune" },
  "PMC-FA-1104": { name: "Chief Accounts Officer", org: "Municipal Accounts & Audit Dept" },
};

const GOV_EMAIL_DOMAINS = [".gov.in", ".ac.in", ".nic.in"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOV_ID_PATTERN = /^[A-Z]{2,8}(-[A-Z]{2,8}){1,2}-\d{2,6}$/;

function detectPortal(identifier: string): PortalRole | null {
  const id = identifier.trim();
  if (!id) return null;

  const upper = id.toUpperCase();
  const lower = id.toLowerCase();

  // 1. Pre-issued government service ID (exact registry match)
  if (GOV_ID_REGISTRY[upper]) return "GOVERNMENT";
  // 2. Official government / academic email domain
  if (GOV_EMAIL_DOMAINS.some((d) => lower.endsWith(d))) return "GOVERNMENT";
  // 3. DPIIT recognition number (e.g. DIPP99421)
  if (/^DIPP\d{4,8}$/.test(upper)) return "STARTUP";
  // 4. Standard pre-issued government service ID format (DEPT-ROLE-####)
  if (GOV_ID_PATTERN.test(upper)) return "GOVERNMENT";
  // 5. Registered startup email
  if (EMAIL_PATTERN.test(lower)) return "STARTUP";

  // Unknown format — final verification happens against the registry on submit
  return null;
}

const demoIds = [
  { id: "MSINS-ADM-001", label: "State Administrator", hint: "MSInS • Mantralaya • pre-issued ID", portal: "GOVERNMENT" as PortalRole },
  { id: "NMC-CE-2201", label: "Dept. Problem Owner", hint: "Chief Engineer • Nashik Municipal Corp", portal: "GOVERNMENT" as PortalRole },
  { id: "COEP-HYD-007", label: "Independent Evaluator", hint: "Head of Hydraulics • COEP Pune", portal: "GOVERNMENT" as PortalRole },
  { id: "DIPP99421", label: "Startup Founder", hint: "AcoustiLeak Sensors • DPIIT-recognized", portal: "STARTUP" as PortalRole },
];

export default function UnifiedLoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");

  // Shared / sign-in state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign-up state (startups only)
  const [startupName, setStartupName] = useState("");
  const [founderEmail, setFounderEmail] = useState("");
  const [dpiitId, setDpiitId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState<PortalRole | null>(null);

  const detectedPortal = detectPortal(identifier);
  const targetPortal = redirecting ?? detectedPortal;

  // Prefill remembered ID (client-only)
  useEffect(() => {
    const saved = window.localStorage.getItem("procsync_last_id");
    if (saved) setIdentifier(saved);
  }, []);

  // Back-button recovery: when returning to this page (e.g. after a portal
  // redirect), the browser may restore a frozen snapshot where the form is
  // stuck in "redirecting" state with everything disabled. Reset it.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setRedirecting(null);
        setLoading(false);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setRedirecting(null);
  };

  const fillDemoId = (demo: (typeof demoIds)[number]) => {
    setMode("signin");
    setIdentifier(demo.id);
    setPassword("procsync@2026");
    setError(null);
    setRedirecting(null);
  };

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Enter your pre-provided User ID or registered email.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!detectedPortal) {
      setError(
        "ID not recognized. Government IDs are pre-issued by MSInS — check with your department admin. Startups: sign in with your DPIIT number or registered email, or use the Sign Up tab."
      );
      return;
    }

    setLoading(true);
    if (rememberMe) window.localStorage.setItem("procsync_last_id", identifier.trim());
    setTimeout(() => {
      setLoading(false);
      setRedirecting(detectedPortal);
    }, 1400);
  };

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!startupName.trim()) {
      setError("Startup name is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(founderEmail.trim())) {
      setError("Enter a valid registered email address.");
      return;
    }
    if (dpiitId.trim() && !/^DIPP\d{4,8}$/i.test(dpiitId.trim())) {
      setError("DPIIT numbers follow the format DIPP###### (e.g. DIPP99421). Leave blank if not yet recognized.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRedirecting("STARTUP");
    }, 1400);
  };

  const redirectUrl = redirecting === "GOVERNMENT" ? GOV_PORTAL_URL : STARTUP_PORTAL_URL;

  return (
    <div className="min-h-screen flex flex-col">
      {/* National Tricolor Ribbon (4px) */}
      <div className="h-1 w-full flex shrink-0">
        <div className="h-full flex-1 bg-[#FF9933]"></div>
        <div className="h-full flex-1 bg-[#FFFFFF]"></div>
        <div className="h-full flex-1 bg-[#138808]"></div>
      </div>

      {/* Top Micro-Bar: Official State Banner & Security Notice */}
      <div className="bg-[#2F4541] text-white text-xs px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 font-medium border-b border-[#2F4541]/40 relative z-20">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#BFCACC] hidden md:inline">
            MSInS Innovation Procurement Sandbox
          </span>
          <span className="text-[#BFCACC] hidden sm:inline">•</span>
          <span className="text-[#D2B48C] font-mono font-bold bg-[#D2B48C]/15 px-2 py-0.5 rounded border border-[#D2B48C]/30">
            UNIFIED GATEWAY
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D2B48C]" />
          <span className="font-mono text-[#BFCACC]">Secured by NIC SSL • WCAG 2.1 AA</span>
        </div>
      </div>

      {/* Main Login Workspace — centered */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 lg:py-14">

        {/* Centered Brand Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <AshokaEmblem size={44} />
          <div className="h-10 w-px bg-[#EBDDDA]"></div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-[#1E2D2A]">ProcSync</span>
            <span className="text-[11px] text-[#3D5855] font-medium tracking-tight">
              Unified Login Gateway
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl border-2 border-[#EBDDDA] shadow-xl overflow-hidden">
              {/* Card Header */}
              <div className="bg-[#FAF8F6] border-b-2 border-[#EBDDDA] px-6 sm:px-8 py-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-[#1E2D2A] tracking-tight">
                    {mode === "signin" ? "Sign in to ProcSync" : "Create a Startup Account"}
                  </h2>
                  <p className="text-[11px] text-[#556B67] font-medium mt-0.5">
                    {mode === "signin"
                      ? "Your destination portal is detected automatically from your ID."
                      : "New startup registration — you'll be taken straight to the Startup Portal."}
                  </p>
                </div>
                <Fingerprint className="w-8 h-8 text-[#4B7069] shrink-0 hidden sm:block" />
              </div>

              <div className="p-6 sm:p-8">
                {/* Redirect Banner */}
                {redirecting && (
                  <div
                    role="alert"
                    className="mb-6 rounded-2xl border-2 border-[#4B7069] bg-[#EBF1F0] px-4 py-3.5 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#4B7069] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#1E2D2A]">
                        {mode === "signup"
                          ? "Startup account created — redirecting to Startup Portal…"
                          : redirecting === "GOVERNMENT"
                          ? "Identity verified — redirecting to Government Portal…"
                          : "Identity verified — redirecting to Startup Portal…"}
                      </p>
                      <p className="text-[11px] text-[#556B67] font-mono mt-0.5 truncate">{redirectUrl}</p>
                    </div>
                    <Loader2 className="w-4 h-4 text-[#4B7069] animate-spin shrink-0 ml-auto" />
                  </div>
                )}

                {/* Mode Tabs: Sign In | Startup Sign Up */}
                <div
                  className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF8F6] border-2 border-[#EBDDDA] rounded-2xl mb-6"
                  role="tablist"
                  aria-label="Authentication mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    onClick={() => switchMode("signin")}
                    disabled={!!redirecting}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4B7069] ${
                      mode === "signin"
                        ? "bg-[#2F4541] text-white border-2 border-[#2F4541] shadow-md"
                        : "bg-white text-[#3D5855] border-2 border-transparent hover:border-[#BFCACC]"
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    onClick={() => switchMode("signup")}
                    disabled={!!redirecting}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#856441] ${
                      mode === "signup"
                        ? "bg-[#856441] text-white border-2 border-[#856441] shadow-md"
                        : "bg-white text-[#3D5855] border-2 border-transparent hover:border-[#E5CEB4]"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Startup Sign Up</span>
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-2xl border-2 border-[#856441]/50 bg-[#F7EFE5] px-4 py-3 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#856441] shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-[#856441] leading-relaxed">{error}</p>
                  </div>
                )}

                {/* ===================== SIGN IN ===================== */}
                {mode === "signin" && (
                  <form onSubmit={handleSignIn} noValidate>
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="login-id"
                          className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                        >
                          User ID or Email
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                          <input
                            id="login-id"
                            type="text"
                            autoComplete="username"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="e.g. NMC-CE-2201, DIPP99421, or name@startup.in"
                            className={`w-full pl-10 pr-3.5 py-3 bg-[#FAF8F6] border-2 rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white ${
                              error && !identifier.trim()
                                ? "border-[#856441]"
                                : "border-[#EBDDDA] focus:border-[#2F4541]"
                            }`}
                          />
                        </div>
                        {/* Live detection status */}
                        <div aria-live="polite">
                          {!identifier.trim() ? (
                            <p className="text-[10px] text-[#556B67] font-medium flex items-center gap-1.5">
                              <Info className="w-3 h-3 shrink-0" />
                              Government IDs are pre-issued by MSInS — your portal is detected automatically.
                            </p>
                          ) : detectedPortal === "GOVERNMENT" ? (
                            <p className="text-[10px] font-bold text-[#2F4541] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 shrink-0 text-[#4B7069]" />
                              Government ID recognized — routing to the Government Portal.
                            </p>
                          ) : detectedPortal === "STARTUP" ? (
                            <p className="text-[10px] font-bold text-[#856441] flex items-center gap-1.5">
                              <Rocket className="w-3 h-3 shrink-0" />
                              Startup credential recognized — routing to the Startup Portal.
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#556B67] font-medium flex items-center gap-1.5">
                              <Fingerprint className="w-3 h-3 shrink-0" />
                              Will be verified against the national ID registry on sign-in.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="login-password"
                            className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                          >
                            Password
                          </label>
                          <a
                            href="#forgot-password"
                            className="text-[11px] font-bold text-[#4B7069] hover:text-[#2F4541] transition-colors"
                          >
                            Forgot password?
                          </a>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                          <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className={`w-full pl-10 pr-12 py-3 bg-[#FAF8F6] border-2 rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white ${
                              error && !password
                                ? "border-[#856441]"
                                : "border-[#EBDDDA] focus:border-[#2F4541]"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#556B67] hover:text-[#1E2D2A] hover:bg-[#EBDDDA]/50 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4B7069]"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#4B7069] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-[#3D5855]">Remember my ID on this device</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !!redirecting}
                      className={`w-full mt-7 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm tracking-tight transition-all duration-200 border-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4B7069] focus-visible:ring-offset-2 ${
                        redirecting
                          ? "bg-[#4B7069] border-[#4B7069] text-white cursor-wait"
                          : "bg-[#2F4541] border-[#2F4541] text-white hover:bg-[#1E2D2A] hover:border-[#1E2D2A] shadow-md hover:shadow-lg cursor-pointer"
                      }`}
                    >
                      {loading || redirecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying identity &amp; routing…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4 text-[#D2B48C]" />
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-[#556B67] font-medium text-center mt-3 leading-relaxed">
                      Protected under GFR Rule 149 Safe Harbor • By signing in you accept the MSInS
                      Sandbox Terms &amp; NIC e-Prajala single sign-on policy.
                    </p>
                  </form>
                )}

                {/* ===================== SIGN UP (STARTUP ONLY) ===================== */}
                {mode === "signup" && (
                  <form onSubmit={handleSignUp} noValidate>
                    <div className="rounded-2xl border-2 border-[#D2B48C]/50 bg-[#F7EFE5] px-4 py-3 mb-6 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#856441] shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-[#856441] leading-relaxed">
                        Sign up is for startups only. Government employee IDs are pre-issued by MSInS
                        and cannot be self-registered — contact your department admin.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="signup-name"
                          className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                        >
                          Startup Name
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                          <input
                            id="signup-name"
                            type="text"
                            autoComplete="organization"
                            value={startupName}
                            onChange={(e) => setStartupName(e.target.value)}
                            placeholder="e.g. AcoustiLeak Sensors Pvt Ltd"
                            className={`w-full pl-10 pr-3.5 py-3 bg-[#FAF8F6] border-2 rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white ${
                              error && !startupName.trim()
                                ? "border-[#856441]"
                                : "border-[#EBDDDA] focus:border-[#2F4541]"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="signup-email"
                          className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                        >
                          Registered Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                          <input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            value={founderEmail}
                            onChange={(e) => setFounderEmail(e.target.value)}
                            placeholder="founder@startup.in"
                            className={`w-full pl-10 pr-3.5 py-3 bg-[#FAF8F6] border-2 rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white ${
                              error && !EMAIL_PATTERN.test(founderEmail.trim())
                                ? "border-[#856441]"
                                : "border-[#EBDDDA] focus:border-[#2F4541]"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="signup-dpiit"
                          className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                        >
                          DPIIT Recognition Number{" "}
                          <span className="text-[#556B67] font-medium normal-case tracking-normal">(optional)</span>
                        </label>
                        <div className="relative">
                          <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                          <input
                            id="signup-dpiit"
                            type="text"
                            value={dpiitId}
                            onChange={(e) => setDpiitId(e.target.value)}
                            placeholder="e.g. DIPP99421"
                            className="w-full pl-10 pr-3.5 py-3 bg-[#FAF8F6] border-2 border-[#EBDDDA] focus:border-[#2F4541] rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white"
                          />
                        </div>
                        <p className="text-[10px] text-[#556B67] font-medium">
                          Leave blank if not yet recognized — you can complete recognition inside the portal.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="signup-password"
                            className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                          >
                            Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                            <input
                              id="signup-password"
                              type="password"
                              autoComplete="new-password"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              placeholder="Min. 6 characters"
                              className={`w-full pl-10 pr-3.5 py-3 bg-[#FAF8F6] border-2 rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white ${
                                error && signupPassword.length < 6
                                  ? "border-[#856441]"
                                  : "border-[#EBDDDA] focus:border-[#2F4541]"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="signup-confirm"
                            className="text-xs font-bold text-[#3D5855] uppercase tracking-wider block"
                          >
                            Confirm Password
                          </label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556B67] pointer-events-none" />
                            <input
                              id="signup-confirm"
                              type="password"
                              autoComplete="new-password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter password"
                              className={`w-full pl-10 pr-3.5 py-3 bg-[#FAF8F6] border-2 rounded-xl text-sm font-bold text-[#1E2D2A] placeholder:text-[#556B67]/60 placeholder:font-medium outline-hidden transition-colors focus:bg-white ${
                                error && signupPassword !== confirmPassword
                                  ? "border-[#856441]"
                                  : "border-[#EBDDDA] focus:border-[#2F4541]"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !!redirecting}
                      className={`w-full mt-7 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm tracking-tight transition-all duration-200 border-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#856441] focus-visible:ring-offset-2 ${
                        redirecting
                          ? "bg-[#4B7069] border-[#4B7069] text-white cursor-wait"
                          : "bg-[#856441] border-[#856441] text-white hover:bg-[#6d5136] hover:border-[#6d5136] shadow-md hover:shadow-lg cursor-pointer"
                      }`}
                    >
                      {loading || redirecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating account &amp; routing…</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account &amp; Continue</span>
                          <ArrowRight className="w-4 h-4 text-[#F7EFE5]" />
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-[#556B67] font-medium text-center mt-3 leading-relaxed">
                      Startup accounts land on the Startup &amp; Innovation Access Portal (Portal A).
                      DPIIT verification and GFR 149 eligibility checks continue inside the portal.
                    </p>
                  </form>
                )}

                {/* Demo Credentials (Sign In only) */}
                {mode === "signin" && !redirecting && (
                  <div className="mt-7 pt-6 border-t-2 border-[#EBDDDA]">
                    <div className="flex items-center gap-2 mb-3">
                      <BadgeCheck className="w-3.5 h-3.5 text-[#4B7069]" />
                      <span className="text-[10px] font-mono uppercase font-black text-[#4B7069] tracking-wider">
                        Demo IDs — one-click fill
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {demoIds.map((demo) => (
                        <button
                          key={demo.id}
                          type="button"
                          onClick={() => fillDemoId(demo)}
                          className="text-left px-3 py-2.5 rounded-xl border border-[#EBDDDA] bg-[#FAF8F6] hover:bg-white hover:border-[#BFCACC] transition-all duration-200 cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4B7069]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                demo.portal === "GOVERNMENT" ? "bg-[#4B7069]" : "bg-[#856441]"
                              }`}
                            />
                            <span className="text-[11px] font-black text-[#1E2D2A] group-hover:text-[#2F4541] transition-colors truncate">
                              {demo.id}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#556B67] font-medium mt-1 truncate">{demo.hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Auto-redirect trigger */}
      {redirecting && <RedirectTrigger url={redirectUrl} />}
    </div>
  );
}

function RedirectTrigger({ url }: { url: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = url;
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [url]);

  return null;
}
