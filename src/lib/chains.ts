// VigiSwap network catalog — mirrors VestigeIndex's MARKET_SUPPORTED_CHAINS so both
// products share the exact same universe (VigiSwap is the swap-only "lite"). Logos are
// reused from vestigeindex.com (CSP img-src allows https:). `lifiId` is the id the
// routing engine (LI.FI) expects: identical to the EVM chainId, except Bitcoin which is
// LI.FI's UTXO chain id 20000000000001. `isEvm:false` chains can't use an EVM wallet as
// the source and only participate as cross-chain destinations.

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

const VI = "https://www.vestigeindex.com";
const BTC_LIFI_ID = 20000000000001;

export const CHAINS: ChainConfig[] = [
  { id: 1, name: "Ethereum", shortName: "ETH", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/ethereum.svg`, explorerUrl: "https://etherscan.io", lifiId: 1, isEvm: true },
  { id: 137, name: "Polygon", shortName: "POL", nativeCurrency: "POL", logoURI: `${VI}/logos/networks/polygon.svg`, explorerUrl: "https://polygonscan.com", lifiId: 137, isEvm: true },
  { id: 56, name: "BNB Chain", shortName: "BNB", nativeCurrency: "BNB", logoURI: `${VI}/logos/networks/bnb-chain.svg`, explorerUrl: "https://bscscan.com", lifiId: 56, isEvm: true },
  { id: 42161, name: "Arbitrum", shortName: "ARB", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/arbitrum.svg`, explorerUrl: "https://arbiscan.io", lifiId: 42161, isEvm: true },
  { id: 10, name: "Optimism", shortName: "OP", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/optimism.svg`, explorerUrl: "https://optimistic.etherscan.io", lifiId: 10, isEvm: true },
  { id: 8453, name: "Base", shortName: "BASE", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/base.svg`, explorerUrl: "https://basescan.org", lifiId: 8453, isEvm: true },
  { id: 43114, name: "Avalanche", shortName: "AVAX", nativeCurrency: "AVAX", logoURI: `${VI}/logos/networks/avalanche.svg`, explorerUrl: "https://snowtrace.io", lifiId: 43114, isEvm: true },
  { id: 25, name: "Cronos", shortName: "CRO", nativeCurrency: "CRO", logoURI: `${VI}/logos/networks/cronos.svg`, explorerUrl: "https://cronoscan.com", lifiId: 25, isEvm: true },
  { id: 100, name: "Gnosis", shortName: "GNO", nativeCurrency: "XDAI", logoURI: `${VI}/logos/networks/gnosis.svg`, explorerUrl: "https://gnosisscan.io", lifiId: 100, isEvm: true },
  { id: 250, name: "Fantom", shortName: "FTM", nativeCurrency: "FTM", logoURI: "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png", explorerUrl: "https://ftmscan.com", lifiId: 250, isEvm: true },
  { id: 324, name: "zkSync Era", shortName: "ZK", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/zksync.svg`, explorerUrl: "https://era.zksync.network", lifiId: 324, isEvm: true },
  { id: 5000, name: "Mantle", shortName: "MNT", nativeCurrency: "MNT", logoURI: `${VI}/logos/networks/mantle.svg`, explorerUrl: "https://mantlescan.xyz", lifiId: 5000, isEvm: true },
  { id: 59144, name: "Linea", shortName: "LINEA", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/linea.svg`, explorerUrl: "https://lineascan.build", lifiId: 59144, isEvm: true },
  { id: 534352, name: "Scroll", shortName: "SCRL", nativeCurrency: "ETH", logoURI: `${VI}/logos/networks/scroll.svg`, explorerUrl: "https://scrollscan.com", lifiId: 534352, isEvm: true },
  { id: 202555, name: "Kasplex zkEVM", shortName: "KAS", nativeCurrency: "KAS", logoURI: "https://assets.coingecko.com/coins/images/25789/small/kaspa-icon-exchanges.png", explorerUrl: "https://explorer.kasplex.org", lifiId: 202555, isEvm: true },
  { id: 8332, name: "Bitcoin", shortName: "BTC", nativeCurrency: "BTC", logoURI: `${VI}/logos/tokens/btc.png`, explorerUrl: "https://mempool.space", lifiId: BTC_LIFI_ID, isEvm: false },
];

export const EVM_CHAINS = CHAINS.filter((c) => c.isEvm);

export function chainById(id: number) {
  return CHAINS.find((c) => c.id === id) ?? null;
}
