"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does Patchwork identify the root cause commit?",
    answer:
      "Patchwork parses runtime stack frames and maps exception file paths and function symbols against your repository's recent git commit topology. The AI isolation engine evaluates candidate commit diffs to pinpoint the precise commit that introduced the regression.",
  },
  {
    question: "Does Patchwork merge code automatically into production?",
    answer:
      "No. Patchwork operates on a strict PR-only policy. Every generated hotfix is opened as a GitHub Pull Request on a dedicated branch. Your existing CI/CD test suites and developer code reviews remain the mandatory gateway before any code reaches main.",
  },
  {
    question: "What AI model powers automated triage and hotfix diff generation?",
    answer:
      "Patchwork utilizes Google's Gemini models for fast stack trace parsing, commit reasoning, and unified git diff generation. The pipeline operates deterministically with custom prompts tailored specifically for software hotfix generation.",
  },
  {
    question: "Can I connect multiple repositories and error sources?",
    answer:
      "Yes. Patchwork supports multi-repository monitoring within your organization. You can configure GitHub webhooks across multiple repositories and generate scoped API tokens for custom webhook ingestion.",
  },
  {
    question: "What happens if Patchwork cannot confidently identify a fix?",
    answer:
      "If commit confidence falls below required threshold or the error is inconclusive, Patchwork will log the exception payload, tag the incident for human triage, and refrain from drafting invalid pull requests.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 bg-[#08090a] font-mono text-[#c9d1d9] console-scanlines border-b border-zinc-800/80"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            // SYSTEM SPECIFICATIONS & FAQ
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-zinc-100 uppercase tracking-wide">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Patchwork's autonomous triage, root cause isolation, and PR hotfixes.
          </p>
        </div>

        {/* Collapsible Accordion Pairs */}
        <div className="space-y-3 font-mono">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800 bg-[#0d0f12] overflow-hidden console-scanlines transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-mono text-xs sm:text-sm font-bold text-zinc-100 hover:text-emerald-400 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item.question}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180 text-emerald-400"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 font-mono leading-relaxed border-t border-zinc-800/80 bg-[#07080a]">
                    <p className="pl-7">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
