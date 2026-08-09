"use client";

import React from "react";
import {
  Radio,
  Sparkles,
  Search,
  Wrench,
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      num: "01",
      title: "Error Ingested",
      desc: "Webhook or API key ingests stack trace payload & exception context.",
      icon: Radio,
      color: "text-amber-400 border-amber-800/60 bg-amber-950/40",
    },
    {
      num: "02",
      title: "AI Triage",
      desc: "Gemini AI categorizes severity, tags exception, and ranks priority.",
      icon: Sparkles,
      color: "text-purple-400 border-purple-800/60 bg-purple-950/40",
    },
    {
      num: "03",
      title: "Root Cause Analysis",
      desc: "Traverses repo commit topology to isolate the exact breaking commit.",
      icon: Search,
      color: "text-cyan-400 border-cyan-800/60 bg-cyan-950/40",
    },
    {
      num: "04",
      title: "Hotfix Generated",
      desc: "Generates precise unified git diff patch addressing the isolated flaw.",
      icon: Wrench,
      color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40",
    },
    {
      num: "05",
      title: "Pull Request Opened",
      desc: "Creates dedicated hotfix branch & opens GitHub PR for human review.",
      icon: GitPullRequest,
      color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40",
    },
    {
      num: "06",
      title: "Merged into Main",
      desc: "GitHub webhook receives merge event & verifies deployment status.",
      icon: GitMerge,
      color: "text-indigo-400 border-indigo-800/60 bg-indigo-950/40",
    },
    {
      num: "07",
      title: "Incident Resolved",
      desc: "Incident transitions to RESOLVED with complete audit trail saved.",
      icon: CheckCircle2,
      color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40",
    },
  ];

  return (
    <section
      id="workflow"
      className="py-20 bg-[#08090a] font-mono text-[#c9d1d9] console-scanlines border-b border-zinc-800/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            // AUTOMATED PIPELINE TOPOLOGY
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-zinc-100 uppercase tracking-wide">
            7-Stage Autonomous Remediation Workflow
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            From initial error webhook ingestion to GitHub PR merge verification — fully deterministic and audited.
          </p>
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="p-5 rounded-xl border border-zinc-800 bg-[#0d0f12] space-y-3 shadow-xl console-scanlines hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-zinc-500">
                      STEP {s.num}
                    </span>
                    <div className={`p-1.5 rounded border ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                    {s.title}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-2 text-[10px] text-zinc-600 uppercase font-mono flex items-center gap-1">
                  <span>stage_status: automated</span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-zinc-700 ml-auto hidden lg:block" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
