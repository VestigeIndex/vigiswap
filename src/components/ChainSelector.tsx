"use client";

import { useState } from "react";
import { EVM_CHAINS, type ChainConfig } from "@/lib/chains";
import { TokenLogo } from "./TokenLogo";
import type { Messages } from "@/lib/types";

export function ChainSelector({ t, chain, onChange, chains = EVM_CHAINS, variant }: { t: Messages; chain: ChainConfig; onChange: (chain: ChainConfig) => void; chains?: ChainConfig[]; variant?: "chip" }) {
  const [open, setOpen] = useState(false);
  const CHAINS = chains;
  return (
    <>
      <button className={variant === "chip" ? "chain-chip" : "chain-button"} onClick={() => setOpen(true)} type="button">
        <TokenLogo symbol={chain.shortName} logoURI={chain.logoURI} size={variant === "chip" ? 18 : 22} />
        <span>{variant === "chip" ? chain.shortName : chain.name}</span>
        <span aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>{t.selectChain}</strong>
              <button className="icon-button" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="list">
              {CHAINS.map((item) => (
                <button key={item.id} className="list-button" onClick={() => { onChange(item); setOpen(false); }}>
                  <TokenLogo symbol={item.shortName} logoURI={item.logoURI} size={30} />
                  <div><strong>{item.name}</strong><span>{item.isEvm ? `Chain ID ${item.id}` : "Bitcoin · UTXO"}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
