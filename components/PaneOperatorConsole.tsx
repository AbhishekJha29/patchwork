"use client";

import React, { useState } from "react";
import { Incident } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import {
  Wrench,
  GitPullRequest,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Terminal,
  ShieldCheck,
  FileCode,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaneOperatorConsoleProps {
  incident: Incident | null;
  className?: string;
}

export function PaneOperatorConsole({
  incident,
  className,
}: PaneOperatorConsoleProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const hasFix = Boolean(
    incident?.fix?.diff && incident.fix.diff !== "// No patch diff recorded"
  );
  const prUrl = incident?.fix?.prUrl;
  const isVerified = Boolean(
    hasFix && (incident?.status === "in_review" || incident?.status === "deployed" || incident?.status === "resolved")
  );

  const handleManualGenerateFix = async () => {
    if (!incident || hasFix) return;
    setIsGenerating(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FIX_GENERATED" }),
      });
      if (!res.ok) throw new Error("Failed to trigger fix generation");
      setActionFeedback("Fix generated successfully");
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScrollToLogs = () => {
    const el = document.getElementById("remediation-timeline");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside
      className={cn(
        "w-[220px] shrink-0 border-l border-zinc-800 bg-[#0d0f12] flex flex-col justify-between h-screen sticky top-0 z-30 font-mono text-[#c9d1d9] select-none console-scanlines p-3.5 space-y-5 overflow-y-auto",
        className
      )}
    >
      <div className="space-y-5 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
              OPERATOR CONSOLE
            </h2>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* PLATFORM CONTEXT Card */}
        <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-2.5 font-mono">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            PLATFORM CONTEXT
          </div>

          {incident ? (
            <div className="space-y-2 text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-500">Repository:</div>
                <div className="font-bold text-zinc-200 truncate flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{incident.repo}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-500">Target Ref:</div>
                <div className="text-zinc-300 font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 truncate">
                  {incident.fix?.branchName || "refs/heads/main"}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-500">Incident:</span>
                <span className="text-emerald-400 font-bold text-[11px]">
                  #{incident.id}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic">
              No target selected
            </div>
          )}
        </div>

        {/* Action Buttons Stack */}
        <div className="space-y-2.5 font-mono">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-0.5">
            Automated Operations
          </div>

          {/* 1. GENERATE FIX (Prominent/Filled style) */}
          {hasFix ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 cursor-default"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>FIX GENERATED ✔</span>
            </button>
          ) : (
            <button
              onClick={handleManualGenerateFix}
              disabled={!incident || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 text-zinc-950 animate-spin" />
              ) : (
                <Wrench className="w-3.5 h-3.5 text-zinc-950" />
              )}
              <span>GENERATE FIX</span>
            </button>
          )}

          {/* 2. VERIFY PATCH (Outlined style) */}
          <button
            disabled
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono font-bold transition-all border",
              isVerified
                ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                : hasFix
                ? "bg-amber-950/30 border-amber-800 text-amber-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-600"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isVerified ? "PATCH VERIFIED ✔" : hasFix ? "VERIFYING PATCH..." : "VERIFY PATCH"}
            </span>
          </button>

          {/* 3. CREATE PULL REQUEST / VIEW PULL REQUEST */}
          {prUrl ? (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-800 hover:bg-cyan-900/50 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>VIEW PULL REQUEST ↗</span>
            </a>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono font-bold bg-zinc-950 border border-zinc-800 text-zinc-600 cursor-not-allowed"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-zinc-600" />
              <span>PULL REQUEST PENDING</span>
            </button>
          )}

          {actionFeedback && (
            <div className="text-[10px] text-center text-emerald-400 font-mono animate-pulse pt-1">
              {actionFeedback}
            </div>
          )}
        </div>
      </div>

      {/* 4. VIEW RUNTIME LOGS (Link at bottom) */}
      <div className="pt-3 border-t border-zinc-800 font-mono">
        <button
          onClick={handleScrollToLogs}
          disabled={!incident}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded transition-colors disabled:opacity-40"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>VIEW RUNTIME LOGS</span>
        </button>
      </div>
    </aside>
  );
}
