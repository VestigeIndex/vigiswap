export const VIGIX = {
  chainId: 137,
  chainName: "Polygon",
  address: "0xea1989dDc9F7db000347F6Ac14C63fd395B6EDAd",
  symbol: "VIGIX",
  name: "VIGIX",
  decimalsFallback: 18,
  logoURI: "/logo/vigix.svg",
  nativePlatformToken: true,
  priceSource: "weighted-bonding-curve-contract",
  economicModel:
    "VIGIX price is defined by the contract curve. VIGIX only exists when bought/minted and is removed/burned when sold. Do not invent external market prices, FOMO copy, fake APY or speculative claims."
} as const;

export const VIGIX_ABI = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "USDC", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "priceAt", stateMutability: "view", inputs: [{ name: "supply", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] }
] as const;
