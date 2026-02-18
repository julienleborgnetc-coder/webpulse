export function Hero() {
  return (
    <section className="relative pt-24 pb-8 px-4 text-center max-w-4xl mx-auto overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-brand-600/20 via-brand-800/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -right-20 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute top-40 -left-20 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '3s' }} />

      <div className="relative">
        <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-sm text-brand-300 font-medium mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-400"></span>
          </span>
          Analyse gratuite en 30 secondes
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight animate-fade-in-up">
          Votre site mérite un{" "}
          <span className="gradient-text">diagnostic pro</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.15s' }}>
          Performance, SEO, accessibilité &mdash; obtenez un rapport d’audit complet
          et impressionnez vos clients.
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-slate-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {["100% gratuit", "Sans inscription", "Résultats instantanés"].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-slate-400">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
