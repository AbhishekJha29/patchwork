"use client";

import React, { useState } from "react";
import { Check, Copy, Code2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiffViewerProps {
  diff: string;
  className?: string;
  filename?: string;
}

export function DiffViewer({ diff, className, filename }: DiffViewerProps) {
  const [copied, setCopied] = useState(false);

  const lines = diff.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-[#07080a] overflow-hidden shadow-2xl font-mono text-xs console-scanlines",
        className
      )}
    >
      {/* Header toolbar with system metric label */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0d0f12] border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px] font-semibold text-zinc-300">
            {filename || "patch.diff"}
          </span>
          <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
            Output Stream: Git Diff Proposal — readonly
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded transition-colors border border-zinc-700"
          title="Copy diff to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>COPY DIFF</span>
            </>
          )}
        </button>
      </div>

      {/* Code diff lines */}
      <div className="overflow-x-auto p-2 leading-relaxed font-mono">
        {lines.map((line, idx) => {
          let lineStyle = "text-zinc-400 hover:bg-zinc-900/60";

          if (line.startsWith("+")) {
            lineStyle = "diff-add";
          } else if (line.startsWith("-")) {
            lineStyle = "diff-remove";
          } else if (
            line.startsWith("@@") ||
            line.startsWith("---") ||
            line.startsWith("+++")
          ) {
            lineStyle = "diff-header italic font-semibold";
          }

          return (
            <div
              key={idx}
              className={cn(
                "flex items-start px-2 py-0.5 rounded font-mono text-xs transition-colors",
                lineStyle
              )}
            >
              <span className="w-8 text-zinc-600 select-none text-right pr-3 shrink-0 font-mono text-[11px]">
                {idx + 1}
              </span>
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-snug">
                {line}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}

