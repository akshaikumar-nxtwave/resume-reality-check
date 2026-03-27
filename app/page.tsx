"use client";

import ResumeToggle from "@/components/ResumeToggle";
import GuidanceSection from "@/components/GuidanceSection";
import { FileText, BookOpen } from "lucide-react";
import Image from "next/image";

const Index = () => {
  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl h-30 mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Resume Reality Check
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Bridge the gap between your current resume and what companies
              actually expect, and land your first job.
            </p>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            Powered by
            <Image
              src="/nxtwave.png"
              alt="NxtWave Logo"
              width={0}
              height={0}
              sizes="80px"
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      <main className="">
        {/* Guidance */}
        <section className="max-w-7xl mx-auto px-4 py-8 space-y-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              How to Build Your Resume
            </h2>
          </div>
          <GuidanceSection />
        </section>

        {/* Resume Comparison */}
        <section className="max-w-4xl mx-auto px-4 py-8 space-y-12">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Compare Resumes
            </h2>
          </div>
          <ResumeToggle />
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built to help students land their first job.
      </footer>
    </div>
  );
};

export default Index;
