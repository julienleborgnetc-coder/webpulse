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
    ...(result.security?.items || []).map((i) => ({ ...i, category: t("security") })),
  ];

  const categories = [
    { key: t("performance"), emoji: "🚀" },
    { key: t("seo"), emoji: "🔍" },
    { key: t("accessibility"), emoji: "♿" },
    ...(result.security ? [{ key: t("security"), emoji: "🔒" }] : []),
  ];

  const getImpactColor = (impact?: string) => {
    if (impact === "high") return "bg-red-500/15 text-red-400";
    if (impact === "medium") return "bg-yellow-500/15 text-yellow-400";
    return "bg-slate-500/15 text-slate-400";
  };

  const getImpactLabel = (impact?: string) => {
    if (impact === "high") return t("impactHigh");
    if (impact === "medium") return t("impactMedium");
    return t("impactLow");
  };

  const getEffortLabel = (effort: string) => {
    if (effort === "easy") return t("effortEasy");
    if (effort === "medium") return t("effortMedium");
    return t("effortHard");
  };

  const getEffortColor = (effort: string) => {
    if (effort === "easy") return "bg-emerald-500/15 text-emerald-400";
    if (effort === "medium") return "bg-yellow-500/15 text-yellow-400";
    return "bg-red-500/15 text-red-400";
  };

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

        {/* Global Score */}
        {result.globalScore !== undefined && (
          <div className="glass-card rounded-2xl p-8 mb-8 text-center">
            <p className="text-sm text-slate-400 mb-3 font-medium">{t("globalScore")}</p>
            <div className={`text-7xl font-black mb-2 ${
              result.globalScore >= 90 ? "text-emerald-400" :
              result.globalScore >= 70 ? "text-yellow-400" :
              result.globalScore >= 50 ? "text-orange-400" : "text-red-400"
            }`}>
              {result.globalScore}<span className="text-4xl text-slate-500">/100</span>
            </div>
            <p className={`inline-block text-sm font-semibold px-4 py-1 rounded-full ${
              result.globalScore >= 90 ? "bg-emerald-500/10 text-emerald-400" :
              result.globalScore >= 70 ? "bg-yellow-500/10 text-yellow-400" :
              result.globalScore >= 50 ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"
            }`}>
              {result.globalScore >= 90 ? t("scoreExcellent") :
               result.globalScore >= 70 ? t("scoreGood") :
               result.globalScore >= 50 ? t("scoreAverage") : t("scorePoor")}
            </p>
          </div>
        )}

        {/* Scores — 4 categories */}
        <div className={`grid grid-cols-2 ${result.security ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 mb-10`}>
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScoreGauge score={result.performance.score} label={t("performance")} />
          </div>
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScoreGauge score={result.seo.score} label={t("seo")} />
          </div>
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScoreGauge score={result.accessibility.score} label={t("accessibility")} />
          </div>
          {result.security && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <ScoreGauge score={result.security.score} label={t("security")} />
            </div>
          )}
        </div>

        {/* Key Metrics — Extended */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">{t("keyMetrics")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label={t("loadTime")} value={`${(result.details.loadTime / 1000).toFixed(2)}s`} good={result.details.loadTime < 3000} />
            <MetricCard label={t("pageSize")} value={formatBytes(result.details.pageSize)} good={result.details.pageSize < 3000000} />
            <MetricCard label={t("internalLinks")} value={String(result.details.links.internal)} />
            <MetricCard label={t("externalLinks")} value={String(result.details.links.external)} />
            <MetricCard label={t("images")} value={String(result.details.images.length)} />
            <MetricCard label={t("headingsCount")} value={String(result.details.headings.length)} />
            <MetricCard label={t("mobileFriendly")} value={result.details.mobile.hasViewport ? t("yes") : t("no")} good={result.details.mobile.hasViewport} />
            <MetricCard label={t("titleTag")} value={result.details.title ? t("yes") : t("no")} good={!!result.details.title} />
            <MetricCard label={t("domElements")} value={String(result.details.domElements || "—")} good={(result.details.domElements || 0) < 1500} />
            <MetricCard label={t("wordCount")} value={String(result.details.wordCount || "—")} good={(result.details.wordCount || 0) >= 300} />
            <MetricCard label={t("robotsTxt")} value={result.details.hasRobotsTxt ? t("yes") : t("no")} good={result.details.hasRobotsTxt} />
            <MetricCard label={t("sitemapXml")} value={result.details.hasSitemap ? t("yes") : t("no")} good={result.details.hasSitemap} />
            <MetricCard label={t("structuredData")} value={result.details.hasStructuredData ? t("yes") : t("no")} good={result.details.hasStructuredData} />
            <MetricCard label={t("httpsRedirect")} value={result.details.httpsRedirect ? t("yes") : t("no")} good={result.details.httpsRedirect} />
            <MetricCard label={t("favicon")} value={result.details.hasFavicon ? t("yes") : t("no")} good={result.details.hasFavicon} />
            <MetricCard label="Iframes" value={String(result.details.iframeCount || 0)} good={(result.details.iframeCount || 0) === 0} />
          </div>
        </div>

        {/* Technologies detected */}
        {result.details.technologies && result.details.technologies.length > 0 && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">{t("techDetected")}</h2>
            <div className="flex flex-wrap gap-2">
              {result.details.technologies.map((tech, i) => (
                <span key={i} className="inline-flex items-center px-4 py-2 bg-brand-500/10 text-brand-300 rounded-full text-sm font-medium border border-brand-500/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Priority Action Plan */}
        {result.priorities && result.priorities.length > 0 && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold text-white mb-2">{t("actionPlan")}</h2>
            <p className="text-slate-400 text-sm mb-6">{t("actionPlanDesc")}</p>
            <div className="space-y-4">
              {result.priorities.map((prio, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? "bg-red-500/20 text-red-400" :
                    i === 1 ? "bg-orange-500/20 text-orange-400" :
                    i === 2 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>
                    #{prio.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-white">{prio.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getImpactColor(prio.impact)}`}>
                        {t("impact")}: {getImpactLabel(prio.impact)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getEffortColor(prio.effort)}`}>
                        {t("effort")}: {getEffortLabel(prio.effort)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mb-2">{t("category")}: {prio.category}</p>
                    <p className="text-slate-300 text-sm">{prio.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All issues by category with recommendations */}
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
                    className={`p-4 rounded-xl ${
                      item.status === "pass"
                        ? "bg-emerald-500/5 border border-emerald-500/10"
                        : item.status === "fail"
                        ? "bg-red-500/5 border border-red-500/10"
                        : "bg-yellow-500/5 border border-yellow-500/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-lg">
                        {item.status === "pass" ? "✅" : item.status === "fail" ? "❌" : "⚠️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-semibold text-white">{item.title}</p>
                          {item.impact && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getImpactColor(item.impact)}`}>
                              {getImpactLabel(item.impact)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{item.description}</p>
                        {item.recommendation && item.status !== "pass" && (
                          <div className="mt-3 p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg">
                            <p className="text-xs font-semibold text-brand-300 mb-1">💡 {t("recommendation")}</p>
                            <p className="text-slate-300 text-sm">{item.recommendation}</p>
                          </div>
                        )}
                      </div>
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

function MetricCard({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${good === undefined ? "text-white" : good ? "text-emerald-400" : "text-red-400"}`}>{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
