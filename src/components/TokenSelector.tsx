"use client";

import { useEffect, useMemo, useState } from "react";
import { tokensForChain, fetchTokensForChain, isAddressLike, customTokenFromAddress, type TokenConfig } from "@/lib/tokens";
import { TokenLogo } from "./TokenLogo";
import type { Messages } from "@/lib/types";

const short = (a: string) => (a.startsWith("0x") && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export function TokenSelector({
  t, chainId, token, onChange
}: { t: Messages; chainId: number; token: TokenConfig; onChange: (token: TokenConfig) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allTokens, setAllTokens] = useState<TokenConfig[]>(() => tokensForChain(chainId));
  const [loading, setLoading] = useState(false);

  // Load the full real LI.FI token universe when the picker opens (cached after first load).
  useEffect(() => {
    if (!open) return;
    let active = true;
    setQuery("");
    setAllTokens(tokensForChain(chainId));
    setLoading(true);
    fetchTokensForChain(chainId)
      .then((list) => { if (active) setAllTokens(list); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, chainId]);

  // Common bases (Uniswap-style quick row): the pinned head of the chain list.
  const popular = useMemo(() => tokensForChain(chainId).slice(0, 7), [chainId]);

  const tokens = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = allTokens.filter((item) =>
      !q || item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)
    );
    // Uniswap-style: paste any contract address to import a token not in the list.
    if (!filtered.length && isAddressLike(query)) {
      return [customTokenFromAddress(chainId, query)];
    }
    return filtered.slice(0, 600);
  }, [allTokens, query, chainId]);

  const totalCount = allTokens.length;

  return (
    <>
      <button className="token-button" onClick={() => setOpen(true)} type="button">
        <TokenLogo symbol={token.symbol} logoURI={token.logoURI} size={24} />
        <span>{token.symbol}</span>
        <span aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>{t.selectToken}</strong>
              <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>

            <div className="token-search">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" />
              </svg>
              <input className="token-search-input" placeholder={t.search} value={query}
                onChange={(e) => setQuery(e.target.value)} autoFocus spellCheck={false} />
            </div>

            {/* Common bases quick-pick row (logos only — language-neutral). */}
            <div className="token-popular">
              {popular.map((item) => {
                const active = item.address.toLowerCase() === token.address.toLowerCase();
                return (
                  <button key={`p-${item.address}`} type="button" className={`token-pill${active ? " active" : ""}`}
                    onClick={() => { onChange(item); setOpen(false); }}>
                    <TokenLogo symbol={item.symbol} logoURI={item.logoURI} size={20} />
                    <span>{item.symbol}</span>
                  </button>
                );
              })}
            </div>

            <div className="token-list-head">
              <span>{t.selectToken}</span>
              <span>{loading ? t.quoting : totalCount.toLocaleString()}</span>
            </div>

            <div className="list token-list">
              {tokens.map((item) => {
                const selected = item.address.toLowerCase() === token.address.toLowerCase();
                return (
                  <button key={`${item.chainId}-${item.address}`} className={`list-button token-row${selected ? " selected" : ""}`}
                    onClick={() => { onChange(item); setOpen(false); }}>
                    <TokenLogo symbol={item.symbol} logoURI={item.logoURI} size={34} />
                    <div className="token-row-body">
                      <strong>{item.name}{item.isPlatformToken ? " · VIGIX" : ""}</strong>
                      <span>{item.symbol}{!item.isNative && item.address.startsWith("0x") ? ` · ${short(item.address)}` : ""}</span>
                    </div>
                    {selected ? <span className="token-check" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
              {!tokens.length && !loading ? <div className="list-hint">{t.quoteUnavailable}</div> : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
