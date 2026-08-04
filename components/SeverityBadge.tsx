"use client";

import React from "react";
import { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showIcon?: boolean;
}

export function SeverityBadge({
  severity,
  className,
  showIcon = true,
}: SeverityBadgeProps) {
  const configs = {
    critical: {
      label: "CRITICAL",
      bg: "bg-rose-950/60 border-rose-800/60 text-rose-400 shadow-rose-950/40",
      icon: ShieldAlert,
      dot: "bg-rose-500 animate-pulse",
    },
    high: {
      label: "HIGH",
      bg: "bg-orange-950/60 border-orange-800/60 text-orange-400 shadow-orange-950/40",
      icon: AlertTriangle,
      dot: "bg-orange-500",
    },
    medium: {
      label: "MEDIUM",
      bg: "bg-amber-950/60 border-amber-800/60 text-amber-300 shadow-amber-950/40",
      icon: AlertCircle,
      dot: "bg-amber-400",
    },
    low: {
      label: "LOW",
      bg: "bg-slate-900/80 border-slate-700/60 text-slate-400 shadow-slate-950/40",
      icon: Info,
      dot: "bg-slate-500",
    },
  };

  const config = configs[severity] || configs.low;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider border shadow-sm backdrop-blur-sm transition-all",
        config.bg,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}
