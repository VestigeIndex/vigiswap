"use client";

import { useEffect, useState } from "react";
import { AnimatedBackground } from "./AnimatedBackground";
import { BrandMark } from "./BrandMark";
import { Promoters } from "./Promoters";
import { detectLocale, getMessages, type Locale } from "@/lib/i18n";

// Reserved "everything else" page: the marketing/hero copy and the route-engine explainer
// that used to sit on the landing now live here, so vigiswap.com lands straight on the swap.
export function AboutPage() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const saved = localStorage.getItem("vigiswap-locale");
    setLocale(detectLocale(saved || navigator.language));
  }, []);
  const t = getMessages(locale);

  return (
    <main className="vigi-page">
      <AnimatedBackground />
      <div className="about-page">
        <header className="topbar">
          <BrandMark />
          <a className="pill" href="/">← {t.swap}</a>
        </header>

        <article className="about-card hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</div>
          <h1><span>{t.titleA}</span> <span className="gradient-text">{t.titleB}</span></h1>
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
        </article>

        <Promoters t={t} />
      </div>
    </main>
  );
}
