"use client";

import React from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#050607] font-mono text-[#c9d1d9] py-12 border-t border-zinc-800/80 console-scanlines">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand Logo & Tagline */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="font-bold text-sm tracking-wider text-zinc-100 uppercase">
                PATCHWORK
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 max-w-sm">
              Autonomous AI Incident Response & Real-Time Root Cause Isolation Console.
            </p>
          </div>

          {/* Footer Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-zinc-400">
            <a href="#workflow" className="hover:text-emerald-400 transition-colors">
              Workflow
            </a>
            <a href="#showcase" className="hover:text-emerald-400 transition-colors">
              Platform
            </a>
            <a href="#safety" className="hover:text-emerald-400 transition-colors">
              Safeguards
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
            <Link href="/sign-in" className="hover:text-emerald-400 transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-emerald-400 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 font-mono">
          <div>
            © {new Date().getFullYear()} Patchwork Platform Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>sys_status: operational</span>
            <span>version: v2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
