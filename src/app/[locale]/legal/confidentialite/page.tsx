import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("legal.privacy");
  return { title: `${t("title")} — WebPulse` };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations("legal.privacy");
  return (
    <article className="prose prose-slate max-w-none">
      <h1>{t("title")}</h1>
      <p className="text-sm text-slate-500">{t("lastUpdate")}</p>
      <h2>{t("s1title")}</h2>
      <p>{t("s1text")}</p>
      <ul>
        <li><strong>{t("s1url")}</strong></li>
        <li><strong>{t("s1ip")}</strong></li>
        <li><strong>{t("s1payment")}</strong></li>
      </ul>
      <h2>{t("s2title")}</h2>
      <p>{t("s2text")}</p>
      <ul>
        <li>{t("s2audit")}</li>
        <li>{t("s2report")}</li>
        <li>{t("s2abuse")}</li>
      </ul>
      <h2>{t("s3title")}</h2>
      <p>{t("s3text1")}</p>
      <p>{t("s3text2")}</p>
      <h2>{t("s4title")}</h2>
      <p>{t("s4text")}</p>
      <h2>{t("s5title")}</h2>
      <p>{t("s5text")}</p>
      <h2>{t("s6title")}</h2>
      <p>{t("s6text")}</p>
      <ul>
        <li>{t("s6access")}</li>
        <li>{t("s6rectification")}</li>
        <li>{t("s6erasure")}</li>
        <li>{t("s6portability")}</li>
        <li>{t("s6objection")}</li>
      </ul>
      <p>{t("s6contact")} <strong>contact@webpulse.app</strong></p>
      <h2>{t("s7title")}</h2>
      <p>{t("s7text")} <strong>contact@webpulse.app</strong></p>
    </article>
  );
}
