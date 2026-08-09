"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="py-20 bg-[#08090a] font-mono text-[#c9d1d9] console-scanlines border-b border-zinc-800/80 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 shadow-xl shadow-emerald-950/50 mb-2">
          <Terminal className="w-6 h-6" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-zinc-100 uppercase tracking-tight font-mono max-w-3xl mx-auto leading-tight">
          Eliminate MTTR Bottlenecks with Autonomous Incident Response.
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-mono leading-relaxed">
          Deploy Patchwork to monitor production error streams, isolate culprit commits in real time, and receive hotfix PRs automatically.
        </p>

        <div className="pt-4 flex items-center justify-center font-mono">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-xl shadow-emerald-950/60 border border-emerald-300"
          >
            <span>GET_STARTED_NOW</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </Link>
        </div>
      </div>
    </section>
  );
}
