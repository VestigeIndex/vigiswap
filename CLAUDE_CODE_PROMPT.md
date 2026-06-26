# Prompt Maestro para Claude Code — VigiSwap

Actúa como senior full-stack engineer, product designer y security engineer.

## Misión

Configura `vigiswap.com` como producto independiente tipo swap-only, inspirado en la simplicidad de Uniswap pero con diseño propio, más premium, cremoso, colorido y moderno.

## Separación

- `vestigeindex.com`: institucional, financiero, dashboard, herramientas, terminal DeFi.
- `vigiswap.com`: solo swap, sin ruido.

No rompas VestigeIndex. Reutiliza sus APIs reales a través del proxy/adaptador ya preparado.

## Lo que ya trae este starter

- UI moderna con fondo animado.
- Botones premium.
- Swap card.
- Selectores de red/token.
- Logos/fallbacks precargados.
- Logos de promotores: UTXO Labs, UTXOSuite.com, Idovio.
- Copyright 2026.
- VIGIX integrado como token nativo de plataforma.
- 16 idiomas preparados.
- Consentimiento y páginas legales.
- Headers de seguridad.
- Proxy `/api/vestige/[...path]`.

## APIs que debes mapear desde VestigeIndex

Localiza en VestigeIndex los endpoints reales para:

- chains
- token list
- quote
- route candidates
- approval
- build transaction
- transaction status
- fee policy
- VIGIX curve price, buy and sell if ya existen

Conecta `src/lib/vestigeApiClient.ts` al contrato/API real. No inventes rutas ni precios.

## Regla de mejor ruta

VigiSwap siempre debe buscar la mejor ruta:

1. Pedir candidatos reales al routing engine de VestigeIndex.
2. Comparar resultado neto cuando la API lo proporcione.
3. Mostrar "Best route".
4. Aplicar fee únicamente según la política real de Vestige/VigiSwap.
5. Si no hay quote, mostrar error honesto.

No fake swap. No fake success. No fake liquidity.

## VIGIX

Datos incluidos:

- Chain: Polygon
- Chain ID: 137
- Contract: `0xea1989dDc9F7db000347F6Ac14C63fd395B6EDAd`
- Symbol: VIGIX
- Price source: weighted bonding curve contract

Copy permitido:
"VIGIX uses a weighted bonding curve. It only exists when bought and is removed when sold."

Copy prohibido:
- Promesas de beneficio.
- FOMO.
- APY inventado.
- Precio inventado.
- Claims de inversión garantizada.

## Diseño

Mantén estética:
- Cremosa.
- Colorida.
- Premium.
- Moderna.
- Fondo animado.
- Botones glossy.
- Microinteracciones suaves.
- Mobile-first.
- Mejor que Uniswap sin copiar UI exacta, textos ni branding.

## Legal

Mantén:
- Privacy.
- Cookies.
- Terms.
- Risk.
- Consent banner.
- Advertencia de seed phrase.
- Dominio oficial vigiswap.com.

## Acceptance criteria

- `npm run build` pasa.
- VigiSwap renderiza en mobile y desktop.
- Selección token/red funciona.
- VIGIX aparece en Polygon.
- Promotores aparecen abajo.
- Footer: © 2026 VigiSwap · UTXO Labs.
- Proxy Vestige preparado.
- La UI no rompe VestigeIndex.
- No secretos en cliente.
