import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("legal.privacy");
  return { title: `${t("title")} — WebPulse` };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations("legal.privacy");
  return (
    <article className="legal-article">
      <h1 className="text-3xl font-extrabold text-white mb-2">{t("title")}</h1>
      <p className="text-sm text-slate-500 mb-8">{t("lastUpdate")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s1title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s1text")}</p>
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2 pl-2">
        <li><strong className="text-white">{t("s1url")}</strong></li>
        <li><strong className="text-white">{t("s1ip")}</strong></li>
        <li><strong className="text-white">{t("s1payment")}</strong></li>
      </ul>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s2title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s2text")}</p>
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2 pl-2">
        <li>{t("s2audit")}</li>
        <li>{t("s2report")}</li>
        <li>{t("s2abuse")}</li>
      </ul>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s3title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s3text1")}</p>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s3text2")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s4title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s4text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s5title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s5text")}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s6title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s6text")}</p>
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2 pl-2">
        <li>{t("s6access")}</li>
        <li>{t("s6rectification")}</li>
        <li>{t("s6erasure")}</li>
        <li>{t("s6portability")}</li>
        <li>{t("s6objection")}</li>
      </ul>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s6contact")} <strong className="text-white">contact@webpulse.app</strong></p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">{t("s7title")}</h2>
      <p className="text-slate-300 leading-relaxed mb-4">{t("s7text")} <strong className="text-white">contact@webpulse.app</strong></p>
    </article>
  );
}
