import type { Metadata } from "next";
import "./globals.css";
import { AshokaEmblem } from "@/components/AshokaEmblem";

export const metadata: Metadata = {
  title: "ProcSync • Unified Login Portal",
  description: "ProcSync — Unified role-based login gateway for the Government Innovation Procurement Portal and the Startup & Innovation Access Portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#FAF8F6] text-[#1E2D2A] antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8F6] text-[#1E2D2A] relative overflow-x-hidden selection:bg-[#D2B48C]/30 selection:text-[#1E2D2A]">
        {/* Subtle Institutional Ashoka Stambh Watermark (Fixed Background, 3-5% opacity) */}
        <AshokaEmblem watermark={true} size={540} />

        {/* Full Width Main Workspace */}
        <main className="flex-1 w-full relative z-10">
          {children}
        </main>

        {/* Minimal Structured National Government Portal Footer in Deep Spruce */}
        <footer className="bg-[#1E2D2A] border-t border-[#2F4541] text-[#BFCACC] py-10 px-4 text-xs font-sans relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#2F4541] pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <AshokaEmblem size={28} light={true} />
                  <div className="h-5 w-px bg-[#2F4541]"></div>
                  <span className="font-bold text-white text-sm tracking-tight">ProcSync</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#2F4541] text-[#D2B48C] border border-[#3D5855]">
                    UNIFIED GATEWAY
                  </span>
                </div>
                <p className="text-[#BFCACC]/80 max-w-md text-[11px] leading-relaxed">
                  National Innovation Procurement Infrastructure. Single secure sign-in for government departments and DPIIT-recognized startups.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#EBDDDA]">
                <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                <span className="text-[#2F4541]">•</span>
                <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
                <span className="text-[#2F4541]">•</span>
                <a href="#accessibility" className="hover:text-white transition-colors">Accessibility (WCAG 2.1 AA)</a>
                <span className="text-[#2F4541]">•</span>
                <a href="#help" className="hover:text-white transition-colors">Help Desk</a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#BFCACC]/60 font-mono">
              <div>
                © 2026 Government of India • Ministry / State Innovation Society Sandbox.
              </div>
              <div>
                SIH 2026 • Problem Statement ID: 26136 • Build: v4.2-National
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
