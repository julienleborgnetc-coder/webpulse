"use client";

import { useTranslations } from "next-intl";

export function SocialProof() {
  const t = useTranslations("social");
  return (
    <section className="max-w-5xl mx-auto px-4 mb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
        <StatCard number="500+" label={t("sitesAudited")} icon="📊" />
        <StatCard number="4.8/5" label={t("satisfaction")} icon="⭐" />
        <StatCard number="< 30s" label={t("avgTime")} icon="⚡" />
      </div>

      <div className="text-center mb-12">
        <h2 className="section-title">{t("title")}</h2>
        <p className="section-subtitle">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Testimonial
          quote={t("testimonials.marie.quote")}
          author={t("testimonials.marie.author")}
          role={t("testimonials.marie.role")}
          initials="ML"
          color="from-purple-500 to-pink-500"
        />
        <Testimonial
          quote={t("testimonials.thomas.quote")}
          author={t("testimonials.thomas.author")}
          role={t("testimonials.thomas.role")}
          initials="TR"
          color="from-blue-500 to-cyan-500"
        />
        <Testimonial
          quote={t("testimonials.julie.quote")}
          author={t("testimonials.julie.author")}
          role={t("testimonials.julie.role")}
          initials="JM"
          color="from-emerald-500 to-teal-500"
        />
      </div>
    </section>
  );
}

function StatCard({ number, label, icon }: { number: string; label: string; icon: string }) {
  return (
    <div className="glass-card-hover rounded-2xl p-8 text-center">
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className="text-3xl font-extrabold gradient-text mb-1">{number}</p>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  );
}

function Testimonial({ quote, author, role, initials, color }: { quote: string; author: string; role: string; initials: string; color: string }) {
  return (
    <div className="glass-card-hover rounded-2xl p-6 flex flex-col">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
          {initials}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{author}</p>
          <p className="text-slate-500 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}
