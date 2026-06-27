import { VIGIX } from "./vigix";
import { COMMON_TOKENS } from "./commonTokens";
import { chainById } from "./chains";

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

const NATIVE_FALLBACK = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const FALLBACK_LOGO = "/logo/token-fallback.svg";

// VIGIX is pinned at the top of the Polygon list (real platform token).
const VIGIX_TOKEN: TokenConfig = {
  chainId: VIGIX.chainId,
  address: VIGIX.address,
  symbol: VIGIX.symbol,
  name: VIGIX.name,
  decimals: VIGIX.decimals,
  logoURI: VIGIX.logoURI,
  isPlatformToken: true,
};

// Curated/pinned commons for fast access (native + stables + majors). The full token
// universe is loaded live from LI.FI in fetchTokensForChain — this is just the head.
export function commonTokensForChain(chainId: number): TokenConfig[] {
  const base = COMMON_TOKENS[chainId] ? [...COMMON_TOKENS[chainId]] : [];
  if (chainId === VIGIX.chainId) {
    return [VIGIX_TOKEN, ...base.filter((t) => t.address.toLowerCase() !== VIGIX.address.toLowerCase())];
  }
  // Every EVM chain at least shows its native asset, even if not in the registry.
  if (!base.length) {
    const chain = chainById(chainId);
    if (chain?.isEvm) {
      base.push({
        chainId,
        address: NATIVE_FALLBACK,
        symbol: chain.nativeCurrency,
        name: chain.name,
        decimals: 18,
        logoURI: chain.logoURI,
        isNative: true,
      });
    }
  }
  return base;
}

// Back-compat alias used across the UI.
export const tokensForChain = commonTokensForChain;

type LifiToken = { address: string; symbol: string; name: string; decimals: number; logoURI?: string };
type LifiTokensResponse = { tokens?: Record<string, LifiToken[]> };

const dynamicCache = new Map<number, TokenConfig[]>();

/**
 * FULL token universe for a chain (Uniswap-style: everything, not a curated subset).
 * Pinned commons stay at the top; the rest of the chain's real tradable tokens follow,
 * pulled live from VestigeIndex's LI.FI tokens proxy (same upstream both products use).
 * Falls back to the commons list on error.
 */
export async function fetchTokensForChain(chainId: number): Promise<TokenConfig[]> {
  const cached = dynamicCache.get(chainId);
  if (cached) return cached;

  const base = commonTokensForChain(chainId);
  const chain = chainById(chainId);
  // Non-EVM (BTC) has no LI.FI token list endpoint; return its commons.
  if (!chain?.isEvm) return base;

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
        logoURI: tk.logoURI || FALLBACK_LOGO,
      });
    }
    const merged = [...base, ...mapped];
    dynamicCache.set(chainId, merged);
    return merged;
  } catch {
    return base;
  }
}

// Uniswap-style "paste any contract address": build a minimal token entry on demand.
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
export function isAddressLike(input: string) {
  return ADDRESS_RE.test(input.trim());
}

export function customTokenFromAddress(chainId: number, address: string): TokenConfig {
  const addr = address.trim();
  return {
    chainId,
    address: addr,
    symbol: `${addr.slice(0, 6)}…${addr.slice(-4)}`,
    name: "Imported token",
    decimals: 18,
    logoURI: FALLBACK_LOGO,
  };
}
