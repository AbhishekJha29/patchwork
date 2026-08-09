"use client";

import React from "react";
import Link from "next/link";
import { Terminal, ArrowRight, LogIn } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#08090a]/90 backdrop-blur-md border-b border-zinc-800/80 font-mono text-[#c9d1d9] console-scanlines">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Mark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/50 group-hover:border-emerald-500 transition-colors">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="font-bold text-sm tracking-wider text-zinc-100 uppercase">
              PATCHWORK
            </span>
            <span className="text-[9px] text-zinc-500 tracking-widest uppercase -mt-0.5">
              SYS_CONSOLE
            </span>
          </div>
        </Link>

        {/* Section Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
          <a
            href="#workflow"
            className="hover:text-emerald-400 transition-colors"
          >
            // WORKFLOW
          </a>
          <a
            href="#showcase"
            className="hover:text-emerald-400 transition-colors"
          >
            // PLATFORM
          </a>
          <a
            href="#safety"
            className="hover:text-emerald-400 transition-colors"
          >
            // SAFEGUARDS
          </a>
          <a
            href="#faq"
            className="hover:text-emerald-400 transition-colors"
          >
            // FAQ
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3 font-mono">
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:text-zinc-100 bg-zinc-900/90 hover:bg-zinc-800 rounded border border-zinc-700 transition-all"
          >
            <LogIn className="w-3.5 h-3.5 text-zinc-400" />
            <span>SIGN_IN</span>
          </Link>

          <Link
            href="/sign-up"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-md shadow-emerald-950/40 border border-emerald-300"
          >
            <span>GET_STARTED</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
          </Link>
        </div>
      </div>
    </header>
  );
}
