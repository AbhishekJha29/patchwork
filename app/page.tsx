import React from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { SafetySection } from "@/components/landing/SafetySection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Patchwork | Autonomous AI Incident Response Platform",
  description:
    "Detects production errors, isolates culprit git commits, and generates verified hotfix PRs automatically.",
};

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#08090a] font-mono text-[#c9d1d9] selection:bg-[#10b981]/30 selection:text-[#34d399] overflow-x-hidden">
      <LandingNav />
      <main>
        <Hero />
        <WorkflowSection />
        <SafetySection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
