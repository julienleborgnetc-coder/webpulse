"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface AuditFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function AuditForm({ onSubmit, isLoading }: AuditFormProps) {
  const t = useTranslations("auditForm");
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    onSubmit(cleanUrl);
  };

  return (
    <section id="audit" className="max-w-2xl mx-auto px-4 mb-20 mt-10">
      <form
        onSubmit={handleSubmit}
        className={`relative glass-card rounded-2xl p-1.5 flex gap-1.5 transition-all duration-500 ${
          focused ? "glow-brand border-brand-500/30" : ""
        }`}
      >
        {focused && (
          <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-sm -z-10" />
        )}
        <div className="flex-1 flex items-center gap-3 pl-5">
          <svg
            className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
              focused ? "text-brand-400" : "text-slate-500"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t("placeholder")}
            className="w-full py-3.5 bg-transparent text-white placeholder-slate-500 outline-none text-lg"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn-primary px-8 py-3.5 rounded-xl text-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("loading")}
            </>
          ) : (
            <>
              {t("submit")}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
