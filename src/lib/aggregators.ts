// Explicit cross-aggregator price comparison. The executable best-route engine is LI.FI
// (a meta-aggregator that already routes through 1inch/0x/ParaSwap/Odos/DEXs). On top of
// that, we query keyless aggregators DIRECTLY so the user sees a real provider comparison
// — exactly like VestigeIndex's multiProviderSwap. These are price-only quotes used to
// rank/label providers; execution still goes through LI.FI's verified transactionRequest.
//
// All amounts are in base units (wei) of the destination token, so they compare directly.

const NATIVE_EVM = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ParaSwap native sentinel
const NATIVE_ZERO = "0x0000000000000000000000000000000000000000"; // Odos native sentinel
const NATIVE_INPUTS = new Set([
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "0x0000000000000000000000000000000000000000",
]);

export type ComparisonQuote = {
  provider: string;
  /** Destination amount in wei of the destination token. */
  outputWei: string;
  outUsd?: number;
  /** Underlying venue/exchange when the aggregator exposes it. */
  via?: string;
};

export type ComparisonParams = {
  chainId: number;
  fromToken: string;
  toToken: string;
  fromDecimals: number;
  toDecimals: number;
  amountWei: string;
  recipient?: string;
};

const isNative = (a: string) => NATIVE_INPUTS.has(a.toLowerCase());

async function paraswapQuote(p: ComparisonParams): Promise<ComparisonQuote | null> {
  try {
    const qs = new URLSearchParams({
      srcToken: isNative(p.fromToken) ? NATIVE_EVM : p.fromToken,
      destToken: isNative(p.toToken) ? NATIVE_EVM : p.toToken,
      amount: p.amountWei,
      srcDecimals: String(p.fromDecimals),
      destDecimals: String(p.toDecimals),
      side: "SELL",
      network: String(p.chainId),
    });
    const res = await fetch(`/api/vestige/paraswap/prices?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { priceRoute?: { destAmount?: string; destUSD?: string; bestRoute?: Array<{ swaps?: Array<{ swapExchanges?: Array<{ exchange?: string }> }> }> } };
    const pr = data.priceRoute;
    if (!pr?.destAmount) return null;
    const via = pr.bestRoute?.[0]?.swaps?.[0]?.swapExchanges?.[0]?.exchange;
    return { provider: "ParaSwap", outputWei: pr.destAmount, outUsd: pr.destUSD ? Number(pr.destUSD) : undefined, via };
  } catch {
    return null;
  }
}

async function odosQuote(p: ComparisonParams): Promise<ComparisonQuote | null> {
  try {
    const res = await fetch(`/api/vestige/odos/quote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chainId: p.chainId,
        inputTokens: [{ tokenAddress: isNative(p.fromToken) ? NATIVE_ZERO : p.fromToken, amount: p.amountWei }],
        outputTokens: [{ tokenAddress: isNative(p.toToken) ? NATIVE_ZERO : p.toToken, proportion: 1 }],
        slippageLimitPercent: 0.5,
        userAddr: p.recipient || NATIVE_ZERO,
        referralCode: 0,
        compact: true,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { outAmounts?: string[]; outValues?: (string | number)[] };
    const out = data.outAmounts?.[0];
    if (!out) return null;
    const usd = data.outValues?.[0];
    return { provider: "Odos", outputWei: out, outUsd: usd != null ? Number(usd) : undefined };
  } catch {
    return null;
  }
}

/**
 * Fetches comparison quotes from all keyless aggregators in parallel. Failures are dropped
 * silently (an aggregator that can't price this pair just doesn't appear). Never throws.
 */
export async function getProviderComparison(p: ComparisonParams): Promise<ComparisonQuote[]> {
  const results = await Promise.all([paraswapQuote(p), odosQuote(p)]);
  return results.filter((q): q is ComparisonQuote => q !== null);
}
