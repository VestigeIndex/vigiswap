"use client";

import { useEffect, useState } from "react";
import { AnimatedBackground } from "./AnimatedBackground";
import { BrandMark } from "./BrandMark";
import { ConsentBanner } from "./ConsentBanner";
import { LanguageSelect } from "./LanguageSelect";
import { SwapCard } from "./SwapCard";
import { WalletProvider } from "./WalletProvider";
import { WalletButton } from "./WalletButton";
import { detectLocale, getMessages, type Locale } from "@/lib/i18n";

// Professional/financial surfaces live on vestigeindex.com — VigiSwap is the swap-only entry
// point. The nav deep-links to the relevant VestigeIndex sections (verified live routes).
const VESTIGE = "https://www.vestigeindex.com";

export function VigiSwapShell() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("vigiswap-locale");
    setLocale(detectLocale(saved || navigator.language));
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    localStorage.setItem("vigiswap-locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }

  const t = getMessages(locale);

  return (
    <WalletProvider>
    <main className="vigi-page">
      <AnimatedBackground />
      <div className="shell shell-swap">
        <header className="topbar">
          <BrandMark />
          <nav className="main-nav" aria-label="Primary">
            <span className="nav-link active" aria-current="page">Swap</span>
            <a className="nav-link" href={`${VESTIGE}/trade`}>Trade</a>
            <a className="nav-link" href={`${VESTIGE}/markets`}>Markets</a>
            <a className="nav-link" href={`${VESTIGE}/earn`}>Funds</a>
          </nav>
          <div className="top-actions">
            <a className="icon-button" href="/about" aria-label="About VigiSwap" title="About">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" />
              </svg>
            </a>
            <LanguageSelect locale={locale} onChange={changeLocale} />
            <WalletButton t={t} />
          </div>
        </header>

        <section className="swap-stage">
          <div className="swap-panel-wrap">
            <SwapCard t={t} />
          </div>
        </section>

        <footer className="footer footer-min">
          <span>© 2026 VigiSwap · a VestigeIndex product · UTXO Labs &amp; Huris S&amp;C</span>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/privacy">{t.privacy}</a>
            <a href="/cookies">{t.cookies}</a>
            <a href="/terms">{t.terms}</a>
            <a href="/risk">{t.risk}</a>
          </div>
        </footer>
      </div>
      <ConsentBanner t={t} />
    </main>
    </WalletProvider>
  );
}
