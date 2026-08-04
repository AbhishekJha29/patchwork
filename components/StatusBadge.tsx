"use client";

import React from "react";
import { Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Radar,
  FileSearch,
  Sparkles,
  GitPullRequest,
  Eye,
  Rocket,
  CheckCircle2,
} from "lucide-react";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs: Record<
    Status,
    { label: string; bg: string; icon: React.ElementType }
  > = {
    detected: {
      label: "Detected",
      bg: "bg-red-500/10 border-red-500/30 text-red-400",
      icon: Radar,
    },
    triaged: {
      label: "Triaged",
      bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
      icon: FileSearch,
    },
    analyzing: {
      label: "Analyzing AI",
      bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse",
      icon: Sparkles,
    },
    fix_generated: {
      label: "Fix Generated",
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      icon: GitPullRequest,
    },
    in_review: {
      label: "In Review",
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
      icon: Eye,
    },
    deployed: {
      label: "Canary Deployed",
      bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
      icon: Rocket,
    },
    resolved: {
      label: "Resolved",
      bg: "bg-teal-500/10 border-teal-500/30 text-teal-400",
      icon: CheckCircle2,
    },
  };

  const config = configs[status] || configs.detected;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border backdrop-blur-md transition-colors",
        config.bg,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
