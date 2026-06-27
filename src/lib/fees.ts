// Fee configuration mirrored EXACTLY from VestigeIndex (src/lib/constants.ts) so VigiSwap
// collects the same platform fee, to the same wallets, in the same format. The EVM fee is
// applied through LI.FI's partner-fee mechanism (integrator + referrer + fee fraction); the
// integrator "Vestige-Index" is the one registered with LI.FI's fee system, so fees accrue
// to the configured wallet just like on vestigeindex.com.

// Where EVM swap fees are sent (LI.FI partner-fee referrer / fee wallet).
export const EVM_FEE_ADDRESS = "0xa1131edb7a6d5e816bf8548078a88a6bf3d91c7f";
// Native BTC / THORChain fee collection address (used by the BTC cross-chain engine).
export const BTC_FEE_ADDRESS = "bc1qlv9cvcfm4m09uzw725e82xuudv6q3zpxqw9x7n";

export const LIFI_INTEGRATOR = "Vestige-Index";
export const ENABLE_LIFI_FEES = true;

// Routed EVM execution fee: 5 bps (0.05%). THORChain/BTC: 10 bps (0.10%).
export const ROUTED_EVM_FEE_BPS = 5;
export const THORCHAIN_FEE_BPS = 10;
export const PLATFORM_FEE_BPS = ROUTED_EVM_FEE_BPS;

/** Fee as a fraction for LI.FI's `options.fee` (e.g. 0.0005 = 0.05%). */
export const EVM_FEE_RATE = ROUTED_EVM_FEE_BPS / 10_000;
export const THORCHAIN_FEE_RATE = THORCHAIN_FEE_BPS / 10_000;

/** Human label, matching VestigeIndex's fee presentation. */
export function feeLabel(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}

// LI.FI returns this kind of message when the integrator's fee wallet isn't set up yet; we
// then retry the quote WITHOUT the partner fee so the user still gets a route.
export function isFeeNotConfiguredError(message: string) {
  const m = message.toLowerCase();
  return m.includes("not configured for collecting fees") || m.includes("configure your fee wallet");
}
