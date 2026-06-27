"use client";

import { useEffect, useMemo, useState } from "react";
import { tokensForChain, fetchTokensForChain, isAddressLike, customTokenFromAddress, type TokenConfig } from "@/lib/tokens";
import { TokenLogo } from "./TokenLogo";
import type { Messages } from "@/lib/types";

export function TokenSelector({
  t, chainId, token, onChange
}: { t: Messages; chainId: number; token: TokenConfig; onChange: (token: TokenConfig) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allTokens, setAllTokens] = useState<TokenConfig[]>(() => tokensForChain(chainId));
  const [loading, setLoading] = useState(false);

  // Load the real LI.FI token list when the picker opens (cached after first load).
  useEffect(() => {
    if (!open) return;
    let active = true;
    setAllTokens(tokensForChain(chainId));
    setLoading(true);
    fetchTokensForChain(chainId)
      .then((list) => { if (active) setAllTokens(list); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, chainId]);

  const tokens = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = allTokens.filter((item) =>
      !q || item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)
    );
    // Uniswap-style: if a full contract address is pasted and isn't in the list, let
    // the user import it directly.
    if (!filtered.length && isAddressLike(query)) {
      return [customTokenFromAddress(chainId, query)];
    }
    return filtered.slice(0, 120);
  }, [allTokens, query, chainId]);

  return (
    <>
      <button className="token-button" onClick={() => setOpen(true)} type="button">
        <TokenLogo symbol={token.symbol} logoURI={token.logoURI} size={24} />
        <span>{token.symbol}</span>
        <span aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>{t.selectToken}</strong>
              <button className="icon-button" onClick={() => setOpen(false)}>×</button>
            </div>
            <input className="search-input" placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            {loading ? <div className="list-hint">{t.quoting}</div> : null}
            <div className="list">
              {tokens.map((item) => (
                <button key={`${item.chainId}-${item.address}`} className="list-button" onClick={() => { onChange(item); setOpen(false); }}>
                  <TokenLogo symbol={item.symbol} logoURI={item.logoURI} size={30} />
                  <div>
                    <strong>{item.symbol}{item.isPlatformToken ? " · VIGIX" : ""}</strong>
                    <span>{item.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
