"use client";

import React from "react";
import { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showIcon?: boolean;
}

export function SeverityBadge({
  severity,
  className,
}: SeverityBadgeProps) {
  const configs = {
    critical: {
      label: "CRITICAL",
      bg: "bg-rose-950/50 border-rose-800/70 text-rose-400",
      dot: "bg-rose-500 animate-pulse",
    },
    high: {
      label: "HIGH",
      bg: "bg-amber-950/50 border-amber-800/70 text-amber-400",
      dot: "bg-amber-500",
    },
    medium: {
      label: "MEDIUM",
      bg: "bg-zinc-900/90 border-zinc-700/70 text-zinc-300",
      dot: "bg-zinc-400",
    },
    low: {
      label: "LOW",
      bg: "bg-zinc-950/80 border-zinc-800/80 text-zinc-500",
      dot: "bg-zinc-600",
    },
  };

  const config = configs[severity] || configs.low;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border transition-colors select-none",
        config.bg,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}

