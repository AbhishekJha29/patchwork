"use client";

import React from "react";
import { Status, Incident } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, ArrowRight } from "lucide-react";

interface PipelineStepperProps {
  incident: Incident;
  className?: string;
}

export function PipelineStepper({ incident, className }: PipelineStepperProps) {
  // Map incident status to stage index (0-indexed)
  // Stages:
  // 0: 01 Webhook Received
  // 1: 02 AI Triage
  // 2: 03 Root Cause Analysis
  // 3: 04 Hotfix Generated
  // 4: 05 PR Opened
  // 5: 06 Merged
  // 6: 07 Resolved

  const getActiveStepIndex = (status: Status, inc: Incident) => {
    const s = status.toLowerCase();
    if (s === "resolved") return 6;
    if (s === "deployed" || (inc.fix?.mergedAt)) return 5;
    if (s === "in_review" || (inc.fix?.prUrl)) return 4;
    if (s === "fix_generated" || (inc.fix?.diff)) return 3;
    if (s === "analyzing") return 2;
    if (s === "triaged") return 1;
    return 0; // detected
  };

  const currentStepIndex = getActiveStepIndex(incident.status, incident);

  const confidenceScore = incident.rootCause?.confidenceScore || 0;
  const prUrl = incident.fix?.prUrl;
  const hasDiff = Boolean(incident.fix?.diff && incident.fix.diff !== "// No patch diff recorded");
  const isMerged = Boolean(incident.fix?.mergedAt || incident.status === "deployed" || incident.status === "resolved");
  const isResolved = incident.status === "resolved";

  const stages = [
    {
      num: "01",
      name: "Webhook Received",
      metric: "HTTP 200",
    },
    {
      num: "02",
      name: "AI Triage",
      metric: incident.triagedAt ? "Triage: 1.8s" : "Auto-Triaged",
    },
    {
      num: "03",
      name: "Root Cause Analysis",
      metric: confidenceScore > 0 ? `Confidence: ${confidenceScore}%` : "In Progress",
    },
    {
      num: "04",
      name: "Hotfix Generated",
      metric: hasDiff ? "Diff Ready" : "Pending",
    },
    {
      num: "05",
      name: "PR Opened",
      metric: prUrl ? "PR Created" : "Draft",
    },
    {
      num: "06",
      name: "Merged",
      metric: isMerged ? "Merged Main" : "Pending Merge",
    },
    {
      num: "07",
      name: "Resolved",
      metric: isResolved ? "Closed" : "Standby",
    },
  ];

  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-zinc-800 bg-[#0d0f12] shadow-xl overflow-x-auto console-scanlines",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-[780px]">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStepIndex || (idx === 6 && isResolved);
          const isCurrent = idx === currentStepIndex && !isResolved;
          const isPending = idx > currentStepIndex;

          return (
            <React.Fragment key={stage.num}>
              {/* Step Chip */}
              <div
                className={cn(
                  "flex-1 flex flex-col p-2.5 rounded-lg border font-mono transition-all relative group",
                  isCompleted &&
                    "border-emerald-800/60 bg-emerald-950/20 text-emerald-400",
                  isCurrent &&
                    "border-emerald-500/90 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/50",
                  isPending &&
                    "border-zinc-800/70 bg-zinc-950/40 text-zinc-600 opacity-60"
                )}
              >
                {/* Header: Step Number & Status Indicator */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    {stage.num}
                  </span>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  )}
                </div>

                {/* Stage Title */}
                <div
                  className={cn(
                    "text-xs font-semibold truncate leading-tight",
                    isCompleted && "text-zinc-200",
                    isCurrent && "text-emerald-200 font-bold",
                    isPending && "text-zinc-500"
                  )}
                >
                  {stage.name}
                </div>

                {/* Metric Chip */}
                <div className="mt-1.5 flex items-center">
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors truncate max-w-full",
                      isCompleted &&
                        "bg-emerald-950/60 border-emerald-800/70 text-emerald-300 font-medium",
                      isCurrent &&
                        "bg-emerald-900/60 border-emerald-600 text-emerald-200 font-bold animate-pulse",
                      isPending &&
                        "bg-zinc-900/50 border-zinc-800 text-zinc-600"
                    )}
                  >
                    {stage.metric}
                  </span>
                </div>
              </div>

              {/* Separator Arrow (except last item) */}
              {idx < stages.length - 1 && (
                <div className="shrink-0 text-zinc-700 px-0.5">
                  <ArrowRight className={cn(
                    "w-3.5 h-3.5",
                    idx < currentStepIndex ? "text-emerald-600/70" : "text-zinc-700"
                  )} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
