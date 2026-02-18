"use client";

import { useState } from "react";
import { AuditResult } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";

interface ResultsSectionProps {
  result: AuditResult;
}

export function ResultsSection({ result }: ResultsSectionProps) {
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
  ].filter((item) => item.status !== "pass");

  const hiddenCount = Math.max(0, allIssues.length - 3);

  return (
    <section className="max-w-5xl mx-auto px-4 mb-20 animate-fade-in-up">
      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500 px-8 py-8">
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-brand-200 text-sm font-medium mb-1">
                Résultats de l&apos;audit
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
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              {checkoutLoading
                ? "Chargement..."
                : "Obtenir le rapport Pro — 9€"}
            </button>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-8 text-center">
            <ScoreGauge score={result.performance.score} label="Performance" />
          </div>
          <div className="p-8 text-center">
            <ScoreGauge score={result.seo.score} label="SEO" />
          </div>
          <div className="p-8 text-center">
            <ScoreGauge
              score={result.accessibility.score}
              label="Accessibilité"
            />
          </div>
        </div>

        {/* Free Metrics */}
        <div className="border-t border-white/5 p-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-brand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Métriques clés
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Temps de chargement"
              value={`${(result.details.loadTime / 1000).toFixed(1)}s`}
              good={result.details.loadTime < 3000}
              icon="⚡"
            />
            <MetricCard
              label="Taille de la page"
              value={formatBytes(result.details.pageSize)}
              good={result.details.pageSize < 3000000}
              icon="📦"
            />
            <MetricCard
              label="Balise titre"
              value={result.details.title ? "Présent" : "Manquant"}
              good={!!result.details.title}
              icon="🏷️"
            />
            <MetricCard
              label="Meta description"
              value={
                result.details.metaDescription ? "Présente" : "Manquante"
              }
              good={!!result.details.metaDescription}
              icon="📝"
            />
          </div>
        </div>

        {/* Free issues (first 3) */}
        <div className="border-t border-white/5 p-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Problèmes détectés
            <span className="text-sm font-normal text-slate-500">
              ({allIssues.length} trouvés)
            </span>
          </h3>
          <div className="space-y-2">
            {allIssues.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                  item.status === "fail"
                    ? "bg-red-500/5 border border-red-500/10"
                    : "bg-yellow-500/5 border border-yellow-500/10"
                }`}
              >
                <span className="mt-0.5 text-lg">
                  {item.status === "fail" ? "🔴" : "🟡"}
                </span>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {item.title}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLURRED / LOCKED Pro content — FOMO section */}
        <div className="relative border-t border-white/5">
          <div className="p-8 select-none" aria-hidden="true">
            <div className="filter blur-[6px] pointer-events-none">
              <h3 className="text-lg font-bold text-white mb-4">
                Analyse détaillée
              </h3>
              <div className="space-y-2">
                {allIssues.slice(3, 8).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <span className="mt-0.5 text-lg">⬤</span>
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {item.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="mt-0.5 text-lg">📊</span>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Structure des headings H1-H6
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Visualisation complète de la hiérarchie
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="mt-0.5 text-lg">🖼️</span>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Audit complet des images
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Liste de toutes les images sans attribut alt
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0f0b21] via-[#0f0b21]/80 to-transparent">
              <div className="glass-card rounded-2xl p-8 max-w-md text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {hiddenCount > 0
                    ? `+${hiddenCount} problèmes`
                    : "Rapport complet"}{" "}
                  à découvrir
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Débloquez l&apos;analyse détaillée, les recommandations
                  personnalisées et le rapport HTML téléchargeable.
                </p>
                <button
                  onClick={handleBuyReport}
                  disabled={checkoutLoading}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Obtenir le rapport Pro — 9€
                    </>
                  )}
                </button>
                <p className="text-slate-500 text-xs mt-3 flex items-center justify-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Paiement sécurisé par Stripe
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden border-t border-white/5 p-6">
          <button
            onClick={handleBuyReport}
            disabled={checkoutLoading}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checkoutLoading ? "Chargement..." : "Rapport Pro — 9€"}
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  good,
  icon,
}: {
  label: string;
  value: string;
  good: boolean;
  icon: string;
}) {
  return (
    <div className="glass-card-hover rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p
        className={`text-lg font-bold ${
          good ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
