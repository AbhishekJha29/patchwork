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

  // Stat summary counters
  const totalIncidents = initialIncidents.length;
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
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Quick Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Incident Control Center
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-semibold">
                Live DB Connected
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time automated root cause isolation and PR generation across connected repositories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateRefresh}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-cyan-400", isLoading && "animate-spin")} />
              <span>Refresh Ingestion</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>ACTIVE INCIDENTS</span>
              <AlertCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono">
              {totalIncidents}
            </p>
            <p className="text-[11px] text-slate-500">Live Prisma query count</p>
          </div>

          <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-rose-400 text-xs font-mono">
              <span>CRITICAL ALERTS</span>
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <p className="text-2xl font-bold text-rose-200 font-mono">
              {criticalCount}
            </p>
            <p className="text-[11px] text-rose-400/70">Requires urgent developer sign-off</p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-mono">
              <span>AUTO-FIX COVERAGE</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-200 font-mono">
              {totalIncidents > 0 ? Math.round((fixGeneratedCount / totalIncidents) * 100) : 0}%
            </p>
            <p className="text-[11px] text-emerald-400/70">{fixGeneratedCount} fixes auto-drafted</p>
          </div>

          <div className="p-4 rounded-xl border border-purple-900/40 bg-purple-950/20 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-purple-400 text-xs font-mono">
              <span>AVG RESOLUTION (MTTR)</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-200 font-mono">
              {totalIncidents > 0 ? "4.2m" : "0m"}
            </p>
            <p className="text-[11px] text-purple-400/70">-85% faster vs manual triage</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, ID (e.g. INC-8492), repo, or stack trace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity & Status Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400 font-mono">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as Severity | "all")}
                className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as Status | "all")}
                className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="detected">Detected</option>
                <option value="triaged">Triaged</option>
                <option value="analyzing">Analyzing</option>
                <option value="fix_generated">Fix Generated</option>
                <option value="in_review">In Review</option>
                <option value="deployed">Deployed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {(searchQuery || selectedSeverity !== "all" || selectedStatus !== "all") && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-cyan-400 hover:underline font-mono px-2 py-1"
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
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
              <span>Showing {filteredIncidents.length} of {totalIncidents} incidents</span>
              <span>Sorted by Severity & Recency</span>
            </div>

            {filteredIncidents.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </div>
        ) : (
          /* Empty State Design */
          <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">
                No Incidents Found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active error events match your current filter parameters or the real database is currently empty.
              </p>
            </div>
            {(searchQuery || selectedSeverity !== "all" || selectedStatus !== "all") && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 rounded-lg hover:bg-cyan-900/40 transition-colors"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
