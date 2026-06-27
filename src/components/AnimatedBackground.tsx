"use client";

import { useEffect, useMemo, useState } from "react";

// Mobile-first animated backdrop: soft gradient orbs + HUNDREDS of REAL crypto token logos
// drifting slowly and randomly across the whole UI. By default they are blurred and faint;
// hovering a logo brings it into focus, and CLICKING it reveals that token's live market price.
// Logos + prices come from a single CoinGecko markets call (top market-cap tokens) — real data,
// no fakes. The layer sits below the swap card (the card has a higher z-index and re-enables
// pointer events), so the floating tokens are interactive in open space yet never block a swap.

type Mkt = { id: string; symbol: string; image: string; price: number };

// Minimal fallback (still real logos) if the markets endpoint is unavailable.
const FALLBACK: Mkt[] = [
  { id: "bitcoin", symbol: "BTC", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", price: 0 },
  { id: "ethereum", symbol: "ETH", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", price: 0 },
  { id: "binancecoin", symbol: "BNB", image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", price: 0 },
  { id: "solana", symbol: "SOL", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", price: 0 },
  { id: "ripple", symbol: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", price: 0 },
  { id: "dogecoin", symbol: "DOGE", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", price: 0 },
  { id: "matic-network", symbol: "POL", image: "https://assets.coingecko.com/coins/images/4713/small/polygon.png", price: 0 },
  { id: "chainlink", symbol: "LINK", image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", price: 0 },
  { id: "uniswap", symbol: "UNI", image: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg", price: 0 },
  { id: "avalanche-2", symbol: "AVAX", image: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", price: 0 },
];

const MAX = 160; // rendered particles (CSS hides most on mobile)

function fmtPrice(p: number) {
  if (!Number.isFinite(p) || p <= 0) return "";
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${p.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

type Layout = { top: number; left: number; size: number; dx: number; dy: number; dur: number; delay: number };
function layout(): Layout {
  return {
    top: Math.random() * 95,
    left: Math.random() * 96,
    size: 22 + Math.random() * 26,
    dx: (Math.random() * 2 - 1) * 26,
    dy: (Math.random() * 2 - 1) * 26,
    dur: 40 + Math.random() * 70,
    delay: -Math.random() * 70,
  };
}

export function AnimatedBackground() {
  const [coins, setCoins] = useState<Mkt[]>(FALLBACK);
  const [active, setActive] = useState<string | null>(null);

  // One call → logos + live prices for the top market-cap tokens.
  useEffect(() => {
    let on = true;
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",
      { cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { id: string; symbol: string; image: string; current_price: number }[] | null) => {
        if (!on || !Array.isArray(data) || !data.length) return;
        setCoins(
          data
            .filter((d) => d.image)
            .map((d) => ({ id: d.id, symbol: (d.symbol || "").toUpperCase(), image: d.image, price: d.current_price })),
        );
      })
      .catch(() => undefined);
    return () => { on = false; };
  }, []);

  // Particle positions computed once per coin set (stable across re-renders / clicks).
  const particles = useMemo(
    () => coins.slice(0, MAX).map((c) => ({ ...c, l: layout() })),
    [coins],
  );

  return (
    <div className="animated-bg">
      <div className="bg-orb one" aria-hidden="true" />
      <div className="bg-orb two" aria-hidden="true" />
      <div className="bg-orb three" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-tokens" aria-hidden="true">
        {particles.map((p, i) => (
          <button
            key={`${p.id}-${i}`}
            type="button"
            tabIndex={-1}
            className={`bg-token${active === `${p.id}-${i}` ? " active" : ""}`}
            style={{
              top: `${p.l.top}%`,
              left: `${p.l.left}%`,
              ["--size" as string]: `${p.l.size}px`,
              ["--dx" as string]: `${p.l.dx}vw`,
              ["--dy" as string]: `${p.l.dy}vh`,
              ["--dur" as string]: `${p.l.dur}s`,
              ["--delay" as string]: `${p.l.delay}s`,
            }}
            onClick={() => setActive((cur) => (cur === `${p.id}-${i}` ? null : `${p.id}-${i}`))}
          >
            <img src={p.image} alt="" loading="lazy" />
            <span className="bg-token-price">
              <strong>{p.symbol}</strong>
              {p.price > 0 ? <em>{fmtPrice(p.price)}</em> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
