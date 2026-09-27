# VigiSwap

VigiSwap is an independent, non-custodial crypto swap interface for `vigiswap.com`.

## Ownership

VigiSwap is exclusively owned and operated by **UTXO Labs Team**.

## Product

- Next.js App Router.
- Swap-only interface with multi-chain routing.
- Real route comparison through the configured aggregation engines.
- EVM networks plus supported cross-chain/native Bitcoin routes.
- Non-custodial wallet flow: VigiSwap never asks for seed phrases or private keys.
- UTXO Safe Sign pre-signature review.
- 16 supported interface languages.
- Privacy, cookies, terms and risk pages.
- Cloudflare Pages deployment.
- Secure server-side provider gateways in `functions/`.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Validation before production:

```bash
npm run typecheck
npm test
npm run build
```

The production workflow in `.github/workflows/deploy.yml` deploys `main` to the existing Cloudflare Pages project after verification succeeds.
