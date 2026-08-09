"use client";

import React, { useState } from "react";
import { TimelineEvent } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import {
  Bell,
  Sparkles,
  User,
  Wrench,
  GitPullRequest,
  GitMerge,
  Search,
  ArrowRightLeft,
  Terminal,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getEventCategory = (type: string) => {
    const uppercaseType = type.toUpperCase();
    if (uppercaseType.includes("PR_MERGED") || uppercaseType.includes("PR MERGED")) return "PR_MERGED";
    if (uppercaseType.includes("STATUS")) return "STATUS_CHANGE";
    if (uppercaseType.includes("AI") || uppercaseType.includes("TRIAGE")) return "AI_TRIAGE";
    if (uppercaseType.includes("ROOT_CAUSE")) return "ROOT_CAUSE";
    if (uppercaseType.includes("HOTFIX_OPENED") || uppercaseType.includes("PR")) return "PR_OPENED";
    if (uppercaseType.includes("HOTFIX")) return "HOTFIX_GENERATED";
    if (uppercaseType.includes("NOTIFICATION")) return "NOTIFICATION_SENT";
    if (uppercaseType.includes("ASSIGNMENT") || uppercaseType.includes("ASSIGN")) return "ASSIGNMENT";
    return "MANUAL_ACTION";
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "PR_MERGED":
        return <GitMerge className="w-3 h-3 text-purple-400" />;
      case "STATUS_CHANGE":
        return <ArrowRightLeft className="w-3 h-3 text-cyan-400" />;
      case "AI_TRIAGE":
        return <Sparkles className="w-3 h-3 text-emerald-400" />;
      case "ROOT_CAUSE":
        return <Search className="w-3 h-3 text-rose-400" />;
      case "HOTFIX_GENERATED":
        return <Wrench className="w-3 h-3 text-amber-400" />;
      case "PR_OPENED":
        return <GitPullRequest className="w-3 h-3 text-emerald-400" />;
      case "NOTIFICATION_SENT":
        return <Bell className="w-3 h-3 text-cyan-400" />;
      case "ASSIGNMENT":
        return <UserCheck className="w-3 h-3 text-zinc-300" />;
      default:
        return <Terminal className="w-3 h-3 text-zinc-400" />;
    }
  };

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "PR_MERGED":
        return "border-purple-800/60 bg-purple-950/40 text-purple-300";
      case "STATUS_CHANGE":
        return "border-cyan-800/60 bg-cyan-950/40 text-cyan-300";
      case "AI_TRIAGE":
        return "border-emerald-800/60 bg-emerald-950/40 text-emerald-300";
      case "ROOT_CAUSE":
        return "border-rose-800/60 bg-rose-950/40 text-rose-300";
      case "HOTFIX_GENERATED":
        return "border-amber-800/60 bg-amber-950/40 text-amber-300";
      case "PR_OPENED":
        return "border-emerald-800/60 bg-emerald-950/40 text-emerald-300";
      case "NOTIFICATION_SENT":
        return "border-zinc-800 bg-zinc-900 text-zinc-400";
      case "ASSIGNMENT":
        return "border-zinc-700 bg-zinc-900 text-zinc-300";
      default:
        return "border-zinc-800 bg-zinc-950 text-zinc-400";
    }
  };

  return (
    <div className={cn("relative pl-6 space-y-3 font-mono", className)}>
      {/* Vertical connected line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-800/80" />

      {events.map((event, index) => {
        const category = getEventCategory(event.type);
        const isNotification = category === "NOTIFICATION_SENT";

        // Extract URL if present
        const urlMatch = event.message.match(/https?:\/\/[^\s]+/);

        return (
          <div key={event.id || index} className="relative flex items-start group">
            {/* Node Icon */}
            <div
              className={cn(
                "absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border shadow-sm transition-transform group-hover:scale-105",
                getBadgeStyle(category)
              )}
            >
              {getIcon(category)}
            </div>

            {/* Card Content */}
            <div
              className={cn(
                "flex-1 border rounded-lg p-3 shadow-md transition-all font-mono",
                isNotification
                  ? "bg-[#0a0c0f]/60 border-zinc-800/60"
                  : "bg-[#0d0f12] border-zinc-800 hover:border-zinc-700"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {category.replace("_", " ")}
                  </span>
                  {event.statusBadge && <StatusBadge status={event.statusBadge} />}
                </div>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {event.timestamp}
                </span>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                {event.message}
              </p>

              {urlMatch && (
                <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between">
                  <a
                    href={urlMatch[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:underline"
                  >
                    <span>sys_link: open URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

