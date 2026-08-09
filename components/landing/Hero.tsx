"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Cpu, GitBranch, Zap, Activity } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden font-mono text-[#c9d1d9] console-scanlines border-b border-zinc-800/80">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 console-grid opacity-25 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">
            AUTONOMOUS INCIDENT RESPONSE ENGINE
          </span>
        </div>

        {/* Large Systems-Oriented Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 uppercase font-mono leading-tight max-w-4xl mx-auto">
          Your Autonomous Incident Response Engineer.
        </h1>

        {/* Core Value Proposition Subheadline */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-mono leading-relaxed">
          Patchwork ingests production error streams, isolates the exact culprit commit in your git history, and opens a verified hotfix PR — before an engineer even gets paged.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 font-mono">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-xl shadow-emerald-950/50 border border-emerald-300"
          >
            <span>GET_STARTED_FREE</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </Link>

          <a
            href="#workflow"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded text-xs font-mono font-semibold text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 transition-all border border-zinc-700"
          >
            <span>VIEW_WORKFLOW</span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </a>
        </div>

        {/* Live System Status & Telemetry Strip */}
        <div className="pt-8">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 rounded-xl border border-zinc-800 bg-[#0d0f12]/90 shadow-2xl console-scanlines max-w-3xl mx-auto text-xs font-mono">
            <span className="flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-500">sys_status:</span>
              <span className="text-emerald-400 font-bold">active</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-500">Avg MTTR:</span>
              <span className="text-zinc-100 font-bold">4.2m</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-zinc-500">Isolation Precision:</span>
              <span className="text-purple-300 font-bold">99.4%</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-500">PR Hotfixes:</span>
              <span className="text-cyan-300 font-bold">PR-Only (No Auto-Merge)</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
