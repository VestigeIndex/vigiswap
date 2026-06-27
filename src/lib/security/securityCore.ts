// UTXO Security Core — non-visual pre-signing analysis engine for EVM swaps, adapted from
// VestigeIndex's permissions/approvalRisk + SafeSign model. It evaluates the swap the user
// is about to sign and returns a verdict + per-check breakdown. It NEVER touches keys or
// seed phrases; it only inspects the public transaction context. UTXO Safe Sign renders it.

export type CheckStatus = "pass" | "warn" | "fail";
export type SafeSignDecision = "safe" | "review" | "block";

export type SafeSignCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
};

export type SafeSignReview = {
  decision: SafeSignDecision;
  score: number; // 0..100
  checks: SafeSignCheck[];
};

export type SafeSignInput = {
  tokenSymbol: string;
  tokenName?: string;
  isNative: boolean;
  /** ERC-20 approval target (LI.FI router). Undefined for native sends. */
  approvalAddress?: string;
  /** true = approve unlimited (maxUint256); false = approve the exact trade amount. */
  unlimitedApproval: boolean;
  /** Negative = you receive less than you pay (LI.FI fromUSD→toUSD delta). */
  priceImpactPct?: number;
  /** Whether the swap recipient equals the connected wallet. */
  recipientIsSelf: boolean;
  /** Best-route provider/tool label, for transparency. */
  routeProvider?: string;
  hasExecutableTx: boolean;
};

const SUSPICIOUS = /\b(fake|airdrop|claim|reward|bonus|giveaway|test|scam|voucher)\b/i;

export function analyzeSwap(input: SafeSignInput): SafeSignReview {
  const checks: SafeSignCheck[] = [];
  let score = 98;
  const add = (id: string, label: string, status: CheckStatus, detail?: string, penalty = 0) => {
    checks.push({ id, label, status, detail });
    score -= penalty;
  };

  // 1. Seed phrase / custody — always enforced by design.
  add("seed", "No seed phrase or private key is ever requested", "pass");

  // 2. Recipient must be the user's own wallet.
  if (input.recipientIsSelf) {
    add("recipient", "Swap output goes to your connected wallet", "pass");
  } else {
    add("recipient", "Swap output is NOT your connected wallet", "fail", "The route would send funds elsewhere.", 60);
  }

  // 3. Approval scope — exact beats unlimited.
  if (input.isNative) {
    add("approval", "No token approval needed (native asset)", "pass");
  } else if (!input.approvalAddress) {
    add("approval", "Spender (router) could not be resolved", "warn", "Re-quote before signing.", 14);
  } else if (input.unlimitedApproval) {
    add("approval", "Approval is unlimited", "warn", "UTXO Safe Sign caps approvals to this trade instead.", 18);
  } else {
    add("approval", "Approval is capped to this trade amount", "pass");
  }

  // 4. Token name impersonation signals.
  if (SUSPICIOUS.test(`${input.tokenSymbol} ${input.tokenName ?? ""}`)) {
    add("token", "Token naming has impersonation/incentive signals", "warn", "Verify this is the asset you intend.", 20);
  } else {
    add("token", "Token naming has no impersonation signals", "pass");
  }

  // 5. Price impact band.
  const pi = input.priceImpactPct ?? 0;
  if (pi <= -15) {
    add("impact", `Severe price impact (${pi.toFixed(1)}%)`, "fail", "You may lose a large share of value.", 40);
  } else if (pi <= -8) {
    add("impact", `High price impact (${pi.toFixed(1)}%)`, "warn", "Output is well below input value.", 18);
  } else {
    add("impact", "Price impact within a safe range", "pass");
  }

  // 6. Executable, real route.
  if (input.hasExecutableTx) {
    add("route", `Executable best route via ${input.routeProvider || "LI.FI"}`, "pass");
  } else {
    add("route", "No executable transaction in the quote yet", "warn", "Quote may have expired.", 10);
  }

  score = Math.max(1, Math.min(100, score));
  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");
  const decision: SafeSignDecision = hasFail ? "block" : hasWarn ? "review" : "safe";

  return { decision, score, checks };
}
