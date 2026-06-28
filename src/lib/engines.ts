// VigiSwap dual-engine best-route core.
//
// VigiSwap executes through TWO real swap engines and always picks the one that returns the
// most output for the user:
//   • LI.FI  — meta-aggregator (routes through 1inch/0x/ParaSwap/Odos/OpenOcean/200+ DEXs)
//              and native BTC cross-chain. Prebuilt transactionRequest.
//   • OKX    — OKX DEX Aggregator V6, signed server-side. Same-chain EVM only; the swap tx
//              is built on demand at execution time.
//
// Both are EXECUTABLE (not compare-only). We quote both in parallel, normalize to a common
// shape, and select the best by gross output (same destination token → base units compare
// directly). No invented prices or routes: an engine that can't price the pair just drops out.

import { getVestigeQuote, type QuoteRequest } from "./vestigeApiClient";
import { EVM_FEE_ADDRESS, ROUTED_EVM_FEE_BPS, ENABLE_LIFI_FEES } from "./fees";

// OKX affiliate-fee parameters, mirroring the SAME wallet + rate VestigeIndex uses on LI.FI.
// OKX collects the commission from the source token and sends it to our EVM fee wallet, so
// both engines accrue the platform fee to the identical address at the identical 0.05%.
const OKX_FEE_PERCENT = (ROUTED_EVM_FEE_BPS / 100).toString(); // 5 bps -> "0.05" (%)
const OKX_FEE_WALLET = EVM_FEE_ADDRESS;

export type EngineId = "LI.FI" | "OKX";

/** A normalized, executable quote from one engine. */
export type EngineQuote = {
  engine: EngineId;
  /** Sub-provider / venue label for display (e.g. the winning DEX). */
  provider: string;
  /** Hop / venue labels. */
  route: string[];
  /** Destination amount in base units of the destination token. */
  outputAmount: string;
  toAmountMin?: string;
  gasUsd?: string;
  feeUsd?: string;
  estimatedNetOutput?: string;
  priceImpactPct?: number;
  /** ERC-20 spender to approve (LI.FI: known now; OKX: resolved at execute time). */
  approvalAddress?: string;
  /** LI.FI ships a prebuilt tx. OKX builds it on demand (see okx context). */
  transactionRequest?: Record<string, unknown>;
  /** Present for OKX routes — everything needed to build approve + swap at execute time. */
  okx?: OkxExecContext;
  raw?: unknown;
};

export type OkxExecContext = {
  /** "swap" = same-chain DEX aggregator; "cross-chain" = bridge aggregator build-tx. */
  kind: "swap" | "cross-chain";
  /** Source chainIndex (also the chain whose router we approve). */
  chainIndex: string;
  fromTokenAddress: string; // OKX-formatted (native sentinel for native)
  toTokenAddress: string;
  amount: string;
  slippagePercent: string; // e.g. "0.5" — same-chain swap
  fromIsNative: boolean;
  /** Platform-fee params (same wallet/rate as VestigeIndex), omitted when fees disabled. */
  feePercent?: string;
  feeWallet?: string;
  // ---- cross-chain only ----
  /** Destination chainIndex (EVM == chainId). */
  toChainIndex?: string;
  /** Slippage as a fraction string (e.g. "0.005") — cross-chain build-tx. */
  slippage?: string;
  /** Where the bridged tokens land on the destination chain. */
  receiveAddress?: string;
};

// OKX's native-asset sentinel (checksum form OKX expects).
const OKX_NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const APP_NATIVE = new Set([
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "0x0000000000000000000000000000000000000000",
]);
const isNativeAddr = (a: string) => APP_NATIVE.has(a.toLowerCase());
const okxToken = (a: string) => (isNativeAddr(a) ? OKX_NATIVE : a);

export type BestRouteParams = {
  /** Real EVM chain ids (used by OKX). */
  fromChainId: number;
  toChainId: number;
  /** LI.FI chain ids (== chainId for EVM, special for BTC). */
  fromLifiId: number;
  toLifiId: number;
  /** App token addresses (native sentinel or 0x…; "bitcoin" for BTC dest). */
  fromToken: string;
  toToken: string;
  amountWei: string;
  slippageBps: number;
  recipient?: string;
  destAddress?: string;
  crossChain: boolean;
  /** Whether the DESTINATION chain is EVM. OKX cross-chain only participates for EVM dests;
   *  non-EVM dests (Bitcoin) route via LI.FI (native BTC). */
  toIsEvm: boolean;
};

// ---- LI.FI engine -----------------------------------------------------------------------

async function lifiEngine(p: BestRouteParams): Promise<{ quote: EngineQuote | null; error?: string }> {
  const req: QuoteRequest = {
    chainId: p.fromLifiId,
    toChainId: p.toLifiId,
    fromToken: p.fromToken,
    toToken: p.toToken,
    amount: p.amountWei,
    slippageBps: p.slippageBps,
    recipient: p.recipient,
    destAddress: p.destAddress,
  };
  try {
    const { bestRoute } = await getVestigeQuote(req);
    if (!bestRoute) return { quote: null };
    const quote: EngineQuote = {
      engine: "LI.FI",
      provider: bestRoute.provider,
      route: bestRoute.route ?? [],
      outputAmount: bestRoute.outputAmount,
      toAmountMin: bestRoute.toAmountMin,
      gasUsd: bestRoute.gasUsd,
      feeUsd: bestRoute.feeUsd,
      estimatedNetOutput: bestRoute.estimatedNetOutput,
      priceImpactPct: bestRoute.priceImpactPct,
      approvalAddress: bestRoute.approvalAddress,
      transactionRequest: bestRoute.transactionRequest,
      raw: bestRoute.raw,
    };
    return { quote };
  } catch (e) {
    return { quote: null, error: (e as Error)?.message };
  }
}

// ---- OKX engine -------------------------------------------------------------------------

type OkxEnvelope<T> = { code?: string; msg?: string; data?: T[] };
type OkxProtocol = { dexName?: string; percent?: string };
// OKX V6 returns dexProtocol either as a single object (single-hop) or nested under
// subRouterList (multi-hop). We handle both so the venue label is always populated.
type OkxDexRouter = {
  router?: string;
  dexProtocol?: OkxProtocol | OkxProtocol[];
  subRouterList?: { dexProtocol?: OkxProtocol | OkxProtocol[] }[];
};
type OkxQuoteData = {
  toTokenAmount?: string;
  fromTokenAmount?: string;
  priceImpactPercentage?: string;
  estimateGasFee?: string;
  tradeFee?: string;
  dexRouterList?: OkxDexRouter[];
};

function collectProtocols(p: OkxProtocol | OkxProtocol[] | undefined, into: Set<string>) {
  if (!p) return;
  for (const proto of Array.isArray(p) ? p : [p]) if (proto.dexName) into.add(proto.dexName);
}

function okxVenues(data: OkxQuoteData): string[] {
  const names = new Set<string>();
  for (const r of data.dexRouterList ?? []) {
    collectProtocols(r.dexProtocol, names);
    for (const sub of r.subRouterList ?? []) collectProtocols(sub.dexProtocol, names);
  }
  return [...names];
}

async function okxEngine(p: BestRouteParams): Promise<{ quote: EngineQuote | null; error?: string }> {
  // OKX DEX aggregator is same-chain EVM only.
  if (p.crossChain) return { quote: null };

  const ctx: OkxExecContext = {
    kind: "swap",
    chainIndex: String(p.fromChainId),
    fromTokenAddress: okxToken(p.fromToken),
    toTokenAddress: okxToken(p.toToken),
    amount: p.amountWei,
    slippagePercent: (p.slippageBps / 100).toString(),
    fromIsNative: isNativeAddr(p.fromToken),
    ...(ENABLE_LIFI_FEES ? { feePercent: OKX_FEE_PERCENT, feeWallet: OKX_FEE_WALLET } : {}),
  };

  const qs = new URLSearchParams({
    chainIndex: ctx.chainIndex,
    amount: ctx.amount,
    fromTokenAddress: ctx.fromTokenAddress,
    toTokenAddress: ctx.toTokenAddress,
    slippage: (p.slippageBps / 10_000).toString(),
  });
  // Quote with the same fee applied so the comparison vs LI.FI is apples-to-apples.
  if (ctx.feePercent && ctx.feeWallet) {
    qs.set("feePercent", ctx.feePercent);
    qs.set("fromTokenReferrerWalletAddress", ctx.feeWallet);
  }
  try {
    const res = await fetch(`/api/okx/quote?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return { quote: null };
    const env = (await res.json()) as OkxEnvelope<OkxQuoteData>;
    if (env.code !== "0" || !env.data?.length) return { quote: null, error: env.msg };
    const d = env.data[0];
    if (!d.toTokenAmount || d.toTokenAmount === "0") return { quote: null };
    const venues = okxVenues(d);
    const impact = d.priceImpactPercentage != null ? Number(d.priceImpactPercentage) : undefined;
    const quote: EngineQuote = {
      engine: "OKX",
      provider: venues[0] || "OKX",
      route: venues.length ? venues : ["OKX"],
      outputAmount: d.toTokenAmount,
      // OKX quote does not pre-compute USD slippage min; the swap tx carries the real min.
      priceImpactPct: Number.isFinite(impact) ? impact : undefined,
      okx: ctx,
      raw: d,
    };
    return { quote };
  } catch (e) {
    return { quote: null, error: (e as Error)?.message };
  }
}

// ---- OKX cross-chain (bridge) engine ----------------------------------------------------
// Same-chain OKX drops out of cross-chain swaps; this engine covers EVM->EVM bridges so
// cross-chain is ALSO dual-engine (LI.FI vs OKX). Non-EVM destinations (Bitcoin) are left to
// LI.FI (native BTC) — OKX's BTC chainIndex is not wired, so we simply don't quote it here.

type OkxXcRouter = {
  router?: { bridgeName?: string; bridgeId?: string | number };
  bridgeName?: string;
  needApprove?: number;
  toTokenAmount?: string;
  minimumReceived?: string;
  estimateGasFee?: string;
};
type OkxXcQuoteData = {
  fromTokenAmount?: string;
  toTokenAmount?: string;
  priceImpactPercentage?: string;
  routerList?: OkxXcRouter[];
};

function okxXcBridgeName(d: OkxXcQuoteData): string {
  const r = d.routerList?.[0];
  return r?.router?.bridgeName || r?.bridgeName || "OKX Bridge";
}

async function okxCrossChainEngine(
  p: BestRouteParams,
): Promise<{ quote: EngineQuote | null; error?: string }> {
  // Only EVM->EVM bridges; same-chain and non-EVM (BTC) destinations are not OKX cross-chain.
  if (!p.crossChain || !p.toIsEvm) return { quote: null };

  const slippage = (p.slippageBps / 10_000).toString(); // fraction, e.g. "0.005"
  const ctx: OkxExecContext = {
    kind: "cross-chain",
    chainIndex: String(p.fromChainId),
    toChainIndex: String(p.toChainId),
    fromTokenAddress: okxToken(p.fromToken),
    toTokenAddress: okxToken(p.toToken),
    amount: p.amountWei,
    slippagePercent: (p.slippageBps / 100).toString(),
    slippage,
    fromIsNative: isNativeAddr(p.fromToken),
    receiveAddress: p.destAddress || p.recipient,
    ...(ENABLE_LIFI_FEES ? { feePercent: OKX_FEE_PERCENT, feeWallet: OKX_FEE_WALLET } : {}),
  };

  const qs = new URLSearchParams({
    fromChainIndex: ctx.chainIndex,
    toChainIndex: ctx.toChainIndex as string,
    fromTokenAddress: ctx.fromTokenAddress,
    toTokenAddress: ctx.toTokenAddress,
    amount: ctx.amount,
    slippage,
    sort: "0", // 0 = optimal (best net output)
  });
  // Apply the same affiliate fee as the other engine for an apples-to-apples comparison.
  if (ctx.feePercent && ctx.feeWallet) {
    qs.set("feePercent", ctx.feePercent);
    qs.set("fromTokenReferrerWalletAddress", ctx.feeWallet);
  }
  try {
    const res = await fetch(`/api/okx/cross-chain/quote?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return { quote: null };
    const env = (await res.json()) as OkxEnvelope<OkxXcQuoteData>;
    if (env.code !== "0" || !env.data?.length) return { quote: null, error: env.msg };
    const d = env.data[0];
    const out = d.toTokenAmount ?? d.routerList?.[0]?.toTokenAmount;
    if (!out || out === "0") return { quote: null };
    const bridge = okxXcBridgeName(d);
    const impact = d.priceImpactPercentage != null ? Number(d.priceImpactPercentage) : undefined;
    const quote: EngineQuote = {
      engine: "OKX",
      provider: bridge,
      route: [bridge],
      outputAmount: out,
      toAmountMin: d.routerList?.[0]?.minimumReceived,
      priceImpactPct: Number.isFinite(impact) ? impact : undefined,
      okx: ctx,
      raw: d,
    };
    return { quote };
  } catch (e) {
    return { quote: null, error: (e as Error)?.message };
  }
}

// ---- Best-route selection ---------------------------------------------------------------

export type BestRouteResult = {
  best: EngineQuote | null;
  engines: EngineQuote[];
  error?: string;
};

function gross(q: EngineQuote): bigint {
  try {
    return BigInt(q.outputAmount || "0");
  } catch {
    return 0n;
  }
}

/** Quote LI.FI and OKX in parallel and return both plus the higher-output winner.
 *  OKX runs its same-chain aggregator OR its cross-chain bridge depending on the trade —
 *  the two are mutually exclusive, so at most one OKX quote is produced. */
export async function getBestRoute(p: BestRouteParams): Promise<BestRouteResult> {
  const [lifi, okxSame, okxCross] = await Promise.all([
    lifiEngine(p),
    okxEngine(p),
    okxCrossChainEngine(p),
  ]);
  const engines = [lifi.quote, okxSame.quote, okxCross.quote].filter(
    (q): q is EngineQuote => q !== null,
  );
  if (!engines.length) {
    return { best: null, engines: [], error: lifi.error || okxSame.error || okxCross.error };
  }
  const best = engines.reduce((a, b) => (gross(b) > gross(a) ? b : a));
  // Sort so the winner is first in the comparison list.
  const sorted = [...engines].sort((a, b) => (gross(b) > gross(a) ? 1 : gross(b) < gross(a) ? -1 : 0));
  return { best, engines: sorted };
}

// ---- OKX execution helpers (used by SwapCard when OKX wins) -----------------------------

type OkxApproveData = { dexContractAddress?: string; data?: string };
type OkxSwapTx = { to?: string; data?: string; value?: string; gas?: string; gasPrice?: string };
type OkxSwapData = { tx?: OkxSwapTx };

/** Resolve the OKX router spender that must be approved for an ERC-20 source token. */
export async function fetchOkxApprovalSpender(ctx: OkxExecContext): Promise<string | null> {
  if (ctx.fromIsNative) return null;
  const qs = new URLSearchParams({
    chainIndex: ctx.chainIndex,
    tokenContractAddress: ctx.fromTokenAddress,
    approveAmount: ctx.amount,
  });
  const res = await fetch(`/api/okx/approve-transaction?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`OKX approval lookup failed (HTTP ${res.status}).`);
  const env = (await res.json()) as OkxEnvelope<OkxApproveData>;
  if (env.code !== "0" || !env.data?.length) throw new Error(env.msg || "OKX approval unavailable.");
  return env.data[0].dexContractAddress ?? null;
}

/** Fetch the executable OKX transaction for the connected wallet. Same-chain swaps hit the
 *  DEX aggregator /swap; cross-chain bridges hit /cross-chain/build-tx. Both return a tx on
 *  the SOURCE chain that the wallet signs. */
export async function fetchOkxSwapTx(
  ctx: OkxExecContext,
  userWalletAddress: string,
): Promise<{ to: string; data: string; value?: string }> {
  const crossChain = ctx.kind === "cross-chain";
  const qs = new URLSearchParams(
    crossChain
      ? {
          fromChainIndex: ctx.chainIndex,
          toChainIndex: ctx.toChainIndex as string,
          amount: ctx.amount,
          fromTokenAddress: ctx.fromTokenAddress,
          toTokenAddress: ctx.toTokenAddress,
          slippage: ctx.slippage as string,
          userWalletAddress,
          receiveAddress: ctx.receiveAddress || userWalletAddress,
          sort: "0",
        }
      : {
          chainIndex: ctx.chainIndex,
          amount: ctx.amount,
          fromTokenAddress: ctx.fromTokenAddress,
          toTokenAddress: ctx.toTokenAddress,
          slippagePercent: ctx.slippagePercent,
          userWalletAddress,
        },
  );
  // Apply the platform fee to the SAME wallet/rate as VestigeIndex (OKX affiliate commission).
  if (ctx.feePercent && ctx.feeWallet) {
    qs.set("feePercent", ctx.feePercent);
    qs.set("fromTokenReferrerWalletAddress", ctx.feeWallet);
  }
  const endpoint = crossChain ? "/api/okx/cross-chain/build-tx" : "/api/okx/swap";
  const res = await fetch(`${endpoint}?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`OKX swap build failed (HTTP ${res.status}).`);
  const env = (await res.json()) as OkxEnvelope<OkxSwapData>;
  if (env.code !== "0" || !env.data?.length) throw new Error(env.msg || "OKX swap transaction unavailable.");
  const tx = env.data[0].tx;
  if (!tx?.to || !tx.data) throw new Error("OKX returned an incomplete swap transaction.");
  return { to: tx.to, data: tx.data, value: tx.value };
}
