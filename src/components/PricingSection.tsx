export function PricingSection() {
  return (
    <section id="pricing" className="max-w-5xl mx-auto px-4 mb-24">
      <div className="text-center mb-14">
        <h2 className="section-title">
          Passez au rapport <span className="gradient-text">Pro</span>
        </h2>
        <p className="section-subtitle">
          Impressionnez vos clients avec un rapport d&apos;audit professionnel et détaillé.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Gratuit</h3>
            <div className="mt-3">
              <span className="text-5xl font-extrabold text-white">0€</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <Feature text="Scores performance, SEO, accessibilité" included />
            <Feature text="Aperçu des métriques clés" included />
            <Feature text="3 problèmes affichés" included />
            <Feature text="Rapport complet détaillé" included={false} />
            <Feature text="Recommandations détaillées" included={false} />
            <Feature text="Badge site audité" included={false} />
          </ul>
          <a
            href="#audit"
            className="btn-secondary block w-full text-center py-3"
          >
            Commencer gratuitement
          </a>
        </div>

        {/* Pro */}
        <div className="relative glass-card rounded-2xl p-8 border-brand-500/30 shadow-lg shadow-brand-500/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-brand-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-500/30">
              POPULAIRE
            </span>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Rapport Pro</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold gradient-text">9€</span>
              <span className="text-slate-500">/ rapport</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <Feature text="Tout du plan Gratuit" included />
            <Feature text="Rapport HTML professionnel complet" included />
            <Feature text="Tous les problèmes détaillés" included />
            <Feature text="Recommandations d'amélioration" included />
            <Feature text="Structure des headings" included />
            <Feature text="Badge « Site Audité par WebPulse »" included />
          </ul>
          <button
            className="btn-primary block w-full text-center py-3"
            onClick={() => {
              const el = document.getElementById("audit");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Lancer un audit → Acheter le rapport
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
      <span className={included ? "text-slate-300" : "text-slate-600"}>
        {text}
      </span>
    </li>
  );
}
