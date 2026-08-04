"use client";

import React from "react";
import { TimelineEvent } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import {
  BellRing,
  Sparkles,
  User,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "system":
        return <BellRing className="w-3.5 h-3.5 text-rose-400" />;
      case "ai":
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case "user":
        return <User className="w-3.5 h-3.5 text-amber-400" />;
      case "action":
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBorderColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "system":
        return "border-rose-500/40 bg-rose-950/40";
      case "ai":
        return "border-cyan-500/40 bg-cyan-950/40";
      case "user":
        return "border-amber-500/40 bg-amber-950/40";
      case "action":
        return "border-emerald-500/40 bg-emerald-950/40";
      default:
        return "border-slate-700 bg-slate-900";
    }
  };

  return (
    <div className={cn("relative pl-6 space-y-6", className)}>
      {/* Vertical connected line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800" />

      {events.map((event, index) => (
        <div key={event.id || index} className="relative flex items-start group">
          {/* Node Icon */}
          <div
            className={cn(
              "absolute -left-6 top-0.5 flex items-center justify-center w-6 h-6 rounded-full border shadow-md transition-transform group-hover:scale-110",
              getBorderColor(event.type)
            )}
          >
            {getIcon(event.type)}
          </div>

          {/* Card Content */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 shadow-md hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 capitalize">
                  {event.type === "ai" ? "Patchwork AI Agent" : event.type}
                </span>
                {event.statusBadge && <StatusBadge status={event.statusBadge} />}
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {event.timestamp}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {event.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
