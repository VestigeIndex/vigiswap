# VigiSwap engineering brief

Work on VigiSwap as an independent swap-only product.

## Ownership

VigiSwap is exclusively owned and operated by **UTXO Labs Team**. Do not add ownership, copyright, publisher, operator or promoter attribution to any other company, project or organization.

## Product constraints

- Keep VigiSwap non-custodial.
- Never request, collect or store seed phrases or private keys.
- Use real quotes, routes and executable transactions from configured providers.
- Never fake liquidity, prices, swaps or transaction success.
- Keep the existing route-verification and UTXO Safe Sign signer gate.
- Keep secrets server-side.
- Preserve all supported UI languages.
- Keep Privacy, Cookies, Terms, Risk and consent surfaces.
- Official domain: `vigiswap.com`.

## Integration

VigiSwap may consume VestigeIndex routing/API infrastructure where the code already depends on it. That technical integration does not imply ownership or corporate attribution.

## Acceptance criteria

- `npm run typecheck` passes.
- `npm test` passes.
- `npm run build` passes.
- Token/network selection works.
- Wallet connection and route review remain functional.
- No secrets are shipped to the client.
- Footer, legal copy and metadata identify **UTXO Labs Team** as the sole owner/operator of VigiSwap.
