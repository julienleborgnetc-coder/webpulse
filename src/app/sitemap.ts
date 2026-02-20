import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://webpulse.vercel.app";
const locales = ["fr", "en", "es"];

function localizedEntry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] = "weekly"): MetadataRoute.Sitemap[0] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${SITE_URL}/${locale}${path}`;
  }
  return {
    url: `${SITE_URL}/fr${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    localizedEntry("", 1, "weekly"),
    localizedEntry("/legal/cgv", 0.3, "yearly"),
    localizedEntry("/legal/confidentialite", 0.3, "yearly"),
    localizedEntry("/legal/mentions", 0.3, "yearly"),
  ];
}
