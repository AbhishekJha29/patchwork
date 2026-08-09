"use client";

import React, { useState } from "react";
import { Incident } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { Timeline } from "./Timeline";
import { DiffViewer } from "./DiffViewer";
import { PipelineStepper } from "./PipelineStepper";
import {
  Sparkles,
  Terminal,
  GitCommit,
  User,
  Clock,
  ExternalLink,
  Code2,
  AlertOctagon,
  FileCode,
  Activity,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaneIncidentDetailProps {
  incident: Incident | null;
  className?: string;
}

export function PaneIncidentDetail({
  incident,
  className,
}: PaneIncidentDetailProps) {
  const [isStackCollapsed, setIsStackCollapsed] = useState(false);

  if (!incident) {
    return (
      <div
        className={cn(
          "flex-1 bg-[#08090a] p-8 flex flex-col items-center justify-center text-center font-mono text-[#c9d1d9] console-scanlines h-screen overflow-y-auto",
          className
        )}
      >
        <div className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
          <Terminal className="w-6 h-6 text-zinc-600" />
        </div>
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
          NO INCIDENT SELECTED
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Select an incident from the list in Pane 2 to inspect operator analysis, root cause, and remediation timeline.
        </p>
      </div>
    );
  }

  const confidenceScore = incident.rootCause?.confidenceScore || 0;

  // Extract file paths from stackTrace or stackFrames
  const affectedFiles = incident.stackTrace.map((line) => {
    // Extract file path inside parentheses, e.g. at funcName (filePath:lineNo)
    const match = line.match(/\(([^)]+)\)/);
    return match ? match[1] : line.replace(/^at\s+/, "");
  });

  return (
    <div
      className={cn(
        "flex-1 bg-[#08090a] flex flex-col h-screen overflow-y-auto font-mono text-[#c9d1d9] console-scanlines border-r border-zinc-800",
        className
      )}
    >
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Top Eyebrow & Title Banner */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                OPERATOR ANALYSIS
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300">
                #{incident.id}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>

            {/* Confidence Score Bar & Percentage */}
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span className="text-[11px] text-zinc-400 font-semibold">
                Confidence: {confidenceScore}%
              </span>
              <div className="w-24 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 leading-snug font-mono">
            {incident.title}
          </h1>
        </div>

        {/* Pipeline Stepper Component */}
        <PipelineStepper incident={incident} />

        {/* ROOT CAUSE ANALYSIS Section */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-4 shadow-xl console-scanlines">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                ROOT CAUSE ANALYSIS
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              Analysis Engine: Gemini AI — readonly
            </span>
          </div>

          {/* Reasoning / Summary Quoted Card */}
          <div className="p-4 rounded-lg bg-[#07080a] border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-mono space-y-2 relative">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Diagnostic Summary & Isolation Reasoning:
            </div>
            <p className="italic text-zinc-200">
              "{incident.rootCause.reasoning || incident.aiSummary || "listening for webhook triggers... root cause analysis standby"}"
            </p>
          </div>

          {/* Culprit Commit details if available */}
          {incident.rootCause.culpritCommit && (
            <div className="p-3 rounded border border-zinc-800 bg-zinc-950 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5" />
                  Culprit Commit: {incident.rootCause.commitHash.slice(0, 7)}
                </span>
                <span>{new Date(incident.rootCause.culpritCommit.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-zinc-200 text-xs font-mono font-medium">
                "{incident.rootCause.culpritCommit.message}"
              </p>
              <div className="text-[10px] text-zinc-500">
                Author: {incident.rootCause.culpritCommit.author}
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Row: FAILURE EVIDENCE & AFFECTED FILES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column A: FAILURE EVIDENCE */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  FAILURE EVIDENCE
                </h3>
              </div>
              <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-900/60 px-1.5 py-0.5 rounded font-mono">
                Log Exception
              </span>
            </div>

            <div className="p-3 rounded bg-rose-950/20 border border-rose-900/50 text-[11px] text-rose-300 font-mono leading-relaxed font-semibold">
              {incident.errorMessage}
            </div>

            {/* Stack trace excerpt preview */}
            <div className="bg-[#07080a] border border-zinc-800 rounded p-2.5 font-mono text-[11px] text-zinc-400 overflow-x-auto max-h-44 space-y-1 flex-1">
              {incident.stackTrace.slice(0, 5).map((line, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-zinc-600 mr-2">{idx + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column B: AFFECTED FILES */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <FileCode className="w-4 h-4" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  AFFECTED FILES
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {affectedFiles.length} file(s)
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56">
              {affectedFiles.length > 0 ? (
                affectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#07080a] border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:border-zinc-700 transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-zinc-600 italic">
                  No affected files recorded in trace.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patch Diff Viewer if available */}
        {incident.fix?.diff && incident.fix.diff !== "// No patch diff recorded" && (
          <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                PROPOSED CODE PATCH
              </h3>
              {incident.fix.branchName && (
                <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  branch: {incident.fix.branchName}
                </span>
              )}
            </div>
            <DiffViewer diff={incident.fix.diff} filename={`${incident.repo}/patch.diff`} />
          </div>
        )}

        {/* REMEDIATION TIMELINE */}
        <div id="remediation-timeline" className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-4 shadow-xl console-scanlines">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Activity className="w-4 h-4" />
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                REMEDIATION TIMELINE
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {incident.timeline.length} Audit Events
            </span>
          </div>

          <Timeline events={incident.timeline} />
        </div>
      </div>
    </div>
  );
}
