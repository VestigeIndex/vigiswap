"use client";

import { useEffect, useMemo, useState } from "react";

// A live liquidity field with the major market assets drifting behind the swap surface.
// CoinGecko remains the source of truth for live price data, while its large artwork keeps
// every mark crisp when a user brings it into focus.

type Mkt = { id: string; symbol: string; image: string; price: number; change24h: number | null };

// Minimal fallback with high-resolution official CoinGecko artwork.
const FALLBACK: Mkt[] = [
  { id: "bitcoin", symbol: "BTC", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", price: 0, change24h: null },
  { id: "ethereum", symbol: "ETH", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", price: 0, change24h: null },
  { id: "tether", symbol: "USDT", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", price: 0, change24h: null },
  { id: "usd-coin", symbol: "USDC", image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", price: 0, change24h: null },
  { id: "binancecoin", symbol: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", price: 0, change24h: null },
  { id: "solana", symbol: "SOL", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", price: 0, change24h: null },
  { id: "ripple", symbol: "XRP", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", price: 0, change24h: null },
  { id: "wrapped-bitcoin", symbol: "WBTC", image: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", price: 0, change24h: null },
  { id: "chainlink", symbol: "LINK", image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", price: 0, change24h: null },
  { id: "uniswap", symbol: "UNI", image: "https://assets.coingecko.com/coins/images/12504/large/uni.jpg", price: 0, change24h: null },
  { id: "avalanche-2", symbol: "AVAX", image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", price: 0, change24h: null },
  { id: "polygon-ecosystem-token", symbol: "POL", image: "https://assets.coingecko.com/coins/images/4713/large/polygon.png", price: 0, change24h: null },
  { id: "arbitrum", symbol: "ARB", image: "https://assets.coingecko.com/coins/images/16547/large/arb.jpg", price: 0, change24h: null },
  { id: "optimism", symbol: "OP", image: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png", price: 0, change24h: null },
  { id: "aave", symbol: "AAVE", image: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", price: 0, change24h: null },
  { id: "maker", symbol: "MKR", image: "https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png", price: 0, change24h: null },
  { id: "dai", symbol: "DAI", image: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png", price: 0, change24h: null },
  { id: "the-graph", symbol: "GRT", image: "https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png", price: 0, change24h: null },
];

function highResolutionImage(image: string) {
  return image.replace("/thumb/", "/large/").replace("/small/", "/large/");
}

const MAX = 50;

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

// Jittered-grid placement: one token per cell + a random offset, so neighbours never overlap.
// Each logo then wanders on a gentle ORBIT (see the tokenDrift keyframes) whose radius is kept
// below half the cell, so motion is clearly visible yet the separation always holds.
function buildLayout(count: number): Layout[] {
  if (count <= 0) return [];
  // Columns chosen for a ~16:9 viewport so cells are roughly square on screen.
  const cols = Math.max(1, Math.round(Math.sqrt(count * (16 / 9))));
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  // Padding keeps logos off the very edges; jitter stays inside the cell's inner area.
  const padX = cellW * 0.14;
  const padY = cellH * 0.14;
  const jitterX = cellW - padX * 2;
  const jitterY = cellH - padY * 2;
  // Orbit radius — large enough to read as movement, capped under half the cell.
  const driftX = Math.min(6, cellW * 0.5);
  const driftY = Math.min(8, cellH * 0.5);

  const out: Layout[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * cellW + padX + Math.random() * jitterX;
    const top = row * cellH + padY + Math.random() * jitterY;
    const sign = Math.random() < 0.5 ? -1 : 1; // randomize orbit direction
    out.push({
      left,
      top,
      size: 30 + Math.random() * 22, // 30–52px, noticeably bigger
      // Keep a healthy minimum magnitude (>=55% of the cap) so none look static.
      dx: sign * (0.55 + Math.random() * 0.45) * driftX,
      dy: (0.55 + Math.random() * 0.45) * driftY,
      dur: 16 + Math.random() * 18, // 16–34s, faster = more alive
      delay: -Math.random() * 30,
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
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h",
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
              .filter((token) => token.image)
              .slice(0, MAX)
              .map((token) => ({
                id: token.id,
                symbol: (token.symbol || "").toUpperCase(),
                image: highResolutionImage(token.image),
                price: token.current_price,
                change24h: token.price_change_percentage_24h ?? null,
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
      <div className="bg-tokens">
        {particles.map((p, i) => {
          const key = `${p.id}-${i}`;
          return (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              aria-label={`Show ${p.symbol} market data`}
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

