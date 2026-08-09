"use client";

import React, { useState, useMemo } from "react";
import { Incident } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import { Search, Filter, RefreshCw, GitBranch, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaneIncidentListProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelectIncident: (id: string) => void;
  className?: string;
}

export function PaneIncidentList({
  incidents,
  selectedId,
  onSelectIncident,
  className,
}: PaneIncidentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.repo.toLowerCase().includes(q) ||
        inc.errorMessage.toLowerCase().includes(q)
      );
    });
  }, [incidents, searchQuery]);

  const handleRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 500);
  };

  return (
    <div
      className={cn(
        "w-[280px] shrink-0 border-r border-zinc-800 bg-[#0a0c0f] flex flex-col h-screen sticky top-0 font-mono text-[#c9d1d9] console-scanlines",
        className
      )}
    >
      {/* Pane 2 Header */}
      <div className="p-3.5 border-b border-zinc-800 space-y-2.5 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100 uppercase tracking-wide">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACTIVE INCIDENTS</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({incidents.length})
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1 text-zinc-400 hover:text-emerald-400 bg-zinc-900 rounded border border-zinc-800 transition-colors"
            title="Refresh Ingestion Stream"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin text-emerald-400")} />
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative font-mono">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-[11px] bg-zinc-950 border border-zinc-800 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
          />
        </div>
      </div>

      {/* Incident List Rows */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => {
            const isSelected = selectedId === incident.id;
            // Format short ID like #INC-8492
            const shortId = incident.id.startsWith("INC-")
              ? `#${incident.id}`
              : `#INC-${incident.id.slice(0, 5).toUpperCase()}`;

            return (
              <button
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded border transition-all font-mono space-y-1.5 group relative",
                  isSelected
                    ? "bg-emerald-950/30 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30"
                    : "bg-[#0d0f12] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#12151b]"
                )}
              >
                {/* Row Header: Short ID, Status Badge, Timestamp */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "text-[11px] font-mono font-bold tracking-tight",
                      isSelected ? "text-emerald-300" : "text-emerald-400/90"
                    )}
                  >
                    {shortId}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={incident.status} />
                  </div>
                </div>

                {/* Title */}
                <div
                  className={cn(
                    "text-xs font-bold truncate leading-tight font-mono transition-colors",
                    isSelected ? "text-zinc-100" : "text-zinc-200 group-hover:text-emerald-300"
                  )}
                >
                  {incident.title}
                </div>

                {/* Footer: Repo & Time ago */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 font-mono">
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <GitBranch className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="truncate">{incident.repo}</span>
                  </span>
                  <span className="shrink-0 text-zinc-500 font-mono">
                    {formatTimeAgo(incident.createdAt)}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs font-mono text-zinc-500 space-y-1">
            <div className="text-zinc-400 font-bold">No Incidents</div>
            <div className="text-[10px]">sys_status: idle / listening...</div>
          </div>
        )}
      </div>
    </div>
  );
}
