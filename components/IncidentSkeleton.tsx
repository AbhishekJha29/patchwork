"use client";

import React from "react";

export function IncidentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 gap-4"
        >
          <div className="flex items-start gap-4 flex-1 w-full">
            <div className="w-20 h-6 bg-slate-800/80 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-1/3 h-4 bg-slate-800/80 rounded" />
              <div className="w-2/3 h-5 bg-slate-800 rounded" />
              <div className="w-1/2 h-3 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-6 bg-slate-800/80 rounded-md" />
            <div className="w-6 h-6 rounded-full bg-slate-800/80" />
            <div className="w-16 h-4 bg-slate-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
