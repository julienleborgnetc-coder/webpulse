"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition } from "react";

const localeLabels: Record<string, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${isPending ? "opacity-50" : ""}`}>
      {Object.entries(localeLabels).map(([code, label]) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={`px-2 py-1 rounded transition-colors ${
            locale === code
              ? "bg-brand-500/20 text-brand-300 font-bold"
              : "text-slate-500 hover:text-white"
          }`}
          disabled={isPending}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
