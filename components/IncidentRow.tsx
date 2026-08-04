"use client";

import React from "react";
import Link from "next/link";
import { Incident } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import { GitBranch, ChevronRight } from "lucide-react";

interface IncidentRowProps {
  incident: Incident;
}

export function IncidentRow({ incident }: IncidentRowProps) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/90 hover:border-slate-700/90 transition-all shadow-sm hover:shadow-cyan-950/20"
    >
      {/* Left section: ID, Severity, Title, Repo */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <SeverityBadge severity={incident.severity} className="mt-0.5 shrink-0" />

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400/90 font-medium">
              {incident.id}
            </span>
            {incident.occurrenceCount && incident.occurrenceCount > 1 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-bold">
                {incident.occurrenceCount}x
              </span>
            )}
            {incident.triagedAt === null && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 animate-pulse">
                Triage pending
              </span>
            )}
            {incident.aiTags && incident.aiTags.length > 0 && (
              <div className="flex items-center gap-1">
                {incident.aiTags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-cyan-300 rounded border border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <GitBranch className="w-3 h-3 text-slate-500" />
              {incident.repo}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
            {incident.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-1 font-mono">
            {incident.errorMessage}
          </p>
        </div>
      </div>

      {/* Right section: Status, Assignee, Time, Arrow */}
      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/50">
        <StatusBadge status={incident.status} />

        <div className="flex items-center gap-3">
          {/* Assignee Avatar */}
          <div className="flex items-center gap-2" title={`Assigned to ${incident.assignee.name}`}>
            <img
              src={incident.assignee.avatar}
              alt={incident.assignee.name}
              className="w-6 h-6 rounded-full border border-slate-700 object-cover"
            />
            <span className="text-xs text-slate-400 hidden lg:inline">
              {incident.assignee.name.split(" ")[0]}
            </span>
          </div>

          <span className="text-xs font-mono text-slate-500 w-16 text-right">
            {formatTimeAgo(incident.createdAt)}
          </span>

          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
