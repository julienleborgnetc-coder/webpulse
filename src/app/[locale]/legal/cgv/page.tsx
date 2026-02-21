import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("legal.cgv");
  return { title: `${t("title")} — WebPulse` };
}

export default async function CGVPage() {
  const t = await getTranslations("legal.cgv");
  return (
    <article className="legal-article">
      <h1 className="text-3xl font-extrabold text-white mb-2">{t("title")}</h1>
      <p className="text-sm text-slate-500 mb-8">{t("lastUpdate")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s1title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s1text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s2title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s2text")}</p>
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2 pl-2">
        <li><strong className="text-white">{t("s2free")}</strong></li>
        <li><strong className="text-white">{t("s2pro")}</strong></li>
      </ul>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s3title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s3text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s4title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s4text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s5title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s5text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s6title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s6text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s7title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s7text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s8title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s8text")} <strong className="text-white">contact@webpulse.app</strong></p>
    </article>
  );
}
