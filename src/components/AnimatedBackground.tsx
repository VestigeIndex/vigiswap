"use client";

import { useEffect, useRef, useState } from "react";

// Mobile-first animated backdrop: soft gradient orbs + REAL crypto logos that wander slowly
// across the WHOLE screen with their LIVE USD price (CoinGecko, free). The logo layer is
// pointer-events:none so it NEVER blocks the swap card or navbar; the price is revealed by
// proximity to the cursor (mousemove), and a lightweight physics loop keeps the logos drifting
// randomly over the full viewport while a separation force stops them from clustering together.
// Logos are original artwork (CoinGecko CDN); no fakes.
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

function fmtPrice(p: number) {
  if (!Number.isFinite(p)) return "";
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${p.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

type Body = { x: number; y: number; vx: number; vy: number };

export function AnimatedBackground() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const elRefs = useRef<(HTMLDivElement | null)[]>([]);
  const priceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Live prices (refreshed once a minute).
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
    const handle = setInterval(load, 60_000);
    return () => { active = false; clearInterval(handle); };
  }, []);

  // Full-screen wandering physics: slow drift, edge bounce, anti-cluster separation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const SIZE = W <= 760 ? 40 : 56;          // logo box (matches CSS)
    const R = SIZE / 2;
    const MARGIN = 6;
    const MIN_DIST = SIZE + (W <= 760 ? 26 : 72); // center spacing that prevents grouping
    const SPEED_MIN = 9;                       // px/s — slow
    const SPEED_MAX = 26;
    const HOVER_R = R + 14;

    const maxX = () => Math.max(MARGIN, W - SIZE - MARGIN);
    const maxY = () => Math.max(MARGIN, H - SIZE - MARGIN);

    // Spread the logos across the WHOLE screen with rejection sampling so none start clustered.
    const bodies: Body[] = [];
    for (let i = 0; i < COINS.length; i++) {
      let x = 0, y = 0, ok = false;
      for (let tries = 0; tries < 60 && !ok; tries++) {
        x = MARGIN + Math.random() * (maxX() - MARGIN);
        y = MARGIN + Math.random() * (maxY() - MARGIN);
        ok = bodies.every((b) => Math.hypot(b.x - x, b.y - y) >= MIN_DIST * 0.9);
      }
      const ang = Math.random() * Math.PI * 2;
      const sp = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      bodies.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp });
    }

    // Paint once immediately (covers the reduced-motion case too).
    bodies.forEach((b, i) => {
      const el = elRefs.current[i];
      if (el) el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    });

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      for (const b of bodies) { b.x = Math.min(b.x, maxX()); b.y = Math.min(b.y, maxY()); }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    let raf = 0;
    let last = performance.now();
    const clampSpeed = (b: Body) => {
      const s = Math.hypot(b.vx, b.vy) || 1;
      const t = Math.min(SPEED_MAX, Math.max(SPEED_MIN, s)) / s;
      b.vx *= t; b.vy *= t;
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Separation: push apart any pair closer than MIN_DIST so they never bunch up.
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          const dx = (a.x - b.x), dy = (a.y - b.y);
          const d = Math.hypot(dx, dy) || 0.001;
          if (d < MIN_DIST) {
            const ux = dx / d, uy = dy / d;
            const push = (MIN_DIST - d) * 0.5;
            a.x += ux * push; a.y += uy * push;
            b.x -= ux * push; b.y -= uy * push;
            const f = 6;
            a.vx += ux * f; a.vy += uy * f;
            b.vx -= ux * f; b.vy -= uy * f;
          }
        }
      }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        // Gentle random steering keeps the wander organic instead of straight lines.
        b.vx += (Math.random() - 0.5) * 6 * dt;
        b.vy += (Math.random() - 0.5) * 6 * dt;
        clampSpeed(b);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Bounce off the viewport edges.
        const mx = maxX(), my = maxY();
        if (b.x < MARGIN) { b.x = MARGIN; b.vx = Math.abs(b.vx); }
        else if (b.x > mx) { b.x = mx; b.vx = -Math.abs(b.vx); }
        if (b.y < MARGIN) { b.y = MARGIN; b.vy = Math.abs(b.vy); }
        else if (b.y > my) { b.y = my; b.vy = -Math.abs(b.vy); }

        const el = elRefs.current[i];
        if (el) el.style.transform = `translate(${b.x}px, ${b.y}px)`;

        // Proximity hover: reveal the price when the cursor is over/near the logo.
        const near = Math.hypot(mouse.x - (b.x + R), mouse.y - (b.y + R)) <= HOVER_R;
        const pe = priceRefs.current[i];
        const node = elRefs.current[i];
        if (node) node.classList.toggle("is-hover", near);
        if (pe) pe.style.opacity = near ? "1" : "";
      }

      raf = requestAnimationFrame(step);
    };

    if (!reduce) raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="animated-bg" aria-hidden="true">
      <div className="bg-orb one" />
      <div className="bg-orb two" />
      <div className="bg-orb three" />
      <div className="bg-grid" />
      <div className="bg-coins">
        {COINS.map((c, i) => {
          const price = prices[c.id];
          return (
            <div
              key={c.id}
              className="bg-coin"
              ref={(el) => { elRefs.current[i] = el; }}
            >
              <img src={c.logo} alt={c.symbol} loading="lazy" />
              <span className="bg-coin-price" ref={(el) => { priceRefs.current[i] = el; }}>
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
