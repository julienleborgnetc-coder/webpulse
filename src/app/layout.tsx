import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebPulse - Audit de site web instantané",
  description:
    "Analysez les performances, le SEO et l'accessibilité de votre site web en 30 secondes. Obtenez un rapport professionnel détaillé.",
  keywords: [
    "audit site web",
    "SEO",
    "performance",
    "accessibilité",
    "analyse site",
    "Core Web Vitals",
  ],
  openGraph: {
    title: "WebPulse - Audit de site web instantané",
    description:
      "Analysez les performances, le SEO et l'accessibilité de votre site en 30 secondes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WebPulse",
    description:
      "Analysez les performances, le SEO et l'accessibilité de votre site web en 30 secondes.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://webpulse.vercel.app",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Audit gratuit avec scores et aperçu",
    },
  };

  return (
    <html suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
