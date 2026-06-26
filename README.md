# VigiSwap Starter

Starter ZIP para `vigiswap.com`: página de swap independiente, premium, moderna, cremosa y colorida, preparada para conectar con las APIs existentes de VestigeIndex.

## Incluye

- Next.js App Router.
- UI tipo swap-only inspirada en la simplicidad de Uniswap, pero no clonada.
- Fondo animado.
- Botones modernos.
- Selector de token/red.
- VIGIX como token nativo de plataforma.
- Motor marcado para buscar siempre la mejor ruta.
- 16 idiomas.
- Consentimiento de privacidad/cookies.
- Políticas legales.
- Logos de promotores: UTXO Labs, UTXOSuite.com, Idovio.
- Copyright 2026.
- Proxy seguro hacia VestigeIndex.

## VIGIX

- Polygon chain ID: `137`
- Contract: `0xea1989dDc9F7db000347F6Ac14C63fd395B6EDAd`
- Price source: weighted bonding curve contract.
- Modelo: VIGIX solo existe cuando se compra/mint y se elimina/burn cuando se vende.
- No se inventa precio, no se mete FOMO, no se prometen ganancias.

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Para Claude Code

Pega o usa `CLAUDE_CODE_PROMPT.md`.

La tarea principal de Claude Code será mapear los endpoints reales de VestigeIndex en:

```txt
src/lib/vestigeApiClient.ts
src/app/api/vestige/[...path]/route.ts
```

No debe inventar rutas, precios ni swaps.
