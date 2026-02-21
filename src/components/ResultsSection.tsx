"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AuditResult } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";

interface ResultsSectionProps {
  result: AuditResult;
}

export function ResultsSection({ result }: ResultsSectionProps) {
  const t = useTranslations("results");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleBuyReport = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: result.id, url: result.url }),
      });
      const data = await res.json();

      if (data.fallback && data.reportUrl) {
        window.location.href = data.reportUrl;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors du checkout");
      }
    } catch {
      alert("Erreur réseau. Veuillez réessayer.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const allIssues = [
    ...result.performance.items,
    ...result.seo.items,
    ...result.accessibility.items,
    ...(result.security?.items || []),
  ].filter((item) => item.status !== "pass");

  const allPassed = [
    ...result.performance.items,
    ...result.seo.items,
    ...result.accessibility.items,
    ...(result.security?.items || []),
  ].filter((item) => item.status === "pass");

  const hiddenCount = Math.max(0, allIssues.length - 5);

  return (
    <section className="max-w-5xl mx-auto px-4 mb-20 animate-fade-in-up">
      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500 px-8 py-8">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-brand-200 text-sm font-medium mb-1">
                {t("title")}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {result.url}
              </h2>
              <p className="text-brand-200 text-sm">
                {new Date(result.timestamp).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={handleBuyReport}
              disabled={checkoutLoading}
              className="hidden md:flex items-center gap-2 bg-white text-brand-700 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {checkoutLoading ? t("loading") : t("getProReport")}
            </button>
          </div>
        </div>

        {/* Global Score */}
        {result.globalScore !== undefined && (
          <div className="bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center border-b border-white/5">
            <div className="inline-flex flex-col items-center">
              <p className="text-sm text-slate-400 mb-3 font-medium">{t("globalScore")}</p>
              <div className={`text-6xl font-black mb-2 ${
                result.globalScore >= 90 ? "text-emerald-400" :
                result.globalScore >= 70 ? "text-yellow-400" :
                result.globalScore >= 50 ? "text-orange-400" : "text-red-400"
              }`}>
                {result.globalScore}<span className="text-3xl text-slate-500">/100</span>
              </div>
              <p className={`text-sm font-semibold px-4 py-1 rounded-full ${
                result.globalScore >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                result.globalScore >= 70 ? "bg-yellow-500/10 text-yellow-400" :
                result.globalScore >= 50 ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"
              }`}>
                {result.globalScore >= 90 ? t("scoreExcellent") :
                 result.globalScore >= 70 ? t("scoreGood") :
                 result.globalScore >= 50 ? t("scoreAverage") : t("scorePoor")}
              </p>
            </div>
          </div>
        )}

        {/* Scores — 4 categories */}
        <div className={`grid grid-cols-2 ${result.security ? "md:grid-cols-4" : "md:grid-cols-3"} gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5`}>
          <div className="p-8 text-center">
            <ScoreGauge score={result.performance.score} label="Performance" />
          </div>
          <div className="p-8 text-center">
            <ScoreGauge score={result.seo.score} label="SEO" />
          </div>
          <div className="p-8 text-center">
            <ScoreGauge score={result.accessibility.score} label={t("accessibility")} />
          </div>
          {result.security && (
            <div className="p-8 text-center">
              <ScoreGauge score={result.security.score} label={t("security")} />
            </div>
          )}
        </div>

        {/* Quick Summary */}
        <div className="border-t border-white/5 p-8 bg-white/[0.02]">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span>
            {t("quickSummary")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SummaryCard icon="✅" value={String(allPassed.length)} label={t("testsPassed")} color="text-emerald-400" />
            <SummaryCard icon="⚠️" value={String(allIssues.filter(i => i.status === "warning").length)} label={t("warnings")} color="text-yellow-400" />
            <SummaryCard icon="❌" value={String(allIssues.filter(i => i.status === "fail").length)} label={t("errors")} color="text-red-400" />
          </div>
        </div>

        {/* Free Metrics — More details */}
        <div className="border-t border-white/5 p-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t("metrics")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label={t("loadTime")} value={`${(result.details.loadTime / 1000).toFixed(1)}s`} good={result.details.loadTime < 3000} icon="⚡" />
            <MetricCard label={t("pageSize")} value={formatBytes(result.details.pageSize)} good={result.details.pageSize < 3000000} icon="📦" />
            <MetricCard label={t("titleTag")} value={result.details.title ? t("present") : t("missing")} good={!!result.details.title} icon="🏷️" />
            <MetricCard label={t("metaDesc")} value={result.details.metaDescription ? t("present") : t("missing")} good={!!result.details.metaDescription} icon="📝" />
            <MetricCard label={t("imagesCount")} value={String(result.details.images.length)} good={true} icon="🖼️" />
            <MetricCard label={t("linksCount")} value={`${result.details.links.internal} int. / ${result.details.links.external} ext.`} good={result.details.links.internal >= 3} icon="🔗" />
            <MetricCard label={t("httpsLabel")} value={result.details.httpsRedirect ? "✓ HTTPS" : "✗ HTTP"} good={result.details.httpsRedirect} icon="🔒" />
            <MetricCard label={t("mobileLabel")} value={result.details.mobile.hasViewport ? t("present") : t("missing")} good={result.details.mobile.hasViewport} icon="📱" />
          </div>
        </div>

        {/* Technologies detected */}
        {result.details.technologies && result.details.technologies.length > 0 && (
          <div className="border-t border-white/5 p-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              {t("techDetected")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.details.technologies.map((tech, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1.5 bg-brand-500/10 text-brand-300 rounded-full text-sm font-medium border border-brand-500/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Free issues (5 shown) */}
        <div className="border-t border-white/5 p-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t("issues")}
            <span className="text-sm font-normal text-slate-500">
              ({t("issuesFound", { count: allIssues.length })})
            </span>
          </h3>
          <div className="space-y-2">
            {allIssues.slice(0, 5).map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                item.status === "fail" ? "bg-red-500/5 border border-red-500/10" : "bg-yellow-500/5 border border-yellow-500/10"
              }`}>
                <span className="mt-0.5 text-lg">{item.status === "fail" ? "🔴" : "🟡"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white text-sm">{item.title}</p>
                    {item.impact && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.impact === "high" ? "bg-red-500/15 text-red-400" :
                        item.impact === "medium" ? "bg-yellow-500/15 text-yellow-400" :
                        "bg-slate-500/15 text-slate-400"
                      }`}>
                        {item.impact === "high" ? t("impactHigh") : item.impact === "medium" ? t("impactMedium") : t("impactLow")}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teaser: Top 3 priorities (blurred recommendations) */}
        {result.priorities && result.priorities.length > 0 && (
          <div className="border-t border-white/5 p-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              {t("topPriorities")}
            </h3>
            <div className="space-y-3">
              {result.priorities.slice(0, 3).map((prio, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? "bg-red-500/20 text-red-400" : i === 1 ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    #{prio.priority}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{prio.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{prio.category}</p>
                    <div className="mt-2 filter blur-[4px] select-none pointer-events-none">
                      <p className="text-slate-400 text-xs">{prio.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-4">🔒 {t("unlockPriorities")}</p>
          </div>
        )}

        {/* BLURRED / LOCKED Pro content */}
        <div className="relative border-t border-white/5">
          <div className="p-8 select-none" aria-hidden="true">
            <div className="filter blur-[6px] pointer-events-none">
              <h3 className="text-lg font-bold text-white mb-4">{t("detailedAnalysis")}</h3>
              <div className="space-y-2">
                {allIssues.slice(5, 10).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                    <span className="mt-0.5 text-lg">⬤</span>
                    <div>
                      <p className="font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="mt-0.5 text-lg">🎯</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{t("actionPlan")}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{t("actionPlanDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0f0b21] via-[#0f0b21]/80 to-transparent">
              <div className="glass-card rounded-2xl p-8 max-w-md text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {hiddenCount > 0 ? t("problemsToDiscover", { count: hiddenCount }) : t("fullReport")} {t("toDiscover")}
                </h3>
                <ul className="text-left text-slate-400 text-sm mb-6 space-y-2">
                  <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> {t("proFeature1")}</li>
                  <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> {t("proFeature2")}</li>
                  <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> {t("proFeature3")}</li>
                  <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> {t("proFeature4")}</li>
                </ul>
                <button onClick={handleBuyReport} disabled={checkoutLoading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50">
                  {checkoutLoading ? (
                    <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t("loading")}</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>{t("getProReport")}</>
                  )}
                </button>
                <p className="text-slate-500 text-xs mt-3 flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  {t("securePayment")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden border-t border-white/5 p-6">
          <button onClick={handleBuyReport} disabled={checkoutLoading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {checkoutLoading ? t("loading") : t("proReport")}
          </button>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="glass-card-hover rounded-xl p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function MetricCard({ label, value, good, icon }: { label: string; value: string; good: boolean; icon: string }) {
  return (
    <div className="glass-card-hover rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className={`text-lg font-bold ${good ? "text-emerald-400" : "text-red-400"}`}>{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
