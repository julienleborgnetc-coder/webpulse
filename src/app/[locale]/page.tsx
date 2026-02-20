"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { AuditForm } from "@/components/AuditForm";
import { ResultsSection } from "@/components/ResultsSection";
import { PricingSection } from "@/components/PricingSection";
import { SocialProof } from "@/components/SocialProof";
import { Footer } from "@/components/Footer";
import { AuditResult } from "@/lib/types";

export default function Home() {
  const t = useTranslations("auditForm");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setAuditResult(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("error"));
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t("error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <AuditForm onSubmit={handleAudit} isLoading={isLoading} />
      {error && (
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        </div>
      )}
      {auditResult && <ResultsSection result={auditResult} />}
      <PricingSection />
      <SocialProof />
      <Footer />
    </main>
  );
}
