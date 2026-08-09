"use client";

import React from "react";
import { Incident } from "@/lib/types";
import { GitPullRequest, ExternalLink, GitMerge, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullRequestsViewProps {
  incidents: Incident[];
  className?: string;
}

export function PullRequestsView({ incidents, className }: PullRequestsViewProps) {
  // Extract all fixes/incidents that have diff or PR
  const pullRequestsList = incidents.filter((i) => i.fix?.diff || i.fix?.prUrl);

  return (
    <div className={cn("flex-1 bg-[#08090a] p-6 space-y-6 font-mono text-[#c9d1d9] overflow-y-auto h-screen console-scanlines", className)}>
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-emerald-400" />
          Automated Pull Requests & Fix Proposals
        </h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          Monitor AI-generated hotfix pull requests across connected repositories.
        </p>
      </div>

      {pullRequestsList.length > 0 ? (
        <div className="space-y-3 font-mono">
          {pullRequestsList.map((inc) => {
            const hasPrUrl = Boolean(inc.fix.prUrl);
            const isMerged = Boolean(inc.fix.mergedAt || inc.status === "deployed" || inc.status === "resolved");

            return (
              <div
                key={inc.id}
                className="p-4 rounded-lg border border-zinc-800 bg-[#0d0f12] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg console-scanlines"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                      #{inc.id}
                    </span>
                    <span className="text-zinc-400 font-bold">{inc.repo}</span>
                    {inc.fix.branchName && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                        branch: {inc.fix.branchName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-zinc-100 truncate">
                    {inc.fix.prTitle || inc.title}
                  </h3>

                  <p className="text-[11px] text-zinc-500 line-clamp-1 font-mono">
                    {inc.fix.prDescription || inc.errorMessage}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800 font-mono">
                  {isMerged ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-purple-300 bg-purple-950/40 border border-purple-800/60 rounded">
                      <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                      MERGED MAIN
                    </span>
                  ) : hasPrUrl ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      OPEN PR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      PATCH DRAFTED
                    </span>
                  )}

                  {hasPrUrl && (
                    <a
                      href={inc.fix.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-md shadow-emerald-950/40"
                    >
                      <span>VIEW ON GITHUB</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-xl border border-zinc-800 bg-[#0d0f12] text-center space-y-2 font-mono console-scanlines">
          <GitPullRequest className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300 uppercase">NO PULL REQUESTS OPENED</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            When Gemini AI isolates a root cause and drafts a hotfix PR, records will populate here.
          </p>
        </div>
      )}
    </div>
  );
}
