import { selectBestRoute, type RouteCandidate } from "./bestRoute";
import { EVM_FEE_ADDRESS, EVM_FEE_RATE, ENABLE_LIFI_FEES, LIFI_INTEGRATOR, isFeeNotConfiguredError } from "./fees";

/**
 * Real VigiSwap → VestigeIndex quote adapter.
 *
 * Source of truth: VestigeIndex's LI.FI routing function, proxied at
 * `/api/vestige/lifi/routes` → `${VESTIGE_API_BASE}/lifi/routes` → li.quest advanced/routes.
 * The LI.FI API key is injected server-side inside the VestigeIndex Cloudflare Function;
 * VigiSwap never sees it. See INTEGRATION.md.
 *
 * No invented prices, no invented routes: if LI.FI returns nothing, we surface an honest error.
 */

export type QuoteRequest = {
  chainId: number;
  toChainId?: number;
  fromToken: string;
  toToken: string;
  /** Amount in base units (wei) of the source token. Use viem parseUnits with token decimals. */
  amount: string;
  slippageBps: number;
  /** Connected wallet address. Required by LI.FI to attach a transactionRequest. */
  recipient?: string;
};

/** A LI.FI route, narrowed to the fields VigiSwap reads. */
type LifiFeeCost = { amountUSD?: string; included?: boolean; name?: string };
type LifiStep = {
  tool?: string;
  toolDetails?: { name?: string; key?: string };
  estimate?: {
    approvalAddress?: string;
    feeCosts?: LifiFeeCost[];
    gasCosts?: { amountUSD?: string }[];
  };
  transactionRequest?: Record<string, unknown>;
};
type LifiRoute = {
  id?: string;
  fromAmount?: string;
  toAmount?: string;
  toAmountMin?: string;
  toAmountUSD?: string;
  fromAmountUSD?: string;
  gasCostUSD?: string;
  steps?: LifiStep[];
};

export type NormalizedRoute = RouteCandidate & {
  toAmountMin?: string;
  priceImpactPct?: number;
  approvalAddress?: string;
  transactionRequest?: Record<string, unknown>;
  raw: LifiRoute;
};

function sumFeesUsd(steps: LifiStep[] = []) {
  let total = 0;
  for (const step of steps) {
    for (const fee of step.estimate?.feeCosts ?? []) {
      const v = Number(fee.amountUSD ?? 0);
      if (Number.isFinite(v)) total += v;
    }
  }
  return total ? String(total) : undefined;
}

function priceImpact(route: LifiRoute) {
  const inUsd = Number(route.fromAmountUSD ?? 0);
  const outUsd = Number(route.toAmountUSD ?? 0);
  if (!inUsd || !outUsd) return undefined;
  return ((outUsd - inUsd) / inUsd) * 100;
}

function normalize(route: LifiRoute): NormalizedRoute {
  const steps = route.steps ?? [];
  const providers = steps.map((s) => s.toolDetails?.name || s.tool || "DEX").filter(Boolean) as string[];
  const gasUsd = route.gasCostUSD;
  const feeUsd = sumFeesUsd(steps);
  const outUsd = Number(route.toAmountUSD ?? 0);
  const netUsd = outUsd ? outUsd - Number(gasUsd ?? 0) - Number(feeUsd ?? 0) : undefined;
  const firstStep = steps[0];
  return {
    provider: providers[0] ?? "LI.FI",
    outputAmount: route.toAmount ?? "0",
    gasUsd,
    feeUsd,
    estimatedNetOutput: netUsd != null ? String(netUsd) : route.toAmountUSD,
    route: providers,
    toAmountMin: route.toAmountMin,
    priceImpactPct: priceImpact(route),
    approvalAddress: firstStep?.estimate?.approvalAddress,
    transactionRequest: firstStep?.transactionRequest,
    raw: route,
  };
}

function buildBody(request: QuoteRequest, withFee: boolean) {
  return {
    fromChainId: request.chainId,
    toChainId: request.toChainId ?? request.chainId,
    fromTokenAddress: request.fromToken,
    toTokenAddress: request.toToken,
    fromAmount: request.amount,
    fromAddress: request.recipient,
    toAddress: request.recipient,
    options: {
      slippage: Math.max(0, request.slippageBps) / 10_000,
      order: "RECOMMENDED" as const,
      integrator: LIFI_INTEGRATOR,
      // Partner fee mirrored from VestigeIndex: same wallet, same 0.05% format.
      ...(withFee ? { referrer: EVM_FEE_ADDRESS, fee: EVM_FEE_RATE } : {}),
    },
  };
}

async function requestRoutes(body: ReturnType<typeof buildBody>) {
  const res = await fetch("/api/vestige/lifi/routes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 429) throw new Error("Routing engine is rate-limited. Try again in a moment.");
    // Surface the upstream message so the fee-not-configured retry can detect it.
    let msg = `Quote unavailable from Vestige routing engine (HTTP ${res.status}).`;
    try { const j = JSON.parse(text); if (j?.message) msg = String(j.message); } catch { /* keep default */ }
    const err = new Error(msg) as Error & { httpStatus?: number };
    err.httpStatus = res.status;
    throw err;
  }
  return JSON.parse(text) as { routes?: LifiRoute[] };
}

export async function getVestigeQuote(request: QuoteRequest) {
  const wantFee = ENABLE_LIFI_FEES;
  let data: { routes?: LifiRoute[] };
  try {
    data = await requestRoutes(buildBody(request, wantFee));
  } catch (e) {
    // If LI.FI rejects because the integrator's fee wallet isn't set up yet, retry
    // without the partner fee so the user still gets a real route (same as VestigeIndex).
    if (wantFee && isFeeNotConfiguredError((e as Error).message)) {
      data = await requestRoutes(buildBody(request, false));
    } else {
      throw e;
    }
  }

  const lifiRoutes = Array.isArray(data.routes) ? data.routes : [];
  if (!lifiRoutes.length) {
    throw new Error("No route with available liquidity for this pair/amount.");
  }

  const normalized = lifiRoutes.map(normalize);
  const bestRoute = selectBestRoute(normalized) as NormalizedRoute | null;
  return { routes: normalized, bestRoute };
}
