"use client";

import { useState } from "react";

// Renders a token's REAL logo. We never substitute a fake/placeholder logo image: if the
// real artwork is missing or fails to load, we show a neutral initials monogram (clearly a
// generated placeholder, not a counterfeit logo). Real logos come from the token lists
// (LI.FI / VestigeIndex registry / VIGIX), which already carry original artwork.

const FAKE = new Set(["/logo/token-fallback.svg", "/logos/token-placeholder.svg", ""]);

function isReal(src?: string) {
  return Boolean(src) && !FAKE.has(src as string);
}

// Deterministic pleasant color from the symbol so the same token always looks the same.
function monogramColor(symbol: string) {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) % 360;
  return `hsl(${h} 62% 46%)`;
}

export function TokenLogo({ symbol, logoURI, size = 28 }: { symbol: string; logoURI?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const show = isReal(logoURI) && !failed;
  const initials = (symbol || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "?";

  if (show) {
    return (
      <img
        className="token-logo-img"
        src={logoURI}
        alt={symbol}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="token-logo-monogram"
      aria-label={symbol}
      style={{ width: size, height: size, background: monogramColor(initials), fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}
