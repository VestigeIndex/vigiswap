"use client";

import { useState } from "react";
import { CHAINS, type ChainConfig } from "@/lib/chains";
import type { Messages } from "@/lib/types";

export function ChainSelector({ t, chain, onChange }: { t: Messages; chain: ChainConfig; onChange: (chain: ChainConfig) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="chain-button" onClick={() => setOpen(true)} type="button">
        <img className="chain-logo" src={chain.logoURI} alt="" onError={(e) => { e.currentTarget.src = "/logo/token-fallback.svg"; }} />
        <span>{chain.name}</span>
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
                  <img src={item.logoURI} alt="" onError={(e) => { e.currentTarget.src = "/logo/token-fallback.svg"; }} />
                  <div><strong>{item.name}</strong><span>Chain ID {item.id}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
