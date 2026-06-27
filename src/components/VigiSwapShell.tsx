"use client";

import { useEffect, useState } from "react";
import { AnimatedBackground } from "./AnimatedBackground";
import { BrandMark } from "./BrandMark";
import { ConsentBanner } from "./ConsentBanner";
import { LanguageSelect } from "./LanguageSelect";
import { Promoters } from "./Promoters";
import { SwapCard } from "./SwapCard";
import { WalletProvider } from "./WalletProvider";
import { WalletButton } from "./WalletButton";
import { detectLocale, getMessages, type Locale } from "@/lib/i18n";

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
      <div className="shell">
        <header className="topbar">
          <BrandMark />
          <div className="top-actions">
            <a className="nav-vestige" href="https://www.vestigeindex.com" target="_blank" rel="noreferrer" title={t.powered}>
              <span>{t.openVestige}</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
            <LanguageSelect locale={locale} onChange={changeLocale} />
            <WalletButton t={t} />
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</div>
            <h1><span>{t.titleA}</span><br /><span className="gradient-text">{t.titleB}</span></h1>
            <p className="hero-subtitle">{t.subtitle}</p>
            <div className="trust-row">
              <span className="trust-chip">{t.trust1}</span>
              <span className="trust-chip">{t.trust2}</span>
              <span className="trust-chip">{t.trust3}</span>
              <span className="trust-chip">{t.trust4}</span>
            </div>

            <div className="route-engine-note">
              <strong>{t.routeEngineTitle}</strong>
              <p>{t.routeEngineText}</p>
            </div>
          </div>

          <div className="swap-panel-wrap">
            <SwapCard t={t} />
          </div>
        </section>

        <Promoters t={t} />

        <footer className="footer">
          <span>© 2026 VigiSwap · a VestigeIndex product · UTXO Labs &amp; Huris S&amp;C</span>
          <div className="footer-links">
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
