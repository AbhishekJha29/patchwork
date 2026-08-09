"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffViewer } from "@/components/DiffViewer";
import { Timeline } from "@/components/Timeline";
import { PipelineStepper } from "@/components/PipelineStepper";
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
  UserCheck,
  Loader2,
  GitMerge,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgMemberOption {
  id: string;
  name: string;
  email: string;
}

interface IncidentDetailClientProps {
  initialIncident: Incident | null;
  initialOrgMembers?: OrgMemberOption[];
  deploymentTrackingEnabled?: boolean;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  detected: ["triaged"],
  triaged: ["analyzing", "detected"],
  analyzing: ["fix_generated", "in_review", "triaged"],
  fix_generated: ["in_review"],
  in_review: ["deployed", "resolved"],
  deployed: ["resolved"],
  resolved: [],
};

const ALL_STATUSES: { value: Status; label: string }[] = [
  { value: "detected", label: "MONITORED" },
  { value: "triaged", label: "TRIAGED" },
  { value: "analyzing", label: "ANALYZING" },
  { value: "fix_generated", label: "FIX_READY" },
  { value: "in_review", label: "IN_REVIEW" },
  { value: "deployed", label: "DEPLOYED" },
  { value: "resolved", label: "RESOLVED" },
];

export function IncidentDetailClient({
  initialIncident,
  initialOrgMembers = [],
  deploymentTrackingEnabled = false,
}: IncidentDetailClientProps) {
  if (!initialIncident) {
    return (
      <div className="min-h-screen bg-[#08090a] flex flex-col font-mono text-[#c9d1d9]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-400">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="space-y-2 font-mono">
            <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide">
              sys_err: incident not found
            </h1>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Requested target record does not exist in backend database or was purged.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN_TO_COMMAND_CENTER</span>
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const [assignee, setAssignee] = useState(initialIncident.assignee);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  const handleMarkResolved = async () => {
    setIsUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          reason: "Resolved: manually confirmed by user",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to mark incident resolved");
      }

      setCurrentStatus("resolved");
      setIncident((prev) => ({
        ...prev,
        status: "resolved",
        timeline: [
          {
            id: `log_${Date.now()}`,
            incidentId: prev.id,
            type: "STATUS_CHANGE",
            message: `sys_log: Incident manually marked RESOLVED`,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.timeline,
        ],
      }));
      setStatusFeedback("sys_status: marked RESOLVED");
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      setStatusFeedback(`sys_err: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const [isStackCollapsed, setIsStackCollapsed] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);

  // Filter allowed options for status dropdown
  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus.toLowerCase()] || [];
  const selectableStatuses = ALL_STATUSES.filter(
    (s) => s.value.toLowerCase() === currentStatus.toLowerCase() || allowedNextStatuses.includes(s.value.toLowerCase())
  );

  const handleStatusChange = async (newStatus: Status) => {
    if (newStatus === currentStatus) return;
    setIsUpdatingStatus(true);
    setStatusFeedback(null);

    try {
      const res = await fetch(`/api/incidents/${incident.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update status");
      }

      setCurrentStatus(newStatus);
      setIncident((prev) => ({
        ...prev,
        status: newStatus,
        timeline: [
          {
            id: `log_${Date.now()}`,
            incidentId: prev.id,
            type: "STATUS_CHANGE",
            message: `sys_log: Status updated ${prev.status} -> ${newStatus}`,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.timeline,
        ],
      }));
      setStatusFeedback(`sys_status: updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      setStatusFeedback(`sys_err: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    setIsUpdatingAssignee(true);
    setAssignFeedback(null);

    try {
      const targetId = newAssigneeId === "unassigned" ? null : newAssigneeId;
      const res = await fetch(`/api/incidents/${incident.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: targetId }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update assignee");
      }

      const assignedUser = initialOrgMembers.find((m) => m.id === targetId);
      const newAssigneeObj = targetId && assignedUser
        ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email, avatar: "" }
        : { id: "unassigned", name: "Unassigned", email: "", avatar: "" };

      setAssignee(newAssigneeObj);
      setIncident((prev) => ({
        ...prev,
        assignee: newAssigneeObj,
        timeline: [
          {
            id: `log_${Date.now()}`,
            incidentId: prev.id,
            type: "ASSIGNMENT",
            message: targetId ? `sys_assignee: assigned to ${newAssigneeObj.name}` : `sys_assignee: set to standby`,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.timeline,
        ],
      }));

      setAssignFeedback(targetId ? `assigned: ${newAssigneeObj.name}` : "status: unassigned");
      setTimeout(() => setAssignFeedback(null), 3000);
    } catch (err: any) {
      setAssignFeedback(`sys_err: ${err.message}`);
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  const handleCopyPrUrl = () => {
    if (incident.fix.prUrl) {
      navigator.clipboard.writeText(incident.fix.prUrl);
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex flex-col font-mono text-[#c9d1d9]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Back Navigation Bar & Status Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>sys_nav: back_to_dashboard</span>
          </Link>

          {/* Status Change Interactive Dropdown & Mark Resolved Button */}
          <div className="flex flex-wrap items-center gap-3 font-mono">
            {deploymentTrackingEnabled && currentStatus.toLowerCase() === "deployed" && (
              <button
                onClick={handleMarkResolved}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>EXECUTE_MARK_RESOLVED</span>
              </button>
            )}

            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
              sys_state_override:
            </span>
            <div className="relative flex items-center gap-2">
              <select
                value={currentStatus.toLowerCase()}
                disabled={isUpdatingStatus || currentStatus.toLowerCase() === "resolved"}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                className="bg-[#0d0f12] border border-zinc-800 text-emerald-400 font-mono text-xs rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-60"
              >
                {selectableStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
            </div>
            {statusFeedback && (
              <span className="text-[11px] font-mono text-emerald-400 animate-pulse">
                {statusFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Incident Detail Header Banner */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines">
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={currentStatus} />
            {incident.triagedAt === null && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/40 border border-amber-800/60 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                triage_engine: evaluating...
              </span>
            )}
            {incident.aiTags && incident.aiTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 ml-1">
                {incident.aiTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 ml-auto">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              t_stamp: {formatTimeAgo(incident.createdAt)}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 leading-snug font-mono">
            {incident.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400 pt-2.5 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">repo_target:</span>
              <span className="text-zinc-200 font-semibold">{incident.repo}</span>
            </div>

            {/* Incident Assignment Picker UI */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> sys_assigned:
              </span>
              <select
                value={assignee.id}
                disabled={isUpdatingAssignee}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
              >
                <option value="unassigned">standby (unassigned)</option>
                {initialOrgMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              {isUpdatingAssignee && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
              {assignFeedback && (
                <span className="text-[11px] font-mono text-emerald-400 animate-pulse">{assignFeedback}</span>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline visualization stepper */}
        <PipelineStepper incident={incident} />

        {/* Grid Layout: Main Analysis (2 Cols) + Vertical Timeline (1 Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Root Cause Analysis Card */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-4 shadow-xl relative overflow-hidden console-scanlines">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                      AI Root Cause Isolation
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Isolated via commit trace topology & AI engine
                    </p>
                  </div>
                </div>

                {/* Confidence Score Badge & Progress */}
                <div className="text-right space-y-1 font-mono">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border",
                      incident.rootCause.confidenceScore > 0
                        ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    )}
                  >
                    <span>Confidence: {incident.rootCause.confidenceScore}%</span>
                  </div>
                  <div className="w-28 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${incident.rootCause.confidenceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Culprit Commit Details or Empty/Skipped State */}
              {incident.rootCause.culpritCommit ? (
                <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#07080a] space-y-2.5 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-400">
                    <span className="flex items-center gap-1.5 font-semibold text-rose-400">
                      <GitCommit className="w-3.5 h-3.5" /> Culprit Commit: {incident.rootCause.commitHash.slice(0, 7)}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-zinc-500">
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
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          <span>view_on_github</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-200 font-mono font-medium text-xs">
                    "{incident.rootCause.culpritCommit.message}"
                  </p>
                  <div className="flex items-center gap-2 text-zinc-500 pt-0.5 text-[11px]">
                    <User className="w-3 h-3" />
                    <span>Author: {incident.rootCause.culpritCommit.author}</span>
                  </div>
                </div>
              ) : incident.rootCause.reasoning?.toLowerCase().includes("skipped") ? (
                <div className="p-3.5 rounded-lg border border-amber-900/40 bg-amber-950/20 text-xs font-mono text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                    <AlertOctagon className="w-3.5 h-3.5" /> sys_warn: root cause analysis skipped
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Repository not connected or GITHUB_TOKEN environment variable missing.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#07080a] text-xs font-mono text-zinc-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-zinc-400">
                    <GitCommit className="w-3.5 h-3.5" /> sys_info: no clear root cause identified
                  </div>
                  <p className="text-zinc-500 text-[11px]">
                    Evaluated candidate commits but found no high-confidence culprit matching the stack trace.
                  </p>
                </div>
              )}

              {/* Reasoning Description */}
              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="font-semibold uppercase tracking-wider text-zinc-400">
                    Reasoning & Diagnosis
                  </span>
                  <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                    Output Stream: Root Cause Reasoning — readonly
                  </span>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed font-mono bg-[#07080a] p-3.5 rounded-lg border border-zinc-800">
                  {incident.rootCause.reasoning || "listening for webhook triggers... root cause analysis standby"}
                </div>
              </div>

              {/* AI Summary Quote Box */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed space-y-1 font-mono">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-emerald-400 uppercase tracking-wide">
                    Executive Summary
                  </span>
                  {incident.triagedAt === null && (
                    <span className="font-mono text-amber-400 italic animate-pulse">
                      sys_triage: processing...
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  {incident.aiSummary
                    ? incident.aiSummary
                    : "listening for webhook triggers... AI triage summary will render upon ingestion."}
                </p>
              </div>
            </div>

            {/* Suggested Fix & Patch Card */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-4 shadow-xl console-scanlines">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                      <span>Suggested Hotfix & PR</span>
                      {incident.fix.branchName && (
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-normal flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {incident.fix.branchName}
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Automated patch proposal generated via AI Engine & GitHub API
                    </p>
                  </div>
                </div>

                {/* View PR Button, Copy Link, or Status */}
                <div className="flex items-center gap-2">
                  {incident.fix.prUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={incident.fix.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded hover:bg-emerald-900/60 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>VIEW PR ON GITHUB</span>
                      </a>
                      <button
                        onClick={handleCopyPrUrl}
                        className="p-1 text-zinc-400 hover:text-zinc-200 bg-zinc-900 rounded border border-zinc-800"
                        title="Copy PR Link"
                      >
                        {copiedPr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : incident.fix.status === "failed" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-800 rounded">
                      <AlertOctagon className="w-3 h-3" />
                      sys_err: fix generation failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      sys_status: auto PR pending
                    </span>
                  )}
                </div>
              </div>

              {/* PR Merge & Deployment Status Badges */}
              {incident.fix.mergedAt && (
                <div className="p-3 rounded-lg border border-purple-800/60 bg-purple-950/20 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-purple-400" /> PR Merged into Main Branch
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(incident.fix.mergedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-900/40 text-[11px] text-zinc-400">
                    <span>Deployment Confirmation:</span>
                    <span className="text-zinc-300 font-semibold">
                      {incident.fix.deployedAt
                        ? `Deployed at ${new Date(incident.fix.deployedAt).toLocaleString()}`
                        : "Merge confirmed — pending deployment"}
                    </span>
                  </div>
                </div>
              )}

              {/* Git Diff Code Viewer */}
              <div className="space-y-1.5 font-mono">
                <DiffViewer diff={incident.fix.diff || "// No patch diff recorded"} filename={`${incident.repo}/patch.diff`} />
              </div>
            </div>

            {/* Stack Trace Collapsible Block */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 font-mono">
                <div className="flex items-center gap-2 text-rose-400">
                  <Terminal className="w-4 h-4" />
                  <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                    Stack Trace & Exception Payload
                  </h2>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded hidden sm:inline">
                    Diagnostic Trace: Stack Frames — readonly
                  </span>
                </div>
                <button
                  onClick={() => setIsStackCollapsed(!isStackCollapsed)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 font-mono flex items-center gap-1"
                >
                  {isStackCollapsed ? "[EXPAND]" : "[COLLAPSE]"}
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform",
                      isStackCollapsed && "rotate-180"
                    )}
                  />
                </button>
              </div>

              <div className="p-3 rounded bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 font-mono font-semibold">
                {incident.errorMessage}
              </div>

              {!isStackCollapsed && (
                <div className="bg-[#07080a] border border-zinc-800/80 rounded-lg p-3 overflow-x-auto max-h-72 font-mono text-xs space-y-1">
                  {incident.stackTrace.length > 0 ? (
                    incident.stackTrace.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-3 py-0.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 px-1.5 rounded">
                        <span className="text-zinc-600 text-right w-6 select-none shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                          {line}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-600 text-[11px] italic font-mono">sys_info: no stack frames recorded.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 col): Timeline Side Panel */}
          <div className="space-y-6 font-mono">
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-4 shadow-xl sticky top-24 console-scanlines">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 font-mono">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Incident Timeline
                </h2>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {incident.timeline.length} Events
                </span>
              </div>

              <Timeline events={incident.timeline} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

