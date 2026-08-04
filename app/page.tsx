"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Activity, Terminal, LogIn } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-cyan-950/20 relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/20 mb-2">
            <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            PATCHWORK
          </h1>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Autonomous AI Incident Response & Real-Time Root Cause Resolution Engine
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/sign-in"
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-medium text-sm text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] border border-cyan-300"
          >
            <LogIn className="w-5 h-5 text-slate-950" />
            <span>Sign in to Account</span>
            <ArrowRight className="w-4 h-4 text-slate-950 ml-auto" />
          </Link>

          <Link
            href="/sign-up"
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-medium text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-800 transition-all border border-slate-700"
          >
            <span>Create New Account</span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
          </Link>

          <p className="text-[11px] text-center text-slate-500 font-mono pt-1">
            Phase 2 • Real DB & Auth Infrastructure Connected
          </p>
        </div>

        {/* Key Features Badge Footer */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <Activity className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 font-mono block">Zero-Downtime</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <Terminal className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 font-mono block">Auto Diff Fix</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 font-mono block">99.4% Precision</span>
          </div>
        </div>
      </div>
    </main>
  );
}
