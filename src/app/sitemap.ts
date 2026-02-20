import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://webpulse.vercel.app";
const locales = ["fr", "en", "es"];

// Remove any trailing slash from SITE_URL
const baseUrl = SITE_URL.replace(/\/$/, "");

function localizedEntry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] = "weekly"): MetadataRoute.Sitemap[0] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${baseUrl}/${locale}${path}`;
  }
  languages["x-default"] = `${baseUrl}/fr${path}`;
  return {
    url: `${baseUrl}/fr${path}`,
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
