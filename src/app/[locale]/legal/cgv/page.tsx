import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("legal.cgv");
  return { title: `${t("title")} — WebPulse` };
}

export default async function CGVPage() {
  const t = await getTranslations("legal.cgv");
  return (
    <article className="prose prose-slate max-w-none">
      <h1>{t("title")}</h1>
      <p className="text-sm text-slate-500">{t("lastUpdate")}</p>
      <h2>{t("s1title")}</h2>
      <p>{t("s1text")}</p>
      <h2>{t("s2title")}</h2>
      <p>{t("s2text")}</p>
      <ul>
        <li><strong>{t("s2free")}</strong></li>
        <li><strong>{t("s2pro")}</strong></li>
      </ul>
      <h2>{t("s3title")}</h2>
      <p>{t("s3text")}</p>
      <h2>{t("s4title")}</h2>
      <p>{t("s4text")}</p>
      <h2>{t("s5title")}</h2>
      <p>{t("s5text")}</p>
      <h2>{t("s6title")}</h2>
      <p>{t("s6text")}</p>
      <h2>{t("s7title")}</h2>
      <p>{t("s7text")}</p>
      <h2>{t("s8title")}</h2>
      <p>{t("s8text")} <strong>contact@webpulse.app</strong></p>
    </article>
  );
}
