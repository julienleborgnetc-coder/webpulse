import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("legal.mentions");
  return { title: `${t("title")} — WebPulse` };
}

export default async function MentionsPage() {
  const t = await getTranslations("legal.mentions");
  return (
    <article className="legal-article">
      <h1 className="text-3xl font-extrabold text-white mb-2">{t("title")}</h1>
      <p className="text-sm text-slate-500 mb-8">{t("lastUpdate")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s1title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4" style={{ whiteSpace: "pre-line" }}>{t("s1text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s2title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4" style={{ whiteSpace: "pre-line" }}>{t("s2text")}</p>
      <p className="mb-4"><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline transition">vercel.com</a></p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s3title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s3text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s4title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s4text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s5title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s5text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s6title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s6text")}</p>
    </article>
  );
}
