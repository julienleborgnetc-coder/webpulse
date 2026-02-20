"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuditResult } from "@/lib/types";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Link } from "@/i18n/routing";

export default function ReportPage() {
  const t = useTranslations("report");
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const sessionId = searchParams.get("session_id");

  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadReport() {
      if (sessionId) {
        setVerifying(true);
        try {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, auditId: id }),
          });
          if (!verifyRes.ok) {
            const data = await verifyRes.json();
            console.warn("Payment verification:", data.error);
          }
        } catch {
          console.warn("Could not verify payment");
        }
        setVerifying(false);
      }

      try {
        const res = await fetch(`/api/report?id=${id}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || t("unavailable"));
          return;
        }

        const dataRes = await fetch(`/api/report/data?id=${id}`);
        if (dataRes.ok) {
          const auditData = await dataRes.json();
          setResult(auditData);
        } else {
          window.location.href = `/api/report?id=${id}`;
        }
      } catch {
        setError(t("unavailable"));
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, sessionId, t]);

  if (loading || verifying) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-900 border-t-brand-400 rounded-full mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {verifying ? t("verifying") : t("loading")}
          </h1>
          <p className="text-slate-400">{t("preparing")}</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("unavailable")}</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/" className="btn-primary inline-block px-6 py-3">
            {t("backHome")}
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  if (!result) return null;

  const allItems = [
    ...result.performance.items.map((i) => ({ ...i, category: t("performance") })),
    ...result.seo.items.map((i) => ({ ...i, category: t("seo") })),
    ...result.accessibility.items.map((i) => ({ ...i, category: t("accessibility") })),
  ];

  const categories = [
    { key: t("performance"), emoji: "🚀" },
    { key: t("seo"), emoji: "🔍" },
    { key: t("accessibility"), emoji: "♿" },
  ];

  return (
    <main className="min-h-screen">
      <Header />

      {/* Success banner */}
      <div className="border-b border-emerald-500/20 bg-emerald-500/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-300">{t("proUnlocked")}</p>
            <p className="text-emerald-400/70 text-sm">{t("fullReportFor", { url: result.url })}</p>
          </div>
          <a
            href={`/api/report?id=${id}`}
            target="_blank"
            className="ml-auto btn-primary py-2 px-4 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("downloadHtml")}
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Audit info */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">{t("proTitle")}</h1>
          <p className="text-slate-500">
            {result.url} — {new Date(result.timestamp).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScoreGauge score={result.performance.score} label={t("performance")} />
          </div>
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScoreGauge score={result.seo.score} label={t("seo")} />
          </div>
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScoreGauge score={result.accessibility.score} label={t("accessibility")} />
          </div>
        </div>

        {/* Metrics */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">{t("keyMetrics")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label={t("loadTime")} value={`${(result.details.loadTime / 1000).toFixed(2)}s`} />
            <MetricCard label={t("pageSize")} value={formatBytes(result.details.pageSize)} />
            <MetricCard label={t("internalLinks")} value={String(result.details.links.internal)} />
            <MetricCard label={t("externalLinks")} value={String(result.details.links.external)} />
            <MetricCard label={t("images")} value={String(result.details.images.length)} />
            <MetricCard label={t("headingsCount")} value={String(result.details.headings.length)} />
            <MetricCard label={t("mobileFriendly")} value={result.details.mobile.hasViewport ? t("yes") : t("no")} />
            <MetricCard label={t("titleTag")} value={result.details.title ? t("yes") : t("no")} />
          </div>
        </div>

        {/* All issues by category */}
        {categories.map(({ key, emoji }) => {
          const categoryItems = allItems.filter((i) => i.category === key);
          if (categoryItems.length === 0) return null;
          return (
            <div key={key} className="glass-card rounded-2xl p-8 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {emoji} {key}
              </h2>
              <div className="space-y-3">
                {categoryItems.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-4 rounded-xl ${
                      item.status === "pass"
                        ? "bg-emerald-500/5 border border-emerald-500/10"
                        : item.status === "fail"
                        ? "bg-red-500/5 border border-red-500/10"
                        : "bg-yellow-500/5 border border-yellow-500/10"
                    }`}
                  >
                    <span className="mt-0.5 text-lg">
                      {item.status === "pass" ? "✅" : item.status === "fail" ? "❌" : "⚠️"}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-slate-400 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Headings structure */}
        {result.details.headings.length > 0 && (
          <div className="glass-card rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t("headingsStructure")}</h2>
            <div className="space-y-1">
              {result.details.headings.map((h, i) => {
                const indent = (parseInt(h.tag.replace("h", "")) - 1) * 24;
                return (
                  <div
                    key={i}
                    style={{ paddingLeft: `${indent}px` }}
                    className="py-1.5 text-sm flex items-center gap-2"
                  >
                    <span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
                      {h.tag.toUpperCase()}
                    </span>
                    <span className="text-slate-300">{h.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Images without alt */}
        {result.details.images.some((img) => !img.hasAlt) && (
          <div className="glass-card rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t("imagesNoAlt")}</h2>
            <div className="space-y-2">
              {result.details.images
                .filter((img) => !img.hasAlt)
                .map((img, i) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-sm">
                    <code className="text-red-400 break-all">{img.src || t("emptySrc")}</code>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
