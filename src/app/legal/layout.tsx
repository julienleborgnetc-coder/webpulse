import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        {children}
      </div>
      <Footer />
    </main>
  );
}
