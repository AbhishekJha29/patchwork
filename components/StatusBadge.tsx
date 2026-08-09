"use client";

import React from "react";
import { Status } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs: Record<
    Status,
    { label: string; bg: string; dot: string }
  > = {
    detected: {
      label: "MONITORED",
      bg: "bg-rose-950/40 border-rose-800/60 text-rose-400",
      dot: "bg-rose-500 animate-pulse",
    },
    triaged: {
      label: "TRIAGED",
      bg: "bg-purple-950/40 border-purple-800/60 text-purple-300",
      dot: "bg-purple-400",
    },
    analyzing: {
      label: "ANALYZING",
      bg: "bg-emerald-950/50 border-emerald-700/60 text-emerald-400",
      dot: "bg-emerald-400 animate-pulse",
    },
    fix_generated: {
      label: "FIX_READY",
      bg: "bg-emerald-950/30 border-emerald-800/60 text-emerald-300",
      dot: "bg-emerald-500",
    },
    in_review: {
      label: "IN_REVIEW",
      bg: "bg-amber-950/40 border-amber-800/60 text-amber-300",
      dot: "bg-amber-400",
    },
    deployed: {
      label: "DEPLOYED",
      bg: "bg-cyan-950/40 border-cyan-800/60 text-cyan-300",
      dot: "bg-cyan-400",
    },
    resolved: {
      label: "RESOLVED",
      bg: "bg-zinc-900/80 border-zinc-700/60 text-zinc-400",
      dot: "bg-zinc-500",
    },
  };

  const config = configs[status] || configs.detected;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider border backdrop-blur-sm transition-colors uppercase select-none",
        config.bg,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}

