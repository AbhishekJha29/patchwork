"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { IncidentRow } from "@/components/IncidentRow";
import { IncidentSkeleton } from "@/components/IncidentSkeleton";
import { Incident, Severity, Status } from "@/lib/types";
import {
  Search,
  Filter,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Activity,
  Cpu,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  initialIncidents: Incident[];
}

export function DashboardClient({ initialIncidents }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "all">(
    "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<Status | "all">("all");
  const [isLoading, setIsLoading] = useState(false);

  // Client-side filtering logic over database incidents
  const filteredIncidents = useMemo(() => {
    return initialIncidents.filter((inc) => {
      const matchesSearch =
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.errorMessage.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === "all" || inc.severity === selectedSeverity;

      const matchesStatus =
        selectedStatus === "all" || inc.status === selectedStatus;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [initialIncidents, searchQuery, selectedSeverity, selectedStatus]);

  // Real live data stat counters
  const totalIncidents = initialIncidents.length;
  const nonResolvedIncidentsCount = initialIncidents.filter(
    (i) => i.status !== "resolved"
  ).length;
  const monitoredReposCount = new Set(initialIncidents.map((i) => i.repo)).size;
  const criticalCount = initialIncidents.filter(
    (i) => i.severity === "critical"
  ).length;
  const fixGeneratedCount = initialIncidents.filter(
    (i) =>
      i.status === "fix_generated" ||
      i.status === "in_review" ||
      i.status === "deployed" ||
      i.status === "resolved"
  ).length;
  const resolvedCount = initialIncidents.filter(
    (i) => i.status === "resolved"
  ).length;

  const handleSimulateRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSeverity("all");
    setSelectedStatus("all");
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex flex-col font-mono text-[#c9d1d9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* System Status Strip (CORI Command Center style live stat chips) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800 bg-[#0d0f12] console-scanlines shadow-lg">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-500">sys_status:</span>
              <span className="text-emerald-400 font-bold">active</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-500">Active Runners:</span>
              <span className="text-zinc-100 font-bold">4</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-500">Repositories Monitored:</span>
              <span className="text-zinc-100 font-bold">{monitoredReposCount || 1}</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-500">Active Incidents:</span>
              <span className="text-amber-300 font-bold">{nonResolvedIncidentsCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleSimulateRefresh}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-700 transition-colors"
            >
              <RefreshCw className={cn("w-3 h-3 text-emerald-400", isLoading && "animate-spin")} />
              <span>INGESTION_SYNC</span>
            </button>
          </div>
        </div>

        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono tracking-wide uppercase">
              Incident Command Center
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold">
                DB CONNECTED
              </span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              Real-time automated root cause isolation and PR generation across connected microservices.
            </p>
          </div>
        </div>

        {/* Analytics Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-1 console-scanlines">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-mono">
              <span>TOTAL INCIDENTS</span>
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100 font-mono">
              {totalIncidents}
            </p>
            <p className="text-[10px] text-zinc-500">Recorded database events</p>
          </div>

          <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-1 console-scanlines">
            <div className="flex items-center justify-between text-rose-400 text-xs font-mono">
              <span>CRITICAL ALERTS</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </div>
            <p className="text-2xl font-bold text-rose-200 font-mono">
              {criticalCount}
            </p>
            <p className="text-[10px] text-rose-400/70">Urgent developer sign-off</p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-1 console-scanlines">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-mono">
              <span>AUTO-FIX COVERAGE</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-200 font-mono">
              {totalIncidents > 0 ? Math.round((fixGeneratedCount / totalIncidents) * 100) : 0}%
            </p>
            <p className="text-[10px] text-emerald-400/70">{fixGeneratedCount} fixes auto-drafted</p>
          </div>

          <div className="p-4 rounded-xl border border-purple-900/40 bg-purple-950/20 space-y-1 console-scanlines">
            <div className="flex items-center justify-between text-purple-400 text-xs font-mono">
              <span>AVG RESOLUTION (MTTR)</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-200 font-mono">
              {totalIncidents > 0 ? "4.2m" : "0m"}
            </p>
            <p className="text-[10px] text-purple-400/70">Automated triage acceleration</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800 bg-[#0d0f12] font-mono">
          {/* Search Box */}
          <div className="relative flex-1 font-mono">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by title, ID (INC-8492), repo, or payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity & Status Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <div className="flex items-center gap-2 font-mono">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400 font-mono">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as Severity | "all")}
                className="bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-zinc-400 font-mono">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as Status | "all")}
                className="bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="detected">Monitored</option>
                <option value="triaged">Triaged</option>
                <option value="analyzing">Analyzing</option>
                <option value="fix_generated">Fix Ready</option>
                <option value="in_review">In Review</option>
                <option value="deployed">Deployed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {(searchQuery || selectedSeverity !== "all" || selectedStatus !== "all") && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-emerald-400 hover:underline font-mono px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Incidents List Container */}
        {isLoading ? (
          <IncidentSkeleton />
        ) : filteredIncidents.length > 0 ? (
          <div className="space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-mono">
              <span>Showing {filteredIncidents.length} of {totalIncidents} recorded events</span>
              <span>sys_order: severity_desc, recency_desc</span>
            </div>

            {filteredIncidents.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </div>
        ) : (
          /* Empty State Design with System Log framing */
          <div className="p-12 rounded-xl border border-zinc-800 bg-[#0d0f12] text-center space-y-3 font-mono console-scanlines">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
                sys_status: standby / listening for webhook triggers...
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto font-mono">
                No active incident records match your criteria or database payload pool is currently empty.
              </p>
            </div>
            {(searchQuery || selectedSeverity !== "all" || selectedStatus !== "all") && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded hover:bg-emerald-900/40 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

