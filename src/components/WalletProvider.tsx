"use client";

import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wallet";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  // AppKit is created at module load on the client (see src/lib/wallet.ts), so the
  // relay/modal are ready before this renders. wagmi + react-query just provide hooks.
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
