"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { PROJECT_ID_VALID, openAppKit, type AppKitView } from "@/lib/wallet";
import { CHAINS } from "@/lib/chains";
import type { Messages } from "@/lib/types";

const SUPPORTED = new Set(CHAINS.map((c) => c.id));

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton({ t }: { t: Messages }) {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!PROJECT_ID_VALID && process.env.NODE_ENV !== "production") {
      console.error("WalletConnect Project ID missing. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.");
    }
  }, []);

  if (!PROJECT_ID_VALID) {
    return (
      <button className="wallet-button wallet-error" type="button" disabled title="Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID">
        {t.walletProjectMissing}
      </button>
    );
  }

  const wrongNetwork = isConnected && !SUPPORTED.has(Number(chainId));

  async function handleOpen(view?: AppKitView) {
    setError(null);
    try {
      await openAppKit(view);
    } catch (e) {
      const msg = String((e as Error)?.message || "");
      if (/reject|denied|cancel/i.test(msg)) setError(t.walletRejected);
      else if (/relay|websocket|network/i.test(msg)) setError(t.walletRelayError);
      else if (/expired|session/i.test(msg)) setError(t.walletSessionExpired);
      else setError(t.walletRelayError);
    }
  }

  let label = t.connectWallet;
  let className = "wallet-button";
  let onClick: () => void = () => void handleOpen("Connect");

  if (isConnecting || isReconnecting) {
    label = t.walletConnecting;
    className = "wallet-button wallet-connecting";
  } else if (wrongNetwork) {
    label = t.walletWrongNetwork;
    className = "wallet-button wallet-error";
    onClick = () => void handleOpen("Networks");
  } else if (isConnected && address) {
    label = shortAddress(address);
    className = "wallet-button wallet-connected";
    onClick = () => void handleOpen("Account");
  }

  return (
    <div className="wallet-button-wrap">
      <button className={className} type="button" onClick={onClick}>
        {isConnected && !wrongNetwork ? <span className="wallet-dot" aria-hidden="true" /> : null}
        {label}
      </button>
      {error ? <span className="wallet-inline-error" role="alert">{error}</span> : null}
    </div>
  );
}
