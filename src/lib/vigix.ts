import { createPublicClient, fallback, http, formatUnits } from "viem";
import { polygon } from "viem/chains";

export const VIGIX = {
  chainId: 137,
  chainName: "Polygon",
  address: "0xea1989dDc9F7db000347F6Ac14C63fd395B6EDAd",
  symbol: "VIGIX",
  name: "VIGIX",
  decimals: 18,
  decimalsFallback: 18,
  // USDC (native, 6 decimals) is the reserve/quote asset hard-coded in the contract.
  usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  usdcDecimals: 6,
  // Fees baked into the bonding curve (basis points).
  buyFeeBps: 15,
  sellFeeBps: 25,
  logoURI: "/logo/vigix.svg",
  nativePlatformToken: true,
  priceSource: "on-chain weighted-bonding-curve contract (priceAt/totalSupply)",
  economicModel:
    "VIGIX price is defined by the contract curve. VIGIX only exists when bought/minted and is removed/burned when sold. Do not invent external market prices, FOMO copy, fake APY or speculative claims."
} as const;

// Verified ABI subset (Sourcify full_match, Polygon 137). Only read/view methods
// the UI needs. priceAt(supply) returns the marginal price scaled to 1e18 = 1 USD.
export const VIGIX_ABI = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "priceAt", stateMutability: "view", inputs: [{ name: "supply", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "previewBuy", stateMutability: "view", inputs: [{ name: "usdcAmount", type: "uint256" }], outputs: [{ name: "tokensOut", type: "uint256" }] },
  { type: "function", name: "previewSell", stateMutability: "view", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [{ name: "usdcOut", type: "uint256" }] }
] as const;

// Standalone Polygon reader so the spot price loads regardless of the connected
// wallet's chain (or with no wallet at all). Public RPCs, fallback-ordered.
const vigixReader = createPublicClient({
  chain: polygon,
  transport: fallback([
    http("https://polygon-bor-rpc.publicnode.com"),
    http("https://1rpc.io/matic"),
    http("https://polygon.drpc.org"),
  ]),
});

export type VigixSpot = {
  /** Marginal spot price in USD (priceAt(totalSupply)). */
  priceUsd: number;
  /** Circulating supply in whole VIGIX. */
  supply: number;
};

// Reads the live on-chain spot price straight from the bonding curve. No invented
// or cached external price — purely priceAt(totalSupply()) from the contract.
export async function fetchVigixSpot(): Promise<VigixSpot> {
  const supplyWei = (await vigixReader.readContract({
    address: VIGIX.address as `0x${string}`,
    abi: VIGIX_ABI,
    functionName: "totalSupply",
  })) as bigint;

  const priceWei = (await vigixReader.readContract({
    address: VIGIX.address as `0x${string}`,
    abi: VIGIX_ABI,
    functionName: "priceAt",
    args: [supplyWei],
  })) as bigint;

  return {
    priceUsd: Number(formatUnits(priceWei, 18)),
    supply: Number(formatUnits(supplyWei, 18)),
  };
}
