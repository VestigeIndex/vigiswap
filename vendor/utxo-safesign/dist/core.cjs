"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core.ts
var core_exports = {};
__export(core_exports, {
  analyzeWalletRequest: () => analyzeWalletRequest,
  authorizeReviewedRequest: () => authorizeReviewedRequest,
  canonicalWalletRequest: () => canonicalWalletRequest,
  canonicalize: () => canonicalize,
  collectRiskSignals: () => collectRiskSignals,
  decisionFromSignals: () => decisionFromSignals,
  evaluatePolicy: () => evaluatePolicy,
  inferIntent: () => inferIntent,
  normalizeWalletRequest: () => normalizeWalletRequest,
  payloadMatchesReviewed: () => payloadMatchesReviewed,
  reviewWalletRequest: () => reviewWalletRequest,
  reviewedPayloadFor: () => reviewedPayloadFor,
  scoreRisk: () => scoreRisk,
  verifyPostExecution: () => verifyPostExecution
});
module.exports = __toCommonJS(core_exports);

// ../../lib/security-core/canonical.ts
function normalizeForCanonical(value) {
  if (Array.isArray(value)) return value.map(normalizeForCanonical);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      const child = value[key];
      if (child !== void 0) out[key] = normalizeForCanonical(child);
    }
    return out;
  }
  return value;
}
function canonicalize(value) {
  return JSON.stringify(normalizeForCanonical(value));
}
function canonicalWalletRequest(request) {
  return canonicalize({ method: request.method, params: request.params ?? [] });
}
function payloadMatchesReviewed(reviewedCanonical, request) {
  return reviewedCanonical === canonicalWalletRequest(request);
}

// ../../lib/security-core/normalize.ts
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function asString(value) {
  return typeof value === "string" ? value : void 0;
}
function parseTypedData(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return void 0;
  try {
    const parsed = JSON.parse(value);
    return asRecord(parsed);
  } catch {
    return void 0;
  }
}
function extractTransaction(request) {
  const candidate = asRecord(request.params?.[0]);
  if (!candidate) return void 0;
  return {
    from: asString(candidate.from),
    to: asString(candidate.to),
    value: asString(candidate.value),
    data: asString(candidate.data),
    input: asString(candidate.input),
    gas: asString(candidate.gas),
    gasLimit: asString(candidate.gasLimit),
    chainId: asString(candidate.chainId),
    nonce: asString(candidate.nonce)
  };
}
function normalizeWalletRequest(request, context = {}) {
  const method = request.method;
  const base = {
    method,
    origin: context.origin,
    chainId: context.chainId,
    original: request,
    canonicalPayload: canonicalWalletRequest(request)
  };
  if (method === "eth_sendTransaction" || method === "eth_signTransaction") {
    return { ...base, kind: "transaction", transaction: extractTransaction(request) };
  }
  if (method === "eth_signTypedData" || method === "eth_signTypedData_v3" || method === "eth_signTypedData_v4") {
    const params = request.params ?? [];
    const typedData = parseTypedData(params[1] ?? params[0]);
    return { ...base, kind: "typed-data", typedData };
  }
  if (method === "personal_sign") {
    const params = request.params ?? [];
    return { ...base, kind: "message-signature", message: asString(params[0]) ?? asString(params[1]) };
  }
  if (method === "eth_sign") {
    const params = request.params ?? [];
    return { ...base, kind: "raw-signature", message: asString(params[1]) ?? asString(params[0]) };
  }
  if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") {
    const chain = asRecord(request.params?.[0]);
    return { ...base, kind: "chain-switch", requestedChainId: asString(chain?.chainId) };
  }
  return { ...base, kind: "unknown" };
}

// ../../lib/security-core/intent.ts
var MAX_UINT256 = (1n << 256n) - 1n;
var MAX_UINT160 = (1n << 160n) - 1n;
function cleanHex(value) {
  if (!value) return "";
  return value.toLowerCase().replace(/^0x/, "");
}
function selectorOf(data) {
  const hex = cleanHex(data);
  return hex.length >= 8 ? `0x${hex.slice(0, 8)}` : void 0;
}
function word(data, index) {
  const hex = cleanHex(data);
  const start = 8 + index * 64;
  const chunk = hex.slice(start, start + 64);
  return chunk.length === 64 ? chunk : void 0;
}
function wordAddress(data, index) {
  const value = word(data, index);
  return value ? `0x${value.slice(24)}` : void 0;
}
function wordUint(data, index) {
  const value = word(data, index);
  if (!value) return void 0;
  try {
    return BigInt(`0x${value}`);
  } catch {
    return void 0;
  }
}
function hexQuantity(value) {
  if (!value) return void 0;
  try {
    return BigInt(value);
  } catch {
    return void 0;
  }
}
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function scalarString(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  if (typeof value === "bigint") return value.toString();
  return void 0;
}
function scalarBigInt(value) {
  const text = scalarString(value);
  if (!text) return void 0;
  try {
    return BigInt(text);
  } catch {
    return void 0;
  }
}
function typedMessage(request) {
  return record(request.typedData?.message);
}
function inferIntent(request) {
  if (request.kind === "raw-signature") {
    return {
      action: "raw-signature",
      authorityChanges: [{ type: "signature-authority", note: "Raw eth_sign can authorize opaque data without structured domain context." }],
      summary: "Raw signature request",
      unknowns: request.message ? [] : ["Message payload could not be identified."]
    };
  }
  if (request.kind === "message-signature") {
    return {
      action: "message-signature",
      authorityChanges: [{ type: "signature-authority", note: "A message signature may be reusable outside the current page depending on its contents." }],
      summary: "Message signature request",
      unknowns: request.message ? [] : ["Message payload could not be identified."]
    };
  }
  if (request.kind === "chain-switch") {
    return {
      action: "chain-switch",
      authorityChanges: [],
      summary: request.requestedChainId ? `Switch or add chain ${request.requestedChainId}` : "Switch or add an unknown chain",
      unknowns: request.requestedChainId ? [] : ["Requested chain id is unavailable."]
    };
  }
  if (request.kind === "typed-data") {
    const primaryType = scalarString(request.typedData?.primaryType);
    const message = typedMessage(request);
    const details = record(message?.details);
    const spender = scalarString(message?.spender) ?? scalarString(details?.spender);
    const rawAmount = message?.value ?? message?.amount ?? details?.amount;
    const amount = scalarString(rawAmount);
    const amountBigInt = scalarBigInt(rawAmount);
    const deadline = scalarString(message?.deadline) ?? scalarString(message?.expiration) ?? scalarString(details?.expiration);
    const looksLikePermit = Boolean(primaryType && /permit/i.test(primaryType));
    const unlimited = looksLikePermit && amountBigInt !== void 0 && (amountBigInt === MAX_UINT256 || amountBigInt === MAX_UINT160);
    return {
      action: looksLikePermit ? "typed-permit" : "message-signature",
      spender,
      tokenAmount: amount,
      authorityChanges: looksLikePermit ? [{
        type: "token-allowance",
        delegate: spender,
        amount,
        deadline,
        unlimited,
        note: unlimited ? "Typed-data permit grants effectively unlimited token spending authority." : "Typed-data permit may grant token spending authority without an on-chain approve transaction."
      }] : [{ type: "signature-authority", note: "Typed structured data is being authorized." }],
      summary: looksLikePermit ? `${unlimited ? "Unlimited " : ""}typed permit${spender ? ` for ${spender}` : ""}` : `Typed-data signature${primaryType ? ` (${primaryType})` : ""}`,
      unknowns: request.typedData ? [] : ["Typed-data payload could not be parsed."]
    };
  }
  if (request.kind !== "transaction" || !request.transaction) {
    return { action: "unknown", authorityChanges: [], summary: `Unsupported wallet request: ${request.method}`, unknowns: ["No supported intent decoder is available for this request."] };
  }
  const tx = request.transaction;
  const data = tx.data ?? tx.input;
  const selector = selectorOf(data);
  const value = hexQuantity(tx.value);
  if (!tx.to) {
    return {
      action: "contract-deployment",
      selector,
      nativeValue: tx.value,
      authorityChanges: [],
      summary: "Contract deployment",
      unknowns: ["Future contract behavior cannot be established from the wallet request alone."]
    };
  }
  if ((!data || cleanHex(data).length === 0) && (value ?? 0n) > 0n) {
    return {
      action: "native-transfer",
      target: tx.to,
      recipient: tx.to,
      nativeValue: tx.value,
      authorityChanges: [],
      summary: `Native asset transfer to ${tx.to}`,
      unknowns: []
    };
  }
  if (selector === "0x095ea7b3") {
    const spender = wordAddress(data, 0);
    const amount = wordUint(data, 1);
    const unlimited = amount === MAX_UINT256;
    return {
      action: "token-approval",
      selector,
      target: tx.to,
      spender,
      tokenAmount: amount?.toString(),
      authorityChanges: [{ type: "token-allowance", subject: tx.to, delegate: spender, amount: amount?.toString(), unlimited, note: unlimited ? "ERC-20 unlimited allowance." : "ERC-20 spending allowance." }],
      summary: `${unlimited ? "Unlimited" : "Token"} approval${spender ? ` for ${spender}` : ""}`,
      unknowns: spender && amount !== void 0 ? [] : ["Approval arguments could not be fully decoded."]
    };
  }
  if (selector === "0x39509351") {
    const spender = wordAddress(data, 0);
    const amount = wordUint(data, 1);
    return {
      action: "token-approval",
      selector,
      target: tx.to,
      spender,
      tokenAmount: amount?.toString(),
      authorityChanges: [{
        type: "token-allowance",
        subject: tx.to,
        delegate: spender,
        amount: amount?.toString(),
        // The current allowance is external evidence; the decoder must not
        // pretend that an increment reveals the resulting total authority.
        note: "ERC-20 spending allowance increase; the resulting allowance requires host-supplied chain evidence."
      }],
      summary: `Increase token approval${spender ? ` for ${spender}` : ""}`,
      unknowns: spender && amount !== void 0 ? ["The final allowance after this increase is not present in the wallet request."] : ["Allowance-increase arguments could not be fully decoded."]
    };
  }
  if (selector === "0xa22cb465") {
    const operator = wordAddress(data, 0);
    const enabled = wordUint(data, 1) === 1n;
    return {
      action: "operator-approval",
      selector,
      target: tx.to,
      spender: operator,
      authorityChanges: enabled ? [{ type: "operator-approval", subject: tx.to, delegate: operator, unlimited: true, note: "setApprovalForAll grants collection-wide operator authority." }] : [],
      summary: `${enabled ? "Grant" : "Revoke"} collection-wide operator approval${operator ? ` for ${operator}` : ""}`,
      unknowns: operator ? [] : ["Operator address could not be decoded."]
    };
  }
  if (selector === "0xa9059cbb") {
    const recipient = wordAddress(data, 0);
    const amount = wordUint(data, 1);
    return {
      action: "token-transfer",
      selector,
      target: tx.to,
      recipient,
      tokenAmount: amount?.toString(),
      authorityChanges: [],
      summary: `Token transfer${recipient ? ` to ${recipient}` : ""}`,
      unknowns: recipient && amount !== void 0 ? [] : ["Transfer arguments could not be fully decoded."]
    };
  }
  if (selector === "0x23b872dd") {
    const recipient = wordAddress(data, 1);
    const amount = wordUint(data, 2);
    return {
      action: "token-transfer-from",
      selector,
      target: tx.to,
      recipient,
      tokenAmount: amount?.toString(),
      authorityChanges: [],
      summary: `Transfer tokens using an existing allowance${recipient ? ` to ${recipient}` : ""}`,
      unknowns: recipient && amount !== void 0 ? [] : ["transferFrom arguments could not be fully decoded."]
    };
  }
  return {
    action: "contract-call",
    selector,
    target: tx.to,
    nativeValue: tx.value,
    authorityChanges: [],
    summary: selector ? `Contract call ${selector} to ${tx.to}` : `Contract interaction with ${tx.to}`,
    unknowns: ["Contract method is not in the local minimal decoder set."]
  };
}

// ../../lib/security-core/risk.ts
var severityScore = { info: 5, low: 20, medium: 45, high: 75, critical: 100 };
var categories = ["origin", "contract", "permission", "asset", "execution", "behavioral", "simulation", "network"];
function collectRiskSignals(request, intent, context) {
  const signals = [];
  if (!request.origin) signals.push({ code: "ORIGIN_UNKNOWN", severity: "medium", category: "origin", message: "Request origin is unavailable; the requesting application cannot be bound to the review." });
  if (request.kind === "raw-signature") signals.push({ code: "RAW_ETH_SIGN", severity: "critical", category: "permission", message: "Raw eth_sign request lacks typed domain separation and can authorize opaque data." });
  if (intent.action === "token-approval") {
    const unlimited = intent.authorityChanges.some((change) => change.unlimited);
    signals.push({ code: unlimited ? "UNLIMITED_ALLOWANCE" : "TOKEN_ALLOWANCE", severity: unlimited ? "high" : "medium", category: "permission", message: unlimited ? "This request grants effectively unlimited token spending authority." : "This request grants token spending authority to another address.", evidence: intent.spender });
  }
  if (intent.action === "operator-approval" && intent.authorityChanges.length > 0) {
    signals.push({ code: "OPERATOR_APPROVAL_ALL", severity: "high", category: "permission", message: "Collection-wide operator authority is being granted.", evidence: intent.spender });
  }
  if (intent.action === "typed-permit") {
    const unlimited = intent.authorityChanges.some((change) => change.unlimited);
    signals.push({
      code: unlimited ? "UNLIMITED_TYPED_PERMIT" : "TYPED_PERMIT",
      severity: unlimited ? "high" : "medium",
      category: "permission",
      message: unlimited ? "Typed permit grants effectively unlimited token spending authority without a separate approve transaction." : "Typed permit can create token spending authority without a separate approve transaction.",
      evidence: intent.spender
    });
  }
  if (intent.action === "contract-deployment") signals.push({ code: "CONTRACT_DEPLOYMENT", severity: "high", category: "execution", message: "Contract deployment is irreversible and future behavior is not established by this request alone." });
  if (intent.action === "contract-call" && context.knownContract === false) {
    signals.push({ code: "UNKNOWN_CONTRACT", severity: "high", category: "contract", message: "The destination contract is not known in the supplied local context.", evidence: intent.target });
  } else if (intent.action === "contract-call" && context.verifiedContract === false) {
    signals.push({ code: "UNVERIFIED_CONTRACT", severity: "medium", category: "contract", message: "The supplied context does not identify the destination contract as verified.", evidence: intent.target });
  }
  if (intent.action === "contract-call" && intent.unknowns.length > 0) signals.push({ code: "METHOD_UNRESOLVED", severity: "medium", category: "execution", message: "The local decoder cannot resolve the contract method; review remains incomplete.", evidence: intent.selector });
  if (context.chainId && request.transaction?.chainId && context.chainId.toLowerCase() !== request.transaction.chainId.toLowerCase()) signals.push({ code: "CHAIN_MISMATCH", severity: "high", category: "network", message: "Transaction chainId differs from the active analysis context.", evidence: `${request.transaction.chainId} != ${context.chainId}` });
  if (context.firstTimeRecipient && (intent.recipient || intent.target)) signals.push({ code: "FIRST_TIME_RECIPIENT", severity: "medium", category: "behavioral", message: "Destination is marked as first-time in the supplied context.", evidence: intent.recipient ?? intent.target });
  if (context.simulation?.status === "revert") signals.push({ code: "SIMULATION_REVERT", severity: "high", category: "simulation", message: "The supplied simulation evidence predicts a revert." });
  for (const warning of context.simulation?.warnings ?? []) signals.push({ code: "SIMULATION_WARNING", severity: "medium", category: "simulation", message: warning });
  return signals;
}
function scoreRisk(signals) {
  const vector = Object.fromEntries(categories.map((category) => [category, 0]));
  for (const signal of signals) vector[signal.category] = Math.max(vector[signal.category], severityScore[signal.severity]);
  const overall = Math.max(0, ...categories.map((category) => vector[category]));
  return { ...vector, overall };
}
function decisionFromSignals(signals, forced) {
  if (forced) return forced;
  if (signals.some((signal) => signal.severity === "critical")) return "BLOCK";
  if (signals.some((signal) => signal.severity === "high")) return "REVIEW";
  if (signals.some((signal) => signal.severity === "medium")) return "WARN";
  return "ALLOW";
}

// ../../lib/security-core/policy.ts
function lowerSet(values) {
  return new Set((values ?? []).map((value) => value.toLowerCase()));
}
function parseQuantity(value) {
  if (!value) return void 0;
  try {
    return BigInt(value);
  } catch {
    return void 0;
  }
}
function evaluatePolicy(request, intent, policy = {}, context = {}) {
  const signals = [];
  let forcedDecision;
  const rejectByPolicy = (signal) => {
    signals.push(signal);
    forcedDecision = "BLOCK";
  };
  if (policy.blockRawSignatures && request.kind === "raw-signature") {
    rejectByPolicy({ code: "POLICY_RAW_SIGNATURE", severity: "critical", category: "permission", message: "Local policy rejects raw eth_sign requests." });
  }
  if (policy.blockUnlimitedApprovals && intent.authorityChanges.some((change) => change.unlimited)) {
    rejectByPolicy({ code: "POLICY_UNLIMITED_APPROVAL", severity: "critical", category: "permission", message: "Local policy rejects unlimited approvals." });
  }
  const origins = lowerSet(policy.allowedOrigins);
  if (origins.size > 0 && (!request.origin || !origins.has(request.origin.toLowerCase()))) {
    rejectByPolicy({ code: "POLICY_ORIGIN", severity: "critical", category: "origin", message: "Request origin is outside the local allowlist.", evidence: request.origin });
  }
  const chains = lowerSet(policy.allowedChainIds);
  const effectiveChain = request.transaction?.chainId ?? request.chainId ?? request.requestedChainId;
  if (chains.size > 0 && (!effectiveChain || !chains.has(effectiveChain.toLowerCase()))) {
    rejectByPolicy({ code: "POLICY_CHAIN", severity: "critical", category: "network", message: "Requested chain is outside the local allowlist.", evidence: effectiveChain });
  }
  const deniedSelectors = lowerSet(policy.deniedSelectors);
  if (intent.selector && deniedSelectors.has(intent.selector.toLowerCase())) {
    rejectByPolicy({ code: "POLICY_SELECTOR", severity: "critical", category: "execution", message: "Contract method selector is explicitly denied by local policy.", evidence: intent.selector });
  }
  if (policy.maxNativeValueWei) {
    const max = parseQuantity(policy.maxNativeValueWei);
    const actual = parseQuantity(request.transaction?.value);
    if (max !== void 0 && actual !== void 0 && actual > max) {
      rejectByPolicy({ code: "POLICY_VALUE_LIMIT", severity: "critical", category: "asset", message: "Native transfer value exceeds the configured local limit.", evidence: actual.toString() });
    }
  }
  if (policy.reviewUnknownContractCalls && intent.action === "contract-call" && !forcedDecision) {
    signals.push({ code: "POLICY_REVIEW_CONTRACT", severity: "high", category: "contract", message: "Local policy requires review for unresolved contract calls." });
    forcedDecision = "REVIEW";
  }
  if (policy.reviewFirstTimeRecipients && context.firstTimeRecipient === true && !forcedDecision && (intent.action === "native-transfer" || intent.action === "token-transfer")) {
    signals.push({ code: "POLICY_FIRST_RECIPIENT", severity: "medium", category: "behavioral", message: "Local policy requires additional review for a destination identified by the integration as first-time." });
    forcedDecision = "REVIEW";
  }
  return { signals, forcedDecision };
}

// ../../lib/security-core/analyze.ts
var decisionRank = { ALLOW: 0, WARN: 1, REVIEW: 2, BLOCK: 3 };
function strongestDecision(a, b) {
  if (!b) return a;
  return decisionRank[b] > decisionRank[a] ? b : a;
}
function analyzeWalletRequest(input, context = {}, policy = {}) {
  const request = normalizeWalletRequest(input, context);
  const intent = inferIntent(request);
  const policyEvaluation = evaluatePolicy(request, intent, policy, context);
  const signals = [...collectRiskSignals(request, intent, context), ...policyEvaluation.signals];
  const riskDecision = decisionFromSignals(signals);
  const decision = strongestDecision(riskDecision, policyEvaluation.forcedDecision);
  const unknowns = [...new Set(intent.unknowns)];
  let confidence = "high";
  if (request.kind === "unknown" || unknowns.length >= 2) confidence = "low";
  else if (unknowns.length > 0 || !request.origin) confidence = "medium";
  return {
    version: "utxo-safesign/1",
    request,
    intent,
    signals,
    risk: scoreRisk(signals),
    decision,
    confidence,
    unknowns,
    reviewedPayload: request.canonicalPayload
  };
}

// ../../lib/security-core/review.ts
function actionFor(analysis) {
  if (analysis.decision === "BLOCK") return "DO_NOT_SIGN";
  if (analysis.decision === "WARN" || analysis.decision === "REVIEW") return "CONFIRM_AFTER_REVIEW";
  return "MAY_PROCEED";
}
function headlineFor(analysis) {
  switch (analysis.decision) {
    case "BLOCK":
      return "SafeSign blocked this wallet request";
    case "REVIEW":
      return "SafeSign requires an explicit review";
    case "WARN":
      return "SafeSign found conditions to confirm";
    default:
      return "SafeSign found no escalation condition";
  }
}
function summaryFor(analysis) {
  const escalation = actionFor(analysis);
  const base = analysis.intent.summary || "Wallet request";
  if (escalation === "DO_NOT_SIGN") return `${base}. This request must not reach a signer under the active SafeSign decision.`;
  if (escalation === "CONFIRM_AFTER_REVIEW") return `${base}. Present the decoded intent and listed evidence before asking for explicit authorization.`;
  return `${base}. Explicit user authorization and an exact payload re-check are still required before signing.`;
}
function reviewWalletRequest(input, context = {}, policy = {}) {
  const analysis = analyzeWalletRequest(input, context, policy);
  return {
    version: "utxo-safesign-review/1",
    analysis,
    human: {
      headline: headlineFor(analysis),
      summary: summaryFor(analysis),
      requiredAction: actionFor(analysis),
      reasons: analysis.signals.map(({ code, severity, category, message, evidence }) => ({ code, severity, category, message, evidence }))
    },
    signer: {
      binding: "exact-canonical-payload",
      requiresExplicitUserAuthorization: true,
      mustRecheckBeforeSigning: true
    }
  };
}

// ../../lib/security-core/receipt.ts
function lower(value) {
  return value?.toLowerCase();
}
function verifyPostExecution(analysis, executionRequest, receipt = {}, context = {}) {
  const issues = [];
  const matchesReviewedPayload = payloadMatchesReviewed(analysis.reviewedPayload, executionRequest);
  if (!matchesReviewedPayload) {
    issues.push("The execution request does not match the payload that was reviewed by SafeSign.");
  }
  const reviewedTx = analysis.request.transaction;
  if (reviewedTx?.to && receipt.to && lower(reviewedTx.to) !== lower(receipt.to)) {
    issues.push("Receipt destination differs from the reviewed transaction destination.");
  }
  const reviewedInput = reviewedTx?.data ?? reviewedTx?.input;
  if (reviewedInput && receipt.input && lower(reviewedInput) !== lower(receipt.input)) {
    issues.push("Receipt input differs from the reviewed transaction calldata.");
  }
  if (context.simulation?.status === "success" && receipt.status === "revert") {
    issues.push("Actual execution reverted although the supplied pre-signature simulation reported success.");
  }
  if (context.simulation?.status === "revert" && receipt.status === "success") {
    issues.push("Actual execution succeeded although the supplied pre-signature simulation reported a revert.");
  }
  return {
    matchesReviewedPayload,
    receiptConsistent: issues.filter((issue) => !issue.startsWith("The execution request")).length === 0,
    issues
  };
}
function reviewedPayloadFor(request) {
  return canonicalWalletRequest(request);
}

// ../../lib/execution-boundary/index.ts
function authorizeReviewedRequest(analysis, currentRequest, userAuthorization) {
  if (userAuthorization !== "APPROVE") {
    return { status: "USER_REJECTED", mayReachSigner: false, reason: "The user did not explicitly authorize execution." };
  }
  if (analysis.decision === "BLOCK") {
    return { status: "POLICY_BLOCKED", mayReachSigner: false, reason: "SafeSign produced a blocking decision; the request must not reach the signer." };
  }
  if (!payloadMatchesReviewed(analysis.reviewedPayload, currentRequest)) {
    return { status: "PAYLOAD_CHANGED", mayReachSigner: false, reason: "The request changed after review; a new SafeSign analysis is required." };
  }
  return {
    status: "AUTHORIZED",
    mayReachSigner: true,
    reason: analysis.decision === "REVIEW" || analysis.decision === "WARN" ? "The user explicitly authorized the exact reviewed request after SafeSign escalation." : "The user explicitly authorized the exact reviewed request."
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyzeWalletRequest,
  authorizeReviewedRequest,
  canonicalWalletRequest,
  canonicalize,
  collectRiskSignals,
  decisionFromSignals,
  evaluatePolicy,
  inferIntent,
  normalizeWalletRequest,
  payloadMatchesReviewed,
  reviewWalletRequest,
  reviewedPayloadFor,
  scoreRisk,
  verifyPostExecution
});

