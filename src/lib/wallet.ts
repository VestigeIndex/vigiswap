import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  mainnet, polygon, base, arbitrum, optimism, bsc, avalanche,
  cronos, gnosis, fantom, zksync, mantle, linea, scroll,
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";

// Full EVM set, mirroring VestigeIndex's supported chains so the lite shares the same
// universe. Polygon (137) is mandatory because VIGIX lives there. (Bitcoin and Kasplex
// are in the swap catalog but not EVM wallet networks: BTC is UTXO, Kasplex isn't a
// wagmi network — they participate via the routing engine, not wallet chain-switching.)
export const networks = [
  mainnet, polygon, bsc, arbitrum, optimism, base, avalanche,
  cronos, gnosis, fantom, zksync, mantle, linea, scroll,
] as [AppKitNetwork, ...AppKitNetwork[]];

export const PROJECT_ID = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "").trim();
export const PROJECT_ID_VALID = /^[0-9a-f]{32}$/i.test(PROJECT_ID);

export const SITE_URL = process.env.NEXT_PUBLIC_VIGISWAP_SITE_URL || "https://vigiswap.com";

export const appKitMetadata = {
  name: "VigiSwap",
  description: "Fast non-custodial crypto swaps powered by Vestige Index",
  url: SITE_URL,
  icons: [`${SITE_URL.replace(/\/$/, "")}/logo/vigiswap-mark.svg`],
};

// Building the wagmi adapter/config is safe on the server (no window access).
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: PROJECT_ID_VALID ? PROJECT_ID : "00000000000000000000000000000000",
  ssr: false,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// AppKit (Reown modal + WalletConnect relay) is browser-only. Create it ONCE at
// module load on the client — before any component renders — so the modal/relay is
// warm and the QR is a live, subscribed WalletConnect session (no fake QR).
type AppKitInstance = ReturnType<typeof createAppKit>;
let appKit: AppKitInstance | null = null;

if (typeof window !== "undefined" && PROJECT_ID_VALID) {
  appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    defaultNetwork: polygon,
    projectId: PROJECT_ID,
    metadata: appKitMetadata,
    features: { analytics: false, email: false, socials: [], swaps: false, onramp: false },
    themeMode: "light",
    themeVariables: {
      "--w3m-accent": "#F0A23B",
      "--w3m-border-radius-master": "10px",
    },
  });
  if (process.env.NODE_ENV !== "production") {
    console.info("[VigiSwap wallet] AppKit initialised", {
      projectIdPresent: PROJECT_ID_VALID,
      networks: networks.map((n) => n.id),
    });
  }
} else if (typeof window !== "undefined" && !PROJECT_ID_VALID && process.env.NODE_ENV !== "production") {
  console.error("WalletConnect Project ID missing. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.");
}

export type AppKitView = "Connect" | "Account" | "Networks";

export async function openAppKit(view?: AppKitView) {
  if (!appKit) throw new Error("WalletConnect Project ID missing. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.");
  await appKit.open(view ? { view } : undefined);
}
