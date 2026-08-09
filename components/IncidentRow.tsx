"use client";

import React from "react";
import Link from "next/link";
import { Incident } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import { GitBranch, ChevronRight, Terminal } from "lucide-react";

interface IncidentRowProps {
  incident: Incident;
}

export function IncidentRow({ incident }: IncidentRowProps) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-800 bg-[#0d0f12] hover:bg-[#12151b] hover:border-zinc-700 transition-all font-mono shadow-sm"
    >
      {/* Left section: ID, Severity, Title, Repo */}
      <div className="flex items-start gap-3 flex-1 min-w-0 font-mono">
        <SeverityBadge severity={incident.severity} className="mt-0.5 shrink-0" />

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400">
              {incident.id}
            </span>
            {incident.occurrenceCount && incident.occurrenceCount > 1 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-bold">
                {incident.occurrenceCount}x
              </span>
            )}
            {incident.triagedAt === null && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 animate-pulse">
                triage_pending
              </span>
            )}
            {incident.aiTags && incident.aiTags.length > 0 && (
              <div className="flex items-center gap-1">
                {incident.aiTags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-900 text-zinc-400 rounded border border-zinc-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-zinc-700">•</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
              <GitBranch className="w-3 h-3 text-zinc-600" />
              {incident.repo}
            </span>
          </div>

          <h3 className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate font-mono">
            {incident.title}
          </h3>

          <p className="text-[11px] text-zinc-500 line-clamp-1 font-mono">
            {incident.errorMessage}
          </p>
        </div>
      </div>

      {/* Right section: Status, Assignee, Time, Arrow */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/60 font-mono">
        <StatusBadge status={incident.status} />

        <div className="flex items-center gap-2.5">
          {/* Assignee Avatar */}
          <div className="flex items-center gap-1.5" title={`Assigned to ${incident.assignee.name}`}>
            <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 font-mono text-[10px] font-bold">
              {incident.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] text-zinc-500 hidden lg:inline font-mono">
              {incident.assignee.name.split(" ")[0]}
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-500 w-14 text-right">
            {formatTimeAgo(incident.createdAt)}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

