import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("legal.mentions");
  return { title: `${t("title")} — WebPulse` };
}

export default async function MentionsPage() {
  const t = await getTranslations("legal.mentions");
  return (
    <article className="prose prose-slate max-w-none">
      <h1>{t("title")}</h1>
      <p className="text-sm text-slate-500">{t("lastUpdate")}</p>
      <h2>{t("s1title")}</h2>
      <p style={{ whiteSpace: "pre-line" }}>{t("s1text")}</p>
      <h2>{t("s2title")}</h2>
      <p style={{ whiteSpace: "pre-line" }}>{t("s2text")}</p>
      <p><a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></p>
      <h2>{t("s3title")}</h2>
      <p>{t("s3text")}</p>
      <h2>{t("s4title")}</h2>
      <p>{t("s4text")}</p>
      <h2>{t("s5title")}</h2>
      <p>{t("s5text")}</p>
      <h2>{t("s6title")}</h2>
      <p>{t("s6text")}</p>
    </article>
  );
}
