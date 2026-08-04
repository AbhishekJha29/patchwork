"use client";

import React, { useState } from "react";
import { Check, Copy, Code2 } from "lucide-react";
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
        "rounded-lg border border-slate-800 bg-[#0b0f19] overflow-hidden shadow-2xl font-mono text-xs",
        className
      )}
    >
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-400">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">
            {filename || "Patch Diff Preview"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 rounded transition-colors border border-slate-700"
          title="Copy diff to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      {/* Code diff lines */}
      <div className="overflow-x-auto p-2 leading-relaxed">
        {lines.map((line, idx) => {
          let lineStyle = "text-slate-400 hover:bg-slate-900/50";
          let symbol = " ";

          if (line.startsWith("+")) {
            lineStyle = "diff-add";
            symbol = "+";
          } else if (line.startsWith("-")) {
            lineStyle = "diff-remove";
            symbol = "-";
          } else if (line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++")) {
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
              <span className="w-8 text-slate-600 select-none text-right pr-3 shrink-0 font-mono">
                {idx + 1}
              </span>
              <pre className="whitespace-pre-wrap break-all font-mono">
                {line}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
