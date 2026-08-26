/**
 * What must be true about a route before this site asks a wallet to sign it.
 *
 * VigiSwap is non-custodial, which means the user keeps the key — not that the user is safe. The
 * page still decides which contract to approve, which contract to call and what calldata goes with
 * it, and until now it took all three from whatever the routing API answered: `hasExecutableTx`
 * was satisfied by the presence of a `to`, `recipientIsSelf` was `Boolean(address)` — true whenever
 * a wallet was connected, regardless of where the route actually sends the output — and the result
 * went to `sendTransaction` with no estimate, no simulation, no allowlist and no check that the
 * route still described the trade the user had asked for (C-04, audit 2026-08-26).
 *
 * `analyzeSwap` produces a SCORE. A score is a thing to look at. This module produces a VERDICT,
 * and the execution path is not allowed past a refusal.
 *
 * What is checked here, all of it locally, against an intent recorded before the quote was
 * requested:
 *   - the route is for the chain, tokens, amount and account the user asked for;
 *   - the contract to be called and the spender to be approved are the same address, and it is a
 *     reviewed router for that chain — an unknown target is refused, because nothing on this page
 *     can decode an arbitrary aggregator payload;
 *   - a native trade sends exactly the input amount and a token trade sends no native value at all;
 *   - the minimum received honours the slippage the user accepted;
 *   - the quote is young enough to still describe the market it was priced in.
 *
 * Cross-chain routes are refused for execution. The page cannot verify what happens on the far
 * chain, and a multistep route can report success from the receipt of its first step alone (H-07).
 */

export type SwapIntent = {
  chainId: number;
  /** Token address, or a native sentinel. Compared case-insensitively. */
  fromToken: string;
  toToken: string;
  /** Exact base-unit amount being spent. */
  amount: string;
  /** The connected account that will sign. */
  account: string;
  /** Slippage the user accepted, in basis points (50 = 0.5%). */
  slippageBps: number;
  /** True when the trade leaves this chain. */
  crossChain: boolean;
  createdAt: number;
};

export type ExecutableTx = {
  to?: string;
  data?: string;
  value?: string | bigint;
  chainId?: number;
};

export type RouteVerdict = {
  ok: boolean;
  reasons: string[];
  canonical: {
    chainId: number;
    account: string;
    router: string;
    routerLabel: string;
    spender: string;
    fromToken: string;
    amount: string;
    toToken: string;
    minimumReceived: string;
    nativeValue: string;
    calldata: string;
  };
};

export const NATIVE_SENTINELS = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
]);

export function isNativeAddress(token: string): boolean {
  return NATIVE_SENTINELS.has(token.trim().toLowerCase());
}

/**
 * Routers this site will call, by chain.
 *
 * Missing an address costs a refused trade. Trusting an address costs the trade itself, so the
 * list is small, explicit and versioned, and anything outside it fails closed.
 */
export const ROUTER_ALLOWLIST_VERSION = "2026-08-26.1";

const SHARED_ROUTERS: Record<string, string> = {
  "0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae": "LI.FI Diamond",
  "0x111111125421ca6dc452d289314280a0f8842a65": "1inch Aggregation Router v6",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Exchange Proxy",
  "0xdef171fe48cf0115b1d80b88dc8eab59176fee57": "ParaSwap Augustus v5",
};

const ALLOWLISTED_CHAINS = new Set([1, 10, 56, 137, 8453, 42161, 43114]);

export function allowlistedRouter(chainId: number, address: string | undefined): string | null {
  if (!address || !ALLOWLISTED_CHAINS.has(chainId)) return null;
  return SHARED_ROUTERS[address.trim().toLowerCase()] ?? null;
}

/** How long a priced route may sit before it stops describing the market it was priced in. */
export const ROUTE_TTL_MS = 90_000;

function sameAddress(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function asBigInt(value: string | bigint | undefined): bigint | null {
  if (value == null || value === "") return null;
  try {
    const parsed = typeof value === "bigint" ? value : BigInt(value);
    return parsed < 0n ? null : parsed;
  } catch {
    return null;
  }
}

export function buildSwapIntent(input: Omit<SwapIntent, "createdAt"> & { createdAt?: number }): SwapIntent {
  return { ...input, createdAt: input.createdAt ?? Date.now() };
}

/**
 * Judge the transaction that is about to be sent. Fails closed: anything unverifiable is a reason,
 * and any reason is a refusal.
 */
export function verifyRouteExecution(args: {
  intent: SwapIntent;
  tx: ExecutableTx;
  /** The ERC-20 spender that would be approved (undefined for a native trade). */
  spender?: string;
  outputAmount?: string;
  minimumReceived?: string;
  now?: number;
}): RouteVerdict {
  const { intent, tx, spender } = args;
  const now = args.now ?? Date.now();
  const reasons: string[] = [];
  const routerLabel = allowlistedRouter(intent.chainId, tx.to);
  const native = isNativeAddress(intent.fromToken);

  const canonical = {
    chainId: tx.chainId ?? intent.chainId,
    account: intent.account,
    router: tx.to ?? "",
    routerLabel: routerLabel ?? "not a reviewed router",
    spender: spender ?? (native ? "none (native)" : ""),
    fromToken: intent.fromToken,
    amount: intent.amount,
    toToken: intent.toToken,
    minimumReceived: args.minimumReceived ?? "",
    nativeValue: (asBigInt(tx.value) ?? 0n).toString(),
    calldata: tx.data ?? "0x",
  };

  if (now - intent.createdAt > ROUTE_TTL_MS) {
    reasons.push("This quote is older than the site will sign for. Re-quote before trading.");
  }

  if (intent.crossChain) {
    reasons.push(
      "Cross-chain routes are quote-only here: what happens on the destination chain cannot be verified from this page.",
    );
  }

  if (!tx.to || !tx.data) {
    reasons.push("The route carries no transaction to sign.");
    return { ok: false, reasons, canonical };
  }

  if (tx.chainId != null && tx.chainId !== intent.chainId) {
    reasons.push("The transaction is for a different chain than the trade.");
  }

  if (!routerLabel) {
    reasons.push(
      `This site will not call ${tx.to}: it is not a reviewed router for this chain (allowlist ${ROUTER_ALLOWLIST_VERSION}).`,
    );
  }

  if (!native) {
    if (!spender) {
      reasons.push("The spender to approve could not be resolved, so nothing may be approved.");
    } else if (!sameAddress(spender, tx.to)) {
      reasons.push("The contract being approved is not the contract being called.");
    }
  }

  const requested = asBigInt(intent.amount);
  const value = asBigInt(tx.value ?? "0");
  if (requested == null) {
    reasons.push("The trade amount is not a valid number.");
  }
  if (value == null) {
    reasons.push("The route asks for a native value this page cannot read.");
  } else if (native) {
    if (requested != null && value !== requested) {
      reasons.push("A native trade must send exactly the amount entered and this route does not.");
    }
  } else if (value !== 0n) {
    reasons.push("A token trade must send no native value, and this route asks for some.");
  }

  const out = asBigInt(args.outputAmount);
  const min = asBigInt(args.minimumReceived);
  if (min == null || min === 0n) {
    reasons.push("The route sets no minimum received, so it could return almost nothing.");
  } else if (out != null && out > 0n) {
    const accepted = BigInt(Math.max(0, Math.min(10_000, Math.round(intent.slippageBps))));
    const floor = (out * (10_000n - accepted)) / 10_000n;
    if (min < floor) {
      reasons.push("The minimum received is below the slippage accepted for this trade.");
    }
  }

  return { ok: reasons.length === 0, reasons, canonical };
}
