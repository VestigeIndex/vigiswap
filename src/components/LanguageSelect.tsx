"use client";

import { useEffect, useRef, useState } from "react";
import { localeNames, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSelect({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="lang" ref={ref}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="lang-globe" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </svg>
        <span>{localeNames[locale]}</span>
        <svg className={`lang-caret${open ? " open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="lang-menu" role="listbox">
          {SUPPORTED_LOCALES.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === locale}
              className={`lang-item${item === locale ? " active" : ""}`}
              onClick={() => { onChange(item); setOpen(false); }}
            >
              {localeNames[item]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
