import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { StartupHeader } from "@/components/StartupHeader";
import { AshokaEmblem } from "@/components/AshokaEmblem";

export const metadata: Metadata = {
  title: "ProcSync • Startup & Innovation Access Portal (Portal A) | Government of Maharashtra",
  description: "DPIIT Startup Portal for Maharashtra Municipal Outcome Challenges, Risk-Equivalent Qualification, Milestone Escrow, and Procurement Readiness Passports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F6] text-[#1E2D2A] flex flex-col font-sans antialiased selection:bg-[#BFCACC]/30 selection:text-[#2F4541]">
        <AppProvider>
          <React.Suspense fallback={<div className="p-3 bg-[#2F4541] text-white text-xs text-center font-mono">Loading ProcSync Startup Portal...</div>}>
            <StartupHeader />
          </React.Suspense>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            {children}
          </main>
          
          {/* Minimal Structured Footer in Deep Spruce (matches Gov Portal) */}
          <footer className="bg-[#1E2D2A] border-t border-[#2F4541] text-[#BFCACC] py-10 px-4 text-xs font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#2F4541] pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <AshokaEmblem size={28} light={true} />
                    <div className="h-5 w-px bg-[#2F4541]"></div>
                    <span className="font-bold text-white text-sm tracking-tight">ProcSync</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#2F4541] text-[#D2B48C] border border-[#3D5855]">
                      STARTUP PORTAL
                    </span>
                  </div>
                  <p className="text-[#BFCACC]/80 max-w-md text-[11px] leading-relaxed">
                    Startup & Innovation Access Portal. Discover government challenges, submit outcome proposals, and build Procurement Readiness Passports.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#EBDDDA]">
                  <span className="px-2 py-0.5 rounded bg-[#2F4541] text-[#D2B48C] font-mono font-bold border border-[#3D5855]">
                    DPIIT: DIPP99421
                  </span>
                  <span className="text-[#D2B48C] font-bold">
                    GFR 149 Safe Harbor Enabled
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#BFCACC]/60 font-mono">
                <div>
                  © 2026 Government of India • Maharashtra State Innovation Society (MSInS) • Skills, Employment, Entrepreneurship & Innovation Dept.
                </div>
                <div>
                  SIH 2026 • Problem Statement ID: 26136 • Build: v4.2-National
                </div>
              </div>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
