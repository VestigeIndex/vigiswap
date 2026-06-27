"use client";

import { useEffect, useState } from "react";

// Subtle, mobile-first animated backdrop: soft gradient orbs + a slow drift of REAL crypto
// logos with their LIVE USD price (CoinGecko, free). aria-hidden + pointer-events:none so it
// never interferes with the swap. Logos are original artwork (CoinGecko CDN); no fakes.
const COINS = [
  { id: "bitcoin", symbol: "BTC", logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  { id: "ethereum", symbol: "ETH", logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id: "binancecoin", symbol: "BNB", logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { id: "solana", symbol: "SOL", logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  { id: "matic-network", symbol: "POL", logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png" },
  { id: "arbitrum", symbol: "ARB", logo: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg" },
  { id: "optimism", symbol: "OP", logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
  { id: "chainlink", symbol: "LINK", logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
  { id: "uniswap", symbol: "UNI", logo: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg" },
  { id: "aave", symbol: "AAVE", logo: "https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png" },
  { id: "avalanche-2", symbol: "AVAX", logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  { id: "ripple", symbol: "XRP", logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
  { id: "dogecoin", symbol: "DOGE", logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  { id: "pepe", symbol: "PEPE", logo: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg" },
  { id: "shiba-inu", symbol: "SHIB", logo: "https://assets.coingecko.com/coins/images/11939/small/shiba.png" },
];

// Deterministic spread so chips don't overlap and layout is stable between renders.
const SPOTS = [
  { top: "12%", left: "8%", delay: "0s", dur: "26s" },
  { top: "24%", left: "82%", delay: "-4s", dur: "30s" },
  { top: "44%", left: "16%", delay: "-9s", dur: "28s" },
  { top: "62%", left: "78%", delay: "-2s", dur: "32s" },
  { top: "74%", left: "10%", delay: "-12s", dur: "27s" },
  { top: "16%", left: "52%", delay: "-7s", dur: "31s" },
  { top: "82%", left: "46%", delay: "-15s", dur: "29s" },
  { top: "38%", left: "62%", delay: "-5s", dur: "33s" },
  { top: "54%", left: "38%", delay: "-10s", dur: "25s" },
  { top: "8%", left: "32%", delay: "-3s", dur: "34s" },
  { top: "88%", left: "70%", delay: "-13s", dur: "28s" },
  { top: "30%", left: "30%", delay: "-6s", dur: "30s" },
  { top: "68%", left: "56%", delay: "-8s", dur: "31s" },
  { top: "20%", left: "70%", delay: "-11s", dur: "27s" },
  { top: "50%", left: "88%", delay: "-1s", dur: "33s" },
];

function fmtPrice(p: number) {
  if (!Number.isFinite(p)) return "";
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${p.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

export function AnimatedBackground() {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    const ids = COINS.map((c) => c.id).join(",");
    const load = () =>
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : {}))
        .then((data: Record<string, { usd?: number }>) => {
          if (!active) return;
          const next: Record<string, number> = {};
          for (const c of COINS) if (data[c.id]?.usd != null) next[c.id] = data[c.id].usd as number;
          setPrices(next);
        })
        .catch(() => undefined);
    load();
    const handle = setInterval(load, 60_000); // refresh once a minute
    return () => { active = false; clearInterval(handle); };
  }, []);

  return (
    <div className="animated-bg" aria-hidden="true">
      <div className="bg-orb one" />
      <div className="bg-orb two" />
      <div className="bg-orb three" />
      <div className="bg-grid" />
      <div className="bg-coins">
        {COINS.map((c, i) => {
          const s = SPOTS[i % SPOTS.length];
          const price = prices[c.id];
          return (
            <div key={c.id} className="bg-coin" style={{ top: s.top, left: s.left, animationDelay: s.delay, animationDuration: s.dur }}>
              <img src={c.logo} alt={c.symbol} loading="lazy" />
              {/* Price is revealed only on hover over the logo. */}
              <span className="bg-coin-price">
                <strong>{c.symbol}</strong>
                {price != null ? <em>{fmtPrice(price)}</em> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
