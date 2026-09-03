import {
  authorizeReviewedRequest,
  reviewWalletRequest,
  type SafeSignReview as UtxoSafeSignReview,
  type WalletRequest,
} from "@utxo/safesign/core";

export type CheckStatus = "pass" | "warn" | "fail";
export type SafeSignDecision = "safe" | "review" | "block";

export type SafeSignCheck = { id: string; label: string; status: CheckStatus; detail?: string };
export type SafeSignReview = { decision: SafeSignDecision; score: number; checks: SafeSignCheck[] };

export type ExactTransaction = {
  to?: string;
  data?: string;
  value?: string | bigint;
  chainId: number;
};

export type PreparedSafeSign = { request: WalletRequest; review: UtxoSafeSignReview };

export type SafeSignInput = {
  tokenSymbol: string;
  tokenName?: string;
  isNative: boolean;
  approvalAddress?: string;
  unlimitedApproval: boolean;
  priceImpactPct?: number;
  recipientRequestedForConnectedWallet: boolean;
  routeProvider?: string;
  routeVerified?: boolean;
  hasExecutableTx: boolean;
  transaction?: ExactTransaction;
};

const POLICY = {
  blockRawSignatures: true,
  blockUnlimitedApprovals: true,
  reviewUnknownContractCalls: true,
  reviewFirstTimeRecipients: true,
} as const;

function asHexQuantity(value: string | bigint | undefined) {
  if (value == null || value === "") return "0x0";
  if (typeof value === "string" && value.startsWith("0x")) return value;
  try {
    return `0x${BigInt(value).toString(16)}`;
  } catch {
    return "0x0";
  }
}

function chainHex(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

function origin() {
  return typeof window === "undefined" ? "https://vigiswap.com" : window.location.origin;
}

export function walletRequestForTransaction(transaction: ExactTransaction): WalletRequest {
  return {
    method: "eth_sendTransaction",
    params: [{
      to: transaction.to,
      data: transaction.data ?? "0x",
      value: asHexQuantity(transaction.value),
      chainId: chainHex(transaction.chainId),
    }],
  };
}

export function reviewExactTransaction(transaction: ExactTransaction, routeVerified: boolean): PreparedSafeSign {
  const request = walletRequestForTransaction(transaction);
  const review = reviewWalletRequest(
    request,
    {
      origin: origin(),
      chainId: chainHex(transaction.chainId),
      knownContract: routeVerified,
      verifiedContract: routeVerified,
      simulation: { status: "unavailable", source: "VigiSwap local route verification" },
    },
    POLICY,
  );
  return { request, review };
}

export function authorizePreparedTransaction(prepared: PreparedSafeSign, transaction: ExactTransaction) {
  return authorizeReviewedRequest(prepared.review.analysis, walletRequestForTransaction(transaction), "APPROVE");
}

function statusForDecision(decision: UtxoSafeSignReview["analysis"]["decision"]): CheckStatus {
  if (decision === "BLOCK") return "fail";
  if (decision === "WARN" || decision === "REVIEW") return "warn";
  return "pass";
}

function displayReview(review: UtxoSafeSignReview, input: SafeSignInput): SafeSignReview {
  const checks: SafeSignCheck[] = [
    {
      id: "utxo-sdk",
      label: review.human.summary,
      status: statusForDecision(review.analysis.decision),
      detail: `UTXO SafeSign ${review.analysis.version} analyzes the exact wallet request locally.`,
    },
    ...review.human.reasons.map((reason) => ({
      id: `utxo-${reason.code}`,
      label: reason.message,
      // The SDK policy has already combined individual severities into the authoritative
      // action. A high-severity signal can legitimately require review rather than a block.
      status: statusForDecision(review.analysis.decision),
      detail: reason.evidence,
    })),
  ];

  if (!input.recipientRequestedForConnectedWallet) {
    checks.push({ id: "recipient", label: "Quote recipient is not your connected wallet", status: "fail", detail: "This route cannot be signed from this interface." });
  }
  if (!input.routeVerified) {
    checks.push({ id: "route-binding", label: "Route awaits exact transaction verification", status: "warn", detail: "VigiSwap will bind router, spender, amount, chain and minimum received before it can reach the signer." });
  } else {
    checks.push({ id: "route-binding", label: `Verified route via ${input.routeProvider || "the selected provider"}`, status: "pass", detail: "The route guard matched the reviewed swap intent before signing." });
  }
  if (input.unlimitedApproval) {
    checks.push({ id: "approval-scope", label: "Unlimited approval requested", status: "fail" });
  } else if (!input.isNative) {
    checks.push({ id: "approval-scope", label: "Approval is capped to this trade amount", status: "pass" });
  }

  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");
  const decision: SafeSignDecision = hasFail ? "block" : hasWarn ? "review" : "safe";
  const risk = review.analysis.risk.overall ?? 0;
  return { decision, score: Math.max(1, Math.min(100, 100 - risk)), checks };
}

// VigiSwap owns the route intent checks. UTXO SafeSign owns request analysis and signer gating.
// This adapter keeps the existing review surface while rendering the actual SDK result.
export function analyzeSwap(input: SafeSignInput): SafeSignReview {
  const transaction = input.transaction ?? { to: input.approvalAddress, data: "0x", value: "0x0", chainId: 1 };
  return displayReview(reviewExactTransaction(transaction, Boolean(input.routeVerified)).review, input);
}

