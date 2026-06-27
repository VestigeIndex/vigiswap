// VigiSwap network catalog — the EVM swap universe, mirroring VestigeIndex's supported EVM
// chains so both products share the same networks (VigiSwap is the mobile-first, swap-only
// surface; deeper BTC/cross-chain tooling lives on vestigeindex.com). Logos are reused from
// vestigeindex.com (CSP img-src allows https:). `lifiId` is the id the routing engine (LI.FI)
// expects — identical to the EVM chainId here. `isEvm` is kept for forward-compat.

export type ChainConfig = {
  id: number;
  name: string;
  shortName: string;
  nativeCurrency: string;
  logoURI: string;
  explorerUrl: string;
  lifiId: number;
  isEvm: boolean;
};

// Official chain artwork from LI.FI's verified icon set (real logos, no placeholders).
const LF = "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains";

export const CHAINS: ChainConfig[] = [
  { id: 1, name: "Ethereum", shortName: "ETH", nativeCurrency: "ETH", logoURI: `${LF}/ethereum.svg`, explorerUrl: "https://etherscan.io", lifiId: 1, isEvm: true },
  { id: 137, name: "Polygon", shortName: "POL", nativeCurrency: "POL", logoURI: `${LF}/polygon.svg`, explorerUrl: "https://polygonscan.com", lifiId: 137, isEvm: true },
  { id: 56, name: "BNB Chain", shortName: "BNB", nativeCurrency: "BNB", logoURI: `${LF}/bsc.svg`, explorerUrl: "https://bscscan.com", lifiId: 56, isEvm: true },
  { id: 42161, name: "Arbitrum", shortName: "ARB", nativeCurrency: "ETH", logoURI: `${LF}/arbitrum.svg`, explorerUrl: "https://arbiscan.io", lifiId: 42161, isEvm: true },
  { id: 10, name: "Optimism", shortName: "OP", nativeCurrency: "ETH", logoURI: `${LF}/optimism.svg`, explorerUrl: "https://optimistic.etherscan.io", lifiId: 10, isEvm: true },
  { id: 8453, name: "Base", shortName: "BASE", nativeCurrency: "ETH", logoURI: `${LF}/base.svg`, explorerUrl: "https://basescan.org", lifiId: 8453, isEvm: true },
  { id: 43114, name: "Avalanche", shortName: "AVAX", nativeCurrency: "AVAX", logoURI: `${LF}/avalanche.svg`, explorerUrl: "https://snowtrace.io", lifiId: 43114, isEvm: true },
  { id: 25, name: "Cronos", shortName: "CRO", nativeCurrency: "CRO", logoURI: `${LF}/cronos.svg`, explorerUrl: "https://cronoscan.com", lifiId: 25, isEvm: true },
  { id: 100, name: "Gnosis", shortName: "GNO", nativeCurrency: "XDAI", logoURI: `${LF}/gnosis.svg`, explorerUrl: "https://gnosisscan.io", lifiId: 100, isEvm: true },
  { id: 250, name: "Fantom", shortName: "FTM", nativeCurrency: "FTM", logoURI: "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png", explorerUrl: "https://ftmscan.com", lifiId: 250, isEvm: true },
  { id: 324, name: "zkSync Era", shortName: "ZK", nativeCurrency: "ETH", logoURI: `${LF}/zksync.svg`, explorerUrl: "https://era.zksync.network", lifiId: 324, isEvm: true },
  { id: 5000, name: "Mantle", shortName: "MNT", nativeCurrency: "MNT", logoURI: `${LF}/mantle.svg`, explorerUrl: "https://mantlescan.xyz", lifiId: 5000, isEvm: true },
  { id: 59144, name: "Linea", shortName: "LINEA", nativeCurrency: "ETH", logoURI: `${LF}/linea.svg`, explorerUrl: "https://lineascan.build", lifiId: 59144, isEvm: true },
  { id: 534352, name: "Scroll", shortName: "SCRL", nativeCurrency: "ETH", logoURI: `${LF}/scroll.svg`, explorerUrl: "https://scrollscan.com", lifiId: 534352, isEvm: true },
  { id: 202555, name: "Kasplex zkEVM", shortName: "KAS", nativeCurrency: "KAS", logoURI: "https://assets.coingecko.com/coins/images/25789/small/kaspa-icon-exchanges.png", explorerUrl: "https://explorer.kasplex.org", lifiId: 202555, isEvm: true },
];

// Bitcoin is supported natively by the LI.FI engine (UTXO chain id 20000000000001, token
// address "bitcoin"). It is a valid DESTINATION only here: paying FROM BTC needs a BTC
// wallet, which an EVM-only swap surface can't sign. EVM→BTC executes with the EVM wallet.
export const BTC_CHAIN: ChainConfig = {
  id: 8332,
  name: "Bitcoin",
  shortName: "BTC",
  nativeCurrency: "BTC",
  logoURI: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  explorerUrl: "https://mempool.space",
  lifiId: 20000000000001,
  isEvm: false,
};

// FROM side = EVM chains (must be signable by the connected wallet).
export const EVM_CHAINS = CHAINS.filter((c) => c.isEvm);
// TO side = EVM chains + Bitcoin (cross-chain via LI.FI).
export const DEST_CHAINS = [...EVM_CHAINS, BTC_CHAIN];
export const ALL_CHAINS = [...CHAINS, BTC_CHAIN];

export function chainById(id: number) {
  return ALL_CHAINS.find((c) => c.id === id) ?? null;
}
