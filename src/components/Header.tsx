"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link } from "@/i18n/routing";

export function Header() {
  const t = useTranslations("header");
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between glass sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-white">Web<span className="gradient-text">Pulse</span></span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <LanguageSwitcher />
        <a href="#audit" className="text-slate-400 hover:text-white transition">
          {t("audit")}
        </a>
        <a href="#pricing" className="text-slate-400 hover:text-white transition">
          {t("pricing")}
        </a>
        <a
          href="#audit"
          className="btn-primary px-5 py-2 text-sm"
        >
          {t("cta")}
        </a>
      </nav>
    </header>
  );
}
