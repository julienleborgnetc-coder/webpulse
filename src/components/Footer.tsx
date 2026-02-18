export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
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
          <span className="font-bold text-white">Web<span className="gradient-text">Pulse</span></span>
        </div>
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()} WebPulse. Audit de site web instantané.
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          <a href="/legal/cgv" className="hover:text-white transition">
            CGV
          </a>
          <a href="/legal/confidentialite" className="hover:text-white transition">
            Confidentialité
          </a>
          <a href="/legal/mentions" className="hover:text-white transition">
            Mentions légales
          </a>
        </div>
      </div>
    </footer>
  );
}
