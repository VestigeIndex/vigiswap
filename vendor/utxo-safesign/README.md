# @utxo/safesign

> Local-first transaction-security SDK for crypto wallet requests.
> Pure functions. No keys, no I/O and no signing capability.

The same kernel that powers the [UTXO Guard browser extension](https://www.utxosuite.com/guard),
extracted as a tiny library you can drop into any web app, server, or wallet
SDK to explain wallet requests **before** they reach the user's signing popup.

```bash
npm install @utxo/safesign
```

## Recommended integration: review, consent, gate, sign

New wallet and dApp integrations should use the unified API at
`@utxo/safesign/core`. It creates a deterministic review contract from an
EIP-1193 request, then enforces the exact reviewed payload immediately before
an independently isolated signer is called.

```ts
import {
  authorizeReviewedRequest,
  reviewWalletRequest,
  type WalletRequest,
} from "@utxo/safesign/core";

const request: WalletRequest = {
  method: "eth_sendTransaction",
  params: [{ to: tokenAddress, chainId: "0x1", data: "0x095ea7b3..." }],
};

const review = reviewWalletRequest(
  request,
  {
    origin: window.location.origin,
    chainId: "0x1",
    knownContract: true,
    verifiedContract: true,
    // Simulation is host-supplied evidence. SafeSign never invents it.
    simulation: { status: "success", source: "your-rpc-simulator" },
  },
  {
    blockRawSignatures: true,
    blockUnlimitedApprovals: true,
    reviewUnknownContractCalls: true,
  },
);

// Render the explanation and evidence in your own UI.
if (review.human.requiredAction === "DO_NOT_SIGN") {
  showBlockedRequest(review.human);
  return;
}

const userAuthorization = await askForExplicitApproval(review.human);

// Call this immediately before the isolated signer. It denies a BLOCK,
// user rejection and every mutation after the review was produced.
const gate = authorizeReviewedRequest(review.analysis, request, userAuthorization);
if (!gate.mayReachSigner) return showDeniedRequest(gate.reason);

return isolatedSigner.sign(request);
```

`reviewWalletRequest()` returns three deliberately separate concerns:

| Field | Purpose |
| --- | --- |
| `analysis` | Normalized request, decoded intent, evidence, risk vector and canonical reviewed payload. |
| `human` | A stable headline, summary, required action and render-ready evidence. |
| `signer` | The integration invariant: exact payload binding, explicit authorization and a final re-check. |

`ALLOW` still requires explicit authorization. `WARN` and `REVIEW` require
the evidence to be shown before authorization. `BLOCK` must not reach a
signer; approval cannot override it. The canonical re-check means a changed
destination, calldata, amount, chain or parameter ordering requires a new
review.

## Security model and limits

- SafeSign never receives seed phrases or private keys.
- It never fetches reputation, simulation, balances or contract data silently.
- Contract status, recipient history and simulations are host-supplied evidence;
  integrations must label their source and freshness honestly.
- It explains and gates the request path, but cannot prove a contract benign or
  protect an integration that bypasses its signer boundary.
- Invoke `authorizeReviewedRequest()` at the real signer boundary, not only in
  the UI.

## Legacy Guard utilities

```ts
import {
  analyzeDomain,
  decodeCallData,
  analyzeCall,
  analyzeTypedData,
  scoreReport,
} from "@utxo/safesign";

// 1. Domain reputation (typosquat, phishing patterns, etc.)
const dr = analyzeDomain(window.location.hostname);
if (dr.level === "critical") {
  showBanner(dr.signals); // 50+ curated legit domains, Levenshtein typosquat
}

// 2. Decode a pending eth_sendTransaction
const call = decodeCallData(tx.data);
// → { kind: "erc20_approve", spender: "0x…", amount: 2n**256n - 1n, unlimited: true }

// 3. Score it
const signals = analyzeCall(call!);
const report = scoreReport(signals);
// → { level: "critical", score: 80, signals: [{ code: "APPROVE_UNLIMITED", … }] }

// 4. EIP-712 typed-data signatures (Permit, Permit2, etc.)
const typed = analyzeTypedData(payload);
if (typed?.isUnlimitedPermit) blockOrWarn();
```

## What it detects

| Code                  | Level    | What                                          |
|----------------------|----------|-----------------------------------------------|
| `PHISH_PATTERN`       | critical | Hard-block regex matches (metamask-verify.*, …) |
| `TYPOSQUAT`           | critical | Levenshtein distance ≤ 2 from a curated legit domain |
| `APPROVE_UNLIMITED`   | critical | ERC-20 approve(spender, ≥ 2^160)              |
| `NFT_APPROVE_ALL`     | critical | setApprovalForAll(operator, true)             |
| `PERMIT_UNLIMITED`    | critical | EIP-2612 Permit with value ≥ 2^160            |
| `RAW_SIGN`            | critical | eth_sign request                              |
| `PUNYCODE`            | high     | IDN / punycode domain                         |
| `HTTP`                | high     | Page is not HTTPS                             |
| `PERMIT`              | medium   | Bounded Permit signature                      |
| `TYPED_DATA`          | medium   | EIP-712 structured signature                  |
| `APPROVE`             | medium   | Bounded ERC-20 approval                       |
| `NFT_REVOKE`          | safe     | setApprovalForAll(false)                      |
| `APPROVE_ZERO`        | safe     | Revoke approval (approve to 0)                |
| `TLD`                 | low      | Uncommon TLD (.click .top .xyz .monster …)    |
| `DEEP_SUBDOMAIN`      | low      | Nested subdomains hiding the registered owner |
| `NUMERIC`             | low      | Long numeric sequence in domain               |
| `TRANSFER`            | low      | Plain ERC-20 transfer                         |
| `CONNECT`             | low      | eth_requestAccounts                           |
| `CHAIN`               | low      | wallet_switchEthereumChain                    |
| `UNKNOWN_METHOD`      | medium   | Unknown ABI selector                          |

## What it does not do

- Does NOT touch keys, seed phrases or wallet internals
- Does NOT sign, broadcast or silently intercept requests
- Does NOT phone home; analysis is fully local
- Does NOT replace your wallet — it sits in front of it

## API

```ts
analyzeDomain(domain: string): RiskReport
decodeCallData(hex: string): DecodedCall | null
analyzeCall(call: DecodedCall): RiskSignal[]
analyzeTypedData(payload: unknown): TypedDataSummary | null
scoreReport(signals: RiskSignal[]): RiskReport
reviewWalletRequest(request, context?, policy?): SafeSignReview
authorizeReviewedRequest(analysis, currentRequest, userAuthorization): ExecutionBoundaryResult
```

The root import keeps these Guard-compatible utilities for existing consumers.
Use `@utxo/safesign/core` for new wallet and dApp integrations because it adds
reviewed-payload integrity and the explicit signer boundary.

## Tests

```bash
cd apps/safesign-sdk
npm install
npm test
```

Vitest covers the Guard detectors, unified EVM request analysis, policy gates,
reviewed-payload mutation detection and the isolated signing boundary.

## License

MIT

