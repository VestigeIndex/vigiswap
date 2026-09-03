type SafeSignDecision = "ALLOW" | "WARN" | "REVIEW" | "BLOCK";
type RiskSeverity = "info" | "low" | "medium" | "high" | "critical";
type RiskCategory = "origin" | "contract" | "permission" | "asset" | "execution" | "behavioral" | "simulation" | "network";
type RequestKind = "transaction" | "typed-data" | "message-signature" | "raw-signature" | "chain-switch" | "unknown";
interface WalletRequest {
    method: string;
    params?: unknown[];
}
interface EvmTransaction {
    from?: string;
    to?: string;
    value?: string;
    data?: string;
    input?: string;
    gas?: string;
    gasLimit?: string;
    chainId?: string;
    nonce?: string;
}
interface NormalizedRequest {
    method: string;
    kind: RequestKind;
    origin?: string;
    chainId?: string;
    transaction?: EvmTransaction;
    typedData?: Record<string, unknown>;
    message?: string;
    requestedChainId?: string;
    original: WalletRequest;
    canonicalPayload: string;
}
interface AuthorityChange {
    type: "token-allowance" | "operator-approval" | "signature-authority" | "unknown";
    subject?: string;
    delegate?: string;
    amount?: string;
    unlimited?: boolean;
    deadline?: string;
    note: string;
}
interface TransactionIntent {
    action: "native-transfer" | "token-transfer" | "token-transfer-from" | "token-approval" | "operator-approval" | "typed-permit" | "contract-deployment" | "contract-call" | "message-signature" | "raw-signature" | "chain-switch" | "unknown";
    selector?: string;
    target?: string;
    recipient?: string;
    spender?: string;
    tokenAmount?: string;
    nativeValue?: string;
    authorityChanges: AuthorityChange[];
    summary: string;
    unknowns: string[];
}
interface RiskSignal {
    code: string;
    severity: RiskSeverity;
    category: RiskCategory;
    message: string;
    evidence?: string;
}
type RiskVector = Record<RiskCategory | "overall", number>;
interface SimulationEvidence {
    status: "success" | "revert" | "unavailable";
    source?: string;
    warnings?: string[];
    balanceDeltas?: Record<string, string>;
    allowanceChanges?: Array<{
        token?: string;
        spender?: string;
        before?: string;
        after?: string;
    }>;
}
interface AnalysisContext {
    origin?: string;
    chainId?: string;
    simulation?: SimulationEvidence;
    knownContract?: boolean;
    verifiedContract?: boolean;
    firstTimeRecipient?: boolean;
}
interface SafeSignPolicy {
    blockRawSignatures?: boolean;
    blockUnlimitedApprovals?: boolean;
    reviewUnknownContractCalls?: boolean;
    reviewFirstTimeRecipients?: boolean;
    allowedOrigins?: string[];
    allowedChainIds?: string[];
    deniedSelectors?: string[];
    maxNativeValueWei?: string;
}
interface PolicyEvaluation {
    signals: RiskSignal[];
    forcedDecision?: SafeSignDecision;
}
interface SafeSignAnalysis {
    version: "utxo-safesign/1";
    request: NormalizedRequest;
    intent: TransactionIntent;
    signals: RiskSignal[];
    risk: RiskVector;
    decision: SafeSignDecision;
    confidence: "high" | "medium" | "low";
    unknowns: string[];
    reviewedPayload: string;
}
/**
 * Stable integration contract for a human-facing SafeSign review.
 *
 * The review contains no signing capability. `reviewedPayload` is the
 * canonical binding that must be re-checked at the isolated signer boundary.
 */
interface SafeSignReview {
    version: "utxo-safesign-review/1";
    analysis: SafeSignAnalysis;
    human: {
        headline: string;
        summary: string;
        requiredAction: "MAY_PROCEED" | "CONFIRM_AFTER_REVIEW" | "DO_NOT_SIGN";
        reasons: Array<Pick<RiskSignal, "code" | "severity" | "category" | "message" | "evidence">>;
    };
    signer: {
        binding: "exact-canonical-payload";
        requiresExplicitUserAuthorization: true;
        mustRecheckBeforeSigning: true;
    };
}
interface ExecutionReceiptEvidence {
    status?: "success" | "revert" | "unknown";
    to?: string;
    input?: string;
    transactionHash?: string;
}
interface PostExecutionVerification {
    matchesReviewedPayload: boolean;
    receiptConsistent: boolean;
    issues: string[];
}

declare function canonicalize(value: unknown): string;
declare function canonicalWalletRequest(request: WalletRequest): string;
declare function payloadMatchesReviewed(reviewedCanonical: string, request: WalletRequest): boolean;

declare function normalizeWalletRequest(request: WalletRequest, context?: AnalysisContext): NormalizedRequest;

declare function inferIntent(request: NormalizedRequest): TransactionIntent;

declare function collectRiskSignals(request: NormalizedRequest, intent: TransactionIntent, context: AnalysisContext): RiskSignal[];
declare function scoreRisk(signals: RiskSignal[]): RiskVector;
declare function decisionFromSignals(signals: RiskSignal[], forced?: SafeSignDecision): SafeSignDecision;

declare function evaluatePolicy(request: NormalizedRequest, intent: TransactionIntent, policy?: SafeSignPolicy, context?: AnalysisContext): PolicyEvaluation;

declare function analyzeWalletRequest(input: WalletRequest, context?: AnalysisContext, policy?: SafeSignPolicy): SafeSignAnalysis;

/**
 * Produce a ready-to-render, deterministic review contract for a wallet UI,
 * dApp or automation. It is deliberately separate from signing: callers must
 * pass the original request through authorizeReviewedRequest immediately
 * before their isolated signer is invoked.
 */
declare function reviewWalletRequest(input: WalletRequest, context?: AnalysisContext, policy?: SafeSignPolicy): SafeSignReview;

declare function verifyPostExecution(analysis: SafeSignAnalysis, executionRequest: WalletRequest, receipt?: ExecutionReceiptEvidence, context?: AnalysisContext): PostExecutionVerification;
declare function reviewedPayloadFor(request: WalletRequest): string;

type UserAuthorization = "APPROVE" | "REJECT";
type ExecutionBoundaryStatus = "AUTHORIZED" | "USER_REJECTED" | "POLICY_BLOCKED" | "PAYLOAD_CHANGED";
interface ExecutionBoundaryResult {
    status: ExecutionBoundaryStatus;
    mayReachSigner: boolean;
    reason: string;
}
/**
 * Final deterministic gate between SafeSign review and a signer.
 *
 * This function never signs and never broadcasts. It only answers whether
 * an integration is permitted to hand the exact reviewed request to its
 * independently isolated signing boundary.
 */
declare function authorizeReviewedRequest(analysis: SafeSignAnalysis, currentRequest: WalletRequest, userAuthorization: UserAuthorization): ExecutionBoundaryResult;

export { type AnalysisContext, type AuthorityChange, type EvmTransaction, type ExecutionBoundaryResult, type ExecutionBoundaryStatus, type ExecutionReceiptEvidence, type NormalizedRequest, type PolicyEvaluation, type PostExecutionVerification, type RequestKind, type RiskCategory, type RiskSeverity, type RiskSignal, type RiskVector, type SafeSignAnalysis, type SafeSignDecision, type SafeSignPolicy, type SafeSignReview, type SimulationEvidence, type TransactionIntent, type UserAuthorization, type WalletRequest, analyzeWalletRequest, authorizeReviewedRequest, canonicalWalletRequest, canonicalize, collectRiskSignals, decisionFromSignals, evaluatePolicy, inferIntent, normalizeWalletRequest, payloadMatchesReviewed, reviewWalletRequest, reviewedPayloadFor, scoreRisk, verifyPostExecution };

