import { VIGIX } from "./vigix";

export type TokenConfig = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  isNative?: boolean;
  isPlatformToken?: boolean;
};

export const TOKENS: TokenConfig[] = [
  { chainId: 137, address: VIGIX.address, symbol: VIGIX.symbol, name: "VIGIX", decimals: VIGIX.decimalsFallback, logoURI: VIGIX.logoURI, isPlatformToken: true },
  { chainId: 1, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "ETH", name: "Ethereum", decimals: 18, logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png", isNative: true },
  { chainId: 1, address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", name: "USD Coin", decimals: 6, logoURI: "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png" },
  { chainId: 1, address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", name: "Tether USD", decimals: 6, logoURI: "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png" },
  { chainId: 1, address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", symbol: "WBTC", name: "Wrapped BTC", decimals: 8, logoURI: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png" },
  { chainId: 137, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "POL", name: "Polygon", decimals: 18, logoURI: "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png", isNative: true },
  { chainId: 137, address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", symbol: "USDC", name: "USD Coin", decimals: 6, logoURI: "https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png" },
  { chainId: 137, address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", symbol: "USDT", name: "Tether USD", decimals: 6, logoURI: "https://tokens.1inch.io/0xc2132d05d31c914a87c6611c10748aeb04b58e8f.png" },
  { chainId: 56, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "BNB", name: "BNB", decimals: 18, logoURI: "/logo/token-fallback.svg", isNative: true },
  { chainId: 42161, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "ETH", name: "Ethereum", decimals: 18, logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png", isNative: true },
  { chainId: 10, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "ETH", name: "Ethereum", decimals: 18, logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png", isNative: true },
  { chainId: 8453, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "ETH", name: "Ethereum", decimals: 18, logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png", isNative: true }
];

export function tokensForChain(chainId: number) { return TOKENS.filter((token) => token.chainId === chainId); }

type LifiToken = { address: string; symbol: string; name: string; decimals: number; logoURI?: string };
type LifiTokensResponse = { tokens?: Record<string, LifiToken[]> };

const dynamicCache = new Map<number, TokenConfig[]>();

/**
 * Real token list from VestigeIndex's LI.FI tokens endpoint (proxied, cached).
 * Curated static tokens (VIGIX, native, stables) stay pinned to the top; the rest
 * of the chain's real tradable tokens follow. Falls back to the static list on error.
 */
export async function fetchTokensForChain(chainId: number): Promise<TokenConfig[]> {
  const cached = dynamicCache.get(chainId);
  if (cached) return cached;

  const base = tokensForChain(chainId);
  try {
    const res = await fetch(`/api/vestige/lifi/tokens?chains=${chainId}`, { cache: "force-cache" });
    if (!res.ok) return base;
    const data = (await res.json()) as LifiTokensResponse;
    const list = data.tokens?.[String(chainId)] ?? [];
    const seen = new Set(base.map((t) => t.address.toLowerCase()));
    const mapped: TokenConfig[] = [];
    for (const tk of list) {
      const addr = (tk.address || "").toLowerCase();
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);
      mapped.push({
        chainId,
        address: addr,
        symbol: tk.symbol,
        name: tk.name,
        decimals: tk.decimals,
        logoURI: tk.logoURI || "/logo/token-fallback.svg",
      });
    }
    const merged = [...base, ...mapped];
    dynamicCache.set(chainId, merged);
    return merged;
  } catch {
    return base;
  }
}
