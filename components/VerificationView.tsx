"use client";

import React from "react";
import { Incident } from "@/lib/types";
import { ShieldCheck, CheckCircle2, AlertOctagon, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationViewProps {
  incidents: Incident[];
  className?: string;
}

export function VerificationView({ incidents, className }: VerificationViewProps) {
  return (
    <div className={cn("flex-1 bg-[#08090a] p-6 space-y-6 font-mono text-[#c9d1d9] overflow-y-auto h-screen console-scanlines", className)}>
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Patch Verification & Deployment Confidence Matrix
        </h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          Automated regression testing, AI confidence isolation, and canary deployment verification logs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded-lg border border-zinc-800 bg-[#0d0f12] space-y-1 console-scanlines">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">VERIFIED PATCHES</div>
          <div className="text-2xl font-bold text-emerald-400">
            {incidents.filter((i) => i.status === "in_review" || i.status === "deployed" || i.status === "resolved").length}
          </div>
          <div className="text-[10px] text-zinc-500">Passed automated regression suite</div>
        </div>

        <div className="p-4 rounded-lg border border-zinc-800 bg-[#0d0f12] space-y-1 console-scanlines">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">AVG AI CONFIDENCE</div>
          <div className="text-2xl font-bold text-cyan-400">
            {incidents.length > 0
              ? Math.round(
                  incidents.reduce((acc, i) => acc + (i.rootCause?.confidenceScore || 0), 0) / incidents.length
                )
              : 0}%
          </div>
          <div className="text-[10px] text-zinc-500">Evaluated over commit history</div>
        </div>

        <div className="p-4 rounded-lg border border-zinc-800 bg-[#0d0f12] space-y-1 console-scanlines">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">CANARY DEPLOYMENTS</div>
          <div className="text-2xl font-bold text-purple-400">
            {incidents.filter((i) => i.status === "deployed" || i.status === "resolved").length}
          </div>
          <div className="text-[10px] text-zinc-500">Verified zero regression alerts</div>
        </div>
      </div>

      <div className="p-5 rounded-lg border border-zinc-800 bg-[#0d0f12] space-y-4 shadow-xl console-scanlines">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Verification Records & Test Logs
          </h2>
          <span className="text-[10px] text-zinc-500 font-mono">
            {incidents.length} Records Verified
          </span>
        </div>

        <div className="space-y-2.5 font-mono text-xs">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-3 rounded bg-[#07080a] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-emerald-400">#{inc.id}</span>
                  <span className="text-zinc-400">{inc.repo}</span>
                </div>
                <div className="text-zinc-200 truncate">{inc.title}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[11px]">
                <span className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  {inc.rootCause?.confidenceScore || 0}% Match
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                  {inc.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
