"use client";

import { useTranslations } from "next-intl";

export function PricingSection() {
  const t = useTranslations("pricing");
  return (
    <section id="pricing" className="max-w-5xl mx-auto px-4 mb-24">
      <div className="text-center mb-14">
        <h2 className="section-title">
          {t("title")} <span className="gradient-text">{t("titleHighlight")}</span>
        </h2>
        <p className="section-subtitle">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t("free")}</h3>
            <div className="mt-3">
              <span className="text-5xl font-extrabold text-white">0€</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <Feature text={t("features.scores")} included />
            <Feature text={t("features.metricsPreview")} included />
            <Feature text={t("features.threeIssues")} included />
            <Feature text={t("features.fullReport")} included={false} />
            <Feature text={t("features.recommendations")} included={false} />
            <Feature text={t("features.badge")} included={false} />
          </ul>
          <a href="#audit" className="btn-secondary block w-full text-center py-3">
            {t("startFree")}
          </a>
        </div>

        {/* Pro */}
        <div className="relative glass-card rounded-2xl p-8 border-brand-500/30 shadow-lg shadow-brand-500/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-brand-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-500/30">
              {t("popular")}
            </span>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t("pro")}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold gradient-text">9€</span>
              <span className="text-slate-500">{t("perReport")}</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <Feature text={t("features.allFree")} included />
            <Feature text={t("features.htmlReport")} included />
            <Feature text={t("features.allIssues")} included />
            <Feature text={t("features.improvementRecs")} included />
            <Feature text={t("features.headings")} included />
            <Feature text={t("features.auditBadge")} included />
          </ul>
          <button
            className="btn-primary block w-full text-center py-3"
            onClick={() => {
              const el = document.getElementById("audit");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {t("launchAudit")}
          </button>
        </div>
      </div>
    </section>
  );
}

function Feature({ text, included }: { text: string; included: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {included ? (
        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
      <span className={included ? "text-slate-300" : "text-slate-600"}>{text}</span>
    </li>
  );
}
