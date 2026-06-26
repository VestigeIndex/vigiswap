# VigiSwap ↔ VestigeIndex integration map

Internal technical summary (Phase 2). VigiSwap reuses VestigeIndex's real backend; it does
NOT reimplement routing, fees or pricing.

## VestigeIndex backend (real, verified)

VestigeIndex is a Next.js **static export** on Cloudflare Pages. Its API is served by
**Cloudflare Pages Functions** under `functions/api/*`, reachable at
`https://www.vestigeindex.com/api/*`. Keys (LI.FI, 1inch, Jupiter, 0x) are injected
**server-side** inside those functions — never exposed to the browser.

> Use `https://www.vestigeindex.com/api` (WWW) as `VESTIGE_API_BASE`. The apex
> `vestigeindex.com` 301-redirects to www; a 301 on a POST can drop the body.

### Endpoints that exist (real)

| Purpose            | Endpoint (relative to /api)        | Method | Upstream            | Status |
|--------------------|------------------------------------|--------|---------------------|--------|
| EVM route engine   | `/lifi/routes`                     | POST   | li.quest advanced/routes | ✅ live (CORS *) |
| EVM token lists    | `/lifi/tokens?chains=...`          | GET    | li.quest /v1/tokens | ✅ live |
| EVM same-chain quote | `/1inch/quote`                   | GET    | 1inch               | ✅ |
| EVM swap tx build  | `/1inch/swap`                      | GET    | 1inch               | ✅ |
| EVM token approval spender | `/1inch/spender`           | GET    | 1inch               | ✅ |
| EVM 1inch tokens   | `/1inch/tokens`                    | GET    | 1inch               | ✅ |
| Solana quote/swap  | `/jupiter/quote` `/jupiter/swap` `/jupiter/status` | GET/POST | Jupiter | ✅ (out of VigiSwap EVM scope) |
| BTC native routes  | `/thorchain/quote` `/maya/quote` `/thorchain/inbound` `/thorchain/actions` | GET | THORChain/Maya | ✅ (out of scope) |
| Token meta (velora)| `/velora/tokens`                   | GET    | Velora              | ✅ |

### What VigiSwap uses (EVM swap-only)

- **Quote / best route** → `POST /api/vestige/lifi/routes` (LI.FI `advanced/routes`).
  Returns multiple real route candidates with `toAmount`, `toAmountUSD`, `gasCostUSD`,
  `steps[]` (incl. `estimate.feeCosts`, `transactionRequest`). This IS the best-route engine.
- **Token list** → `GET /api/vestige/lifi/tokens?chains=<id>`.
- **Swap transaction** → taken from the chosen LI.FI route's `steps[].transactionRequest`
  (no separate build call needed for single-step routes); for multi-step, follow LI.FI step tx.
- **Approval** → standard ERC-20 `approve` to the route step's `approvalAddress` (from LI.FI step
  `estimate.approvalAddress`). Detected by reading `allowance` on-chain (viem).

### What is MISSING / not a single server endpoint

- VestigeIndex's **cross-aggregator "best of LI.FI vs 1inch vs Velora" comparison and the
  fee policy ("only charge fee if the route still improves the user") run CLIENT-SIDE** in
  VestigeIndex (`src/lib/*`, swap widgets) — there is no single server endpoint that returns
  "the final best route + fee applied". VigiSwap therefore uses LI.FI `advanced/routes`
  (already a multi-DEX aggregator that returns the best ordering) as its real source, and
  applies the same fee rule client-side via `bestRoute.ts`. TODO: if VestigeIndex later
  exposes a unified `/api/route` endpoint, switch `getVestigeQuote` to it.
- **VIGIX price**: read on-chain from the contract bonding curve (`priceAt`/`USDC`) on Polygon
  (`src/lib/vigix.ts` ABI) — never from CoinGecko/CMC. (Wiring pending — Phase 5.)
- No `transaction status` server endpoint — use the wallet provider + chain explorer (viem
  `waitForTransactionReceipt`).

### Must NOT touch (VestigeIndex)

`functions/api/*`, `src/lib/walletService.ts`, `src/lib/reownAppKit.ts`, swap widgets, fee
constants (`src/lib/constants.ts`), routing logic. VigiSwap only *consumes* these via HTTP.

## Fee policy (unchanged, mirrored)

VestigeIndex routed-EVM fee = `ROUTED_EVM_FEE_BPS = 5` (0.05%), applied via the LI.FI
integrator config server-side. VigiSwap does not add its own fee on top and does not hide it;
`bestRoute.ts` ranks by net output so a route is only "best" if it still improves the user.

## Env (see `.env.example`)

`VESTIGE_API_BASE=https://www.vestigeindex.com/api` · `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` ·
VIGIX (chain 137, `0xea1989dDc9F7db000347F6Ac14C63fd395B6EDAd`).
