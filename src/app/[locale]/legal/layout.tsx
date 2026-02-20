import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("legal");
  return (
    <main className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition mb-8"
        >
          {t("backHome")}
        </Link>
        {children}
      </div>
      <Footer />
    </main>
  );
}
