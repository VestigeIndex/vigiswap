export type ChainConfig = { id: number; name: string; shortName: string; nativeCurrency: string; logoURI: string; explorerUrl: string };

export const CHAINS: ChainConfig[] = [
  { id: 1, name: "Ethereum", shortName: "ETH", nativeCurrency: "ETH", logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png", explorerUrl: "https://etherscan.io" },
  { id: 137, name: "Polygon", shortName: "POL", nativeCurrency: "POL", logoURI: "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png", explorerUrl: "https://polygonscan.com" },
  { id: 56, name: "BNB Chain", shortName: "BNB", nativeCurrency: "BNB", logoURI: "/logo/token-fallback.svg", explorerUrl: "https://bscscan.com" },
  { id: 42161, name: "Arbitrum", shortName: "ARB", nativeCurrency: "ETH", logoURI: "https://tokens.1inch.io/0x912ce59144191c1204e64559fe8253a0e49e6548.png", explorerUrl: "https://arbiscan.io" },
  { id: 10, name: "Optimism", shortName: "OP", nativeCurrency: "ETH", logoURI: "https://tokens.1inch.io/0x4200000000000000000000000000000000000042.png", explorerUrl: "https://optimistic.etherscan.io" },
  { id: 8453, name: "Base", shortName: "BASE", nativeCurrency: "ETH", logoURI: "/logo/token-fallback.svg", explorerUrl: "https://basescan.org" }
];
