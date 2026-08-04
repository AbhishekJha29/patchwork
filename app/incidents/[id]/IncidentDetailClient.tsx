"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffViewer } from "@/components/DiffViewer";
import { Timeline } from "@/components/Timeline";
import { Incident, Status } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  GitPullRequest,
  Terminal,
  GitCommit,
  User,
  Clock,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  AlertOctagon,
  GitBranch,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IncidentDetailClientProps {
  initialIncident: Incident | null;
}

export function IncidentDetailClient({ initialIncident }: IncidentDetailClientProps) {
  if (!initialIncident) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-400">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">
              Incident Not Found
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The requested incident ID does not exist in the database or has been deleted.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const [incident, setIncident] = useState(initialIncident);
  const [currentStatus, setCurrentStatus] = useState<Status>(
    initialIncident.status
  );
  const [isStackCollapsed, setIsStackCollapsed] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);
  const [prCreatedState, setPrCreatedState] = useState(false);

  const handleStatusChange = (newStatus: Status) => {
    setCurrentStatus(newStatus);
    setIncident((prev) => ({
      ...prev,
      status: newStatus,
    }));
  };

  const handleCreatePR = () => {
    setPrCreatedState(true);
    setCurrentStatus("in_review");
    setIncident((prev) => ({
      ...prev,
      status: "in_review",
      fix: {
        ...prev.fix,
        status: "created",
        prUrl: `https://github.com/${prev.repo}/pull/${Math.floor(Math.random() * 100 + 400)}`,
      },
    }));
  };

  const handleCopyPrUrl = () => {
    if (incident.fix.prUrl) {
      navigator.clipboard.writeText(incident.fix.prUrl);
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Status Change Interactive Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Update Status:
            </span>
            <div className="relative">
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="detected">Detected</option>
                <option value="triaged">Triaged</option>
                <option value="analyzing">Analyzing</option>
                <option value="fix_generated">Fix Generated</option>
                <option value="in_review">In Review</option>
                <option value="deployed">Deployed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Detail Header Banner */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-md">
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={currentStatus} />
            {incident.triagedAt === null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-950/60 border border-amber-800/80 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Triage pending...
              </span>
            )}
            {incident.aiTags && incident.aiTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                {incident.aiTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 border border-slate-700 text-cyan-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 ml-auto">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Created {formatTimeAgo(incident.createdAt)}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">
            {incident.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Repository:</span>
              <span className="text-slate-200 font-semibold">{incident.repo}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Assignee:</span>
              <span className="text-slate-200">{incident.assignee.name}</span>
            </div>
          </div>
        </div>

        {/* Grid Layout: Main Analysis (2 Cols) + Vertical Timeline (1 Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main Column (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* AI Root Cause Analysis Card */}
            <div className="p-6 rounded-2xl border border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 via-slate-900/70 to-slate-900/90 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
                <Sparkles className="w-32 h-32 text-cyan-400" />
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-cyan-900/30 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">
                      AI Root Cause Analysis
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Isolated via commit history & trace topology
                    </p>
                  </div>
                </div>

                {/* Confidence Score Badge & Progress */}
                <div className="text-right space-y-1">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border",
                      incident.rootCause.confidenceScore > 0
                        ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                        : "bg-slate-800/80 border-slate-700 text-slate-400"
                    )}
                  >
                    <span>{incident.rootCause.confidenceScore}% Confidence</span>
                  </div>
                  <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                      style={{ width: `${incident.rootCause.confidenceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Culprit Commit Details or Empty/Skipped State */}
              {incident.rootCause.culpritCommit ? (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-rose-400">
                      <GitCommit className="w-4 h-4" /> Culprit Commit: {incident.rootCause.commitHash.slice(0, 7)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {new Date(incident.rootCause.culpritCommit.timestamp).toLocaleString()}
                      </span>
                      {incident.repo && incident.repo !== "unknown/repo" && (
                        <a
                          href={
                            incident.repo.startsWith("http")
                              ? `${incident.repo}/commit/${incident.rootCause.culpritCommit.hash}`
                              : `https://github.com/${incident.repo}/commit/${incident.rootCause.culpritCommit.hash}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <span>View on GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-200 font-sans font-medium text-sm">
                    "{incident.rootCause.culpritCommit.message}"
                  </p>
                  <div className="flex items-center gap-2 text-slate-400 pt-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Author: {incident.rootCause.culpritCommit.author}</span>
                  </div>
                </div>
              ) : incident.rootCause.reasoning?.toLowerCase().includes("skipped") ? (
                <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 text-xs font-mono text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                    <AlertOctagon className="w-4 h-4" /> Root cause analysis skipped
                  </div>
                  <p className="text-slate-400 font-sans">
                    Repository not connected or GITHUB_TOKEN environment variable missing.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono text-slate-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-slate-400">
                    <GitCommit className="w-4 h-4" /> No clear root cause identified
                  </div>
                  <p className="text-slate-400 font-sans">
                    Gemini evaluated candidate commits but found no high-confidence culprit matching the stack trace.
                  </p>
                </div>
              )}

              {/* Reasoning Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                  Reasoning & Diagnosis:
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  {incident.rootCause.reasoning || "Root cause analysis pending..."}
                </p>
              </div>

              {/* AI Summary Quote Box */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 leading-relaxed space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-400">Executive Summary:</span>
                  {incident.triagedAt === null && (
                    <span className="text-[11px] font-mono text-amber-400 italic animate-pulse">
                      Triage pending...
                    </span>
                  )}
                </div>
                <p>
                  {incident.aiSummary
                    ? incident.aiSummary
                    : "AI triage pending. A plain-English summary will appear once processing completes."}
                </p>
              </div>
            </div>

            {/* Suggested Fix & Patch Card */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <GitPullRequest className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <span>Suggested Hotfix & PR</span>
                      {incident.fix.branchName && (
                        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded font-normal flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {incident.fix.branchName}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Automated patch proposal generated via Gemini & GitHub API
                    </p>
                  </div>
                </div>

                {/* View PR Button, Copy Link, or Retry/Failed status */}
                <div className="flex items-center gap-3">
                  {incident.fix.prUrl || prCreatedState ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={incident.fix.prUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-lg hover:bg-emerald-900/60 transition-colors shadow-lg shadow-emerald-950/40"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View PR on GitHub</span>
                      </a>
                      <button
                        onClick={handleCopyPrUrl}
                        className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700"
                        title="Copy PR Link"
                      >
                        {copiedPr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : incident.fix.status === "failed" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold text-rose-400 bg-rose-950/60 border border-rose-800 rounded-lg">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Fix Generation Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Auto PR Pending / Skipped
                    </span>
                  )}
                </div>
              </div>

              {/* Status Specific Banners */}
              {incident.fix.status === "failed" && (
                <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 text-xs font-mono text-rose-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                    <AlertOctagon className="w-4 h-4" /> Hotfix generation encountered an error
                  </div>
                  <p className="text-slate-400 font-sans">
                    {incident.fix.prDescription || "Unable to commit changes or create branch on GitHub."}
                  </p>
                </div>
              )}

              {incident.fix.status !== "pr_opened" && incident.fix.status !== "failed" && !incident.fix.prUrl && (
                <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/10 text-xs font-mono text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-4 h-4" /> Hotfix generation skipped
                  </div>
                  <p className="text-slate-400 font-sans">
                    Root cause confidence score ({incident.rootCause.confidenceScore}%) is below the required 50% threshold for automated PR creation.
                  </p>
                </div>
              )}

              {/* PR Title & Description Box */}
              {(incident.fix.prTitle || incident.fix.prDescription) && (
                <div className="space-y-3">
                  {incident.fix.prTitle && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-emerald-300">
                      <span className="text-slate-500 font-normal mr-2">PR Title:</span>
                      {incident.fix.prTitle}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                      PR Description:
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {incident.fix.prDescription || "No PR description available."}
                    </div>
                  </div>
                </div>
              )}

              {/* Git Diff Code Viewer */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                  Code Patch Summary / Diff:
                </h3>
                <DiffViewer diff={incident.fix.diff || "// No patch diff recorded"} filename={`${incident.repo}/patch.diff`} />
              </div>
            </div>

            {/* Stack Trace Collapsible Block */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <Terminal className="w-5 h-5" />
                  <h2 className="text-base font-bold text-slate-100">
                    Stack Trace & Error Payload
                  </h2>
                </div>
                <button
                  onClick={() => setIsStackCollapsed(!isStackCollapsed)}
                  className="text-xs text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1"
                >
                  {isStackCollapsed ? "Expand" : "Collapse"}
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isStackCollapsed && "rotate-180"
                    )}
                  />
                </button>
              </div>

              {/* Error Message Header */}
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 font-mono font-semibold">
                {incident.errorMessage}
              </div>

              {/* Scrollable Monospace Code Block */}
              {!isStackCollapsed && (
                <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 overflow-x-auto max-h-72 font-mono text-xs space-y-1">
                  {incident.stackTrace.length > 0 ? (
                    incident.stackTrace.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-3 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 px-2 rounded">
                        <span className="text-slate-600 text-right w-6 select-none shrink-0">
                          {idx + 1}
                        </span>
                        <span className="whitespace-pre-wrap break-all">
                          {line}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No stack frames recorded.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 col): Timeline Side Panel */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-6 shadow-xl sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Incident Timeline
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {incident.timeline.length} Events
                </span>
              </div>

              {/* Timeline List */}
              <Timeline events={incident.timeline} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
