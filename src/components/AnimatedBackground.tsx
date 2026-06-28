"use client";

import { useEffect, useMemo, useState } from "react";

// Mobile-first animated backdrop: soft gradient orbs + the TOP 100 REAL crypto tokens drifting
// slowly across the whole UI. They are laid out on a JITTERED GRID so every logo keeps real
// breathing room from its neighbours (no clumping), and each drifts only gently within its own
// cell so the spacing is preserved while it moves. By default they are blurred and faint;
// HOVERING a logo brings it into focus (de-blur); CLICKING it reveals that token's live market
// price and its 24h change. Logos, prices and 24h moves come from a single CoinGecko markets
// call (top 100 by market cap) — real data, no fakes. The layer sits below the swap card (the
// card has a higher z-index and re-enables pointer events), so the floating tokens are
// interactive in open space yet never block a swap.

type Mkt = { id: string; symbol: string; image: string; price: number; change24h: number | null };

// Minimal fallback (still real logos) if the markets endpoint is unavailable.
const FALLBACK: Mkt[] = [
  { id: "bitcoin", symbol: "BTC", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", price: 0, change24h: null },
  { id: "ethereum", symbol: "ETH", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", price: 0, change24h: null },
  { id: "binancecoin", symbol: "BNB", image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", price: 0, change24h: null },
  { id: "solana", symbol: "SOL", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", price: 0, change24h: null },
  { id: "ripple", symbol: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", price: 0, change24h: null },
  { id: "dogecoin", symbol: "DOGE", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", price: 0, change24h: null },
  { id: "matic-network", symbol: "POL", image: "https://assets.coingecko.com/coins/images/4713/small/polygon.png", price: 0, change24h: null },
  { id: "chainlink", symbol: "LINK", image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", price: 0, change24h: null },
  { id: "uniswap", symbol: "UNI", image: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg", price: 0, change24h: null },
  { id: "avalanche-2", symbol: "AVAX", image: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", price: 0, change24h: null },
];

const MAX = 100; // top 100 tokens (CSS thins them out on small screens)

function fmtPrice(p: number) {
  if (!Number.isFinite(p) || p <= 0) return "";
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${p.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

function fmtChange(c: number | null) {
  if (c == null || !Number.isFinite(c)) return "";
  const sign = c > 0 ? "+" : "";
  return `${sign}${c.toFixed(2)}%`;
}

type Layout = { top: number; left: number; size: number; dx: number; dy: number; dur: number; delay: number };

// Jittered-grid placement: one token per cell + a small random offset, so neighbours never
// overlap. Drift amplitude is kept well below the cell size so each logo stays inside its own
// patch of space as it moves — the separation is preserved across the whole animation.
function buildLayout(count: number): Layout[] {
  if (count <= 0) return [];
  // Columns chosen for a ~16:9 viewport so cells are roughly square on screen.
  const cols = Math.max(1, Math.round(Math.sqrt(count * (16 / 9))));
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  // Padding keeps logos off the very edges; jitter stays inside the cell's inner area.
  const padX = cellW * 0.16;
  const padY = cellH * 0.16;
  const jitterX = cellW - padX * 2;
  const jitterY = cellH - padY * 2;
  // Drift small relative to a cell so tokens never wander into each other.
  const driftX = Math.min(4, cellW * 0.35);
  const driftY = Math.min(5, cellH * 0.35);

  const out: Layout[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * cellW + padX + Math.random() * jitterX;
    const top = row * cellH + padY + Math.random() * jitterY;
    out.push({
      left,
      top,
      size: 24 + Math.random() * 16,
      dx: (Math.random() * 2 - 1) * driftX,
      dy: (Math.random() * 2 - 1) * driftY,
      dur: 26 + Math.random() * 34,
      delay: -Math.random() * 40,
    });
  }
  return out;
}

export function AnimatedBackground() {
  const [coins, setCoins] = useState<Mkt[]>(FALLBACK);
  const [active, setActive] = useState<string | null>(null);

  // One call → logos + live prices for the top 100 market-cap tokens.
  useEffect(() => {
    let on = true;
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
      { cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data:
            | { id: string; symbol: string; image: string; current_price: number; price_change_percentage_24h: number | null }[]
            | null,
        ) => {
          if (!on || !Array.isArray(data) || !data.length) return;
          setCoins(
            data
              .filter((d) => d.image)
              .map((d) => ({
                id: d.id,
                symbol: (d.symbol || "").toUpperCase(),
                image: d.image,
                price: d.current_price,
                change24h: d.price_change_percentage_24h ?? null,
              })),
          );
        },
      )
      .catch(() => undefined);
    return () => { on = false; };
  }, []);

  // Particle positions computed once per coin set (stable across re-renders / hovers).
  const particles = useMemo(() => {
    const picks = coins.slice(0, MAX);
    const layouts = buildLayout(picks.length);
    return picks.map((c, i) => ({ ...c, l: layouts[i] }));
  }, [coins]);

  return (
    <div className="animated-bg">
      <div className="bg-orb one" aria-hidden="true" />
      <div className="bg-orb two" aria-hidden="true" />
      <div className="bg-orb three" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-tokens" aria-hidden="true">
        {particles.map((p, i) => {
          const key = `${p.id}-${i}`;
          return (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              className={`bg-token${active === key ? " active" : ""}`}
              style={{
                top: `${p.l.top}%`,
                left: `${p.l.left}%`,
                ["--size" as string]: `${p.l.size}px`,
                ["--dx" as string]: `${p.l.dx}vw`,
                ["--dy" as string]: `${p.l.dy}vh`,
                ["--dur" as string]: `${p.l.dur}s`,
                ["--delay" as string]: `${p.l.delay}s`,
              }}
              // Hover reveals on desktop (CSS); tap toggles on touch devices.
              onClick={() => setActive((cur) => (cur === key ? null : key))}
            >
              <img src={p.image} alt="" loading="lazy" />
              <span className="bg-token-price">
                <strong>{p.symbol}</strong>
                {p.price > 0 ? <em>{fmtPrice(p.price)}</em> : null}
                {p.change24h != null ? (
                  <i className={`bg-token-change ${p.change24h >= 0 ? "up" : "down"}`}>
                    {fmtChange(p.change24h)} · 24h
                  </i>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
