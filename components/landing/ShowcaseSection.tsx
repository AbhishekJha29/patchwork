"use client";

import React from "react";
import Image from "next/image";
import { Terminal, Shield, Activity, GitBranch } from "lucide-react";

export function ShowcaseSection() {
  return (
    <section
      id="showcase"
      className="py-20 bg-[#08090a] font-mono text-[#c9d1d9] console-scanlines border-b border-zinc-800/80 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            // REAL-TIME INCIDENT WORKSPACE
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-zinc-100 uppercase tracking-wide">
            See Patchwork in Action
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The mission-control interface engineered for high-velocity engineering teams. Real-time telemetry, automated git topology isolation, and hotfix synthesis — all in one pane.
          </p>
        </div>

        {/* Featured Showcase Screenshot Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Ambient Glow Backdrop */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-60 pointer-events-none" />

          {/* Browser / Console Window Frame */}
          <div className="relative rounded-xl border border-zinc-800/90 bg-[#0d0f12] shadow-2xl shadow-emerald-950/20 overflow-hidden">
            {/* Top Browser / Console Chrome Bar */}
            <div className="px-4 py-2.5 bg-[#0b0c0e] border-b border-zinc-800/80 flex items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 inline-block" />
                <span className="ml-2 text-zinc-500 hidden sm:inline-flex items-center gap-1.5 text-[11px]">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  console.patchwork.internal/active-incident
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">LIVE OPERATOR CONSOLE</span>
              </div>
            </div>

            {/* Primary Visual Proof - Real Command Center Screenshot */}
            <div className="relative w-full bg-[#08090a]">
              <Image
                src="/screenshots/command-center.png"
                alt="Patchwork Command Center — live incident dashboard showing AI-triaged severity, root cause analysis, and automated pipeline status"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        {/* Caption & Contextual Product Highlights */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed">
            Every incident flows through an automated pipeline — from webhook detection to AI-verified root cause to a reviewed pull request, all visible in one operator console.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-mono text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900/80 border border-zinc-800">
              <Activity className="w-3 h-3 text-emerald-400" />
              Active Incident Queue
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900/80 border border-zinc-800">
              <GitBranch className="w-3 h-3 text-cyan-400" />
              Pipeline Stepper & Triage
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900/80 border border-zinc-800">
              <Shield className="w-3 h-3 text-purple-400" />
              Root Cause & Evidence
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900/80 border border-zinc-800">
              <Terminal className="w-3 h-3 text-emerald-400" />
              Operator Fix & PR Actions
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
