"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUnits, parseUnits, erc20Abi, type Address } from "viem";
import { useAccount, useBalance, useChainId, useReadContract, useSwitchChain } from "wagmi";
import { readContract, sendTransaction, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { EVM_CHAINS, DEST_CHAINS, type ChainConfig } from "@/lib/chains";
import { tokensForChain, type TokenConfig } from "@/lib/tokens";
import { VIGIX } from "@/lib/vigix";
import { useVigixPrice } from "@/lib/useVigixPrice";
import { wagmiConfig, PROJECT_ID_VALID, openAppKit } from "@/lib/wallet";
import { getVestigeQuote, type NormalizedRoute } from "@/lib/vestigeApiClient";
import { getProviderComparison, type ComparisonQuote } from "@/lib/aggregators";
import { PLATFORM_FEE_BPS, feeLabel } from "@/lib/fees";
import { analyzeSwap } from "@/lib/security/securityCore";
import { SafeSign } from "./SafeSign";
import { ChainSelector } from "./ChainSelector";
import { TokenSelector } from "./TokenSelector";
import { TransactionTimeline, type TxStage } from "./TransactionTimeline";
import type { Messages } from "@/lib/types";

const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const NATIVE_LIFI = "0x0000000000000000000000000000000000000000";
const isNative = (addr: string) => addr.toLowerCase() === NATIVE || addr.toLowerCase() === NATIVE_LIFI;

function fmt(amount: string | undefined, decimals: number, max = 6) {
  if (!amount) return "—";
  try {
    const n = Number(formatUnits(BigInt(amount), decimals));
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString(undefined, { maximumFractionDigits: max });
  } catch {
    return "—";
  }
}

export function SwapCard({ t }: { t: Messages }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const vigix = useVigixPrice();

  // Cross-chain: `chain` is the FROM/source chain (EVM, signable). `toChain` is the DEST
  // chain (EVM or Bitcoin via LI.FI). Same-chain swap = both equal.
  const [chain, setChain] = useState(EVM_CHAINS.find((c) => c.id === 137) || EVM_CHAINS[0]);
  const [toChain, setToChain] = useState<ChainConfig>(EVM_CHAINS.find((c) => c.id === 137) || EVM_CHAINS[0]);
  const fromTokens = useMemo(() => tokensForChain(chain.id), [chain.id]);
  const toTokens = useMemo(() => tokensForChain(toChain.id), [toChain.id]);
  const [fromToken, setFromToken] = useState<TokenConfig>(fromTokens[1] || fromTokens[0]);
  const [toToken, setToToken] = useState<TokenConfig>(fromTokens[0]);
  const [amount, setAmount] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [showSettings, setShowSettings] = useState(false);

  const crossChain = chain.id !== toChain.id;
  const toIsBtc = toChain.id === 8332;

  const [route, setRoute] = useState<NormalizedRoute | null>(null);
  const [comparison, setComparison] = useState<ComparisonQuote[]>([]);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<TxStage>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const quoteSeq = useRef(0);

  function changeChain(next: ChainConfig) {
    const nextTokens = tokensForChain(next.id);
    setChain(next);
    setFromToken(nextTokens.find((x) => x.symbol === "USDC") || nextTokens[0]);
    setRoute(null);
    setComparison([]);
    setError(null);
  }

  function changeToChain(next: ChainConfig) {
    const nextTokens = tokensForChain(next.id);
    setToChain(next);
    setToToken(nextTokens.find((x) => x.symbol === "VIGIX") || nextTokens[0]);
    setRoute(null);
    setComparison([]);
    setError(null);
  }

  // Debounced real quote. Cancels stale requests via a sequence guard.
  useEffect(() => {
    const parsed = Number(amount);
    const samePair = chain.id === toChain.id && fromToken.address === toToken.address;
    if (!amount || !Number.isFinite(parsed) || parsed <= 0 || samePair) {
      setRoute(null);
      setComparison([]);
      setError(null);
      setQuoting(false);
      return;
    }
    const seq = ++quoteSeq.current;
    setQuoting(true);
    setError(null);
    const handle = setTimeout(async () => {
      try {
        const amountWei = parseUnits(amount, fromToken.decimals).toString();
        // BTC destination needs a BTC receive address; fall back to the wallet for EVM dests.
        const destAddress = toIsBtc ? (btcAddress.trim() || undefined) : address;
        const result = await getVestigeQuote({
          chainId: chain.lifiId,
          toChainId: toChain.lifiId,
          fromToken: isNative(fromToken.address) ? NATIVE_LIFI : fromToken.address,
          toToken: isNative(toToken.address) ? NATIVE_LIFI : toToken.address,
          amount: amountWei,
          slippageBps,
          recipient: address,
          destAddress,
        });
        if (seq !== quoteSeq.current) return;
        setRoute(result.bestRoute);
        if (!result.bestRoute) setError(t.quoteUnavailable);
        // Cross-aggregator comparison (ParaSwap/Odos) only applies to same-chain swaps.
        if (!crossChain) {
          getProviderComparison({
            chainId: chain.lifiId,
            fromToken: isNative(fromToken.address) ? NATIVE_LIFI : fromToken.address,
            toToken: isNative(toToken.address) ? NATIVE_LIFI : toToken.address,
            fromDecimals: fromToken.decimals,
            toDecimals: toToken.decimals,
            amountWei,
            recipient: address,
          }).then((cmp) => { if (seq === quoteSeq.current) setComparison(cmp); });
        } else {
          setComparison([]);
        }
      } catch (e) {
        if (seq !== quoteSeq.current) return;
        setRoute(null);
        setError((e as Error)?.message || t.quoteUnavailable);
      } finally {
        if (seq === quoteSeq.current) setQuoting(false);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [amount, fromToken, toToken, chain.id, chain.lifiId, toChain.id, toChain.lifiId, crossChain, toIsBtc, btcAddress, slippageBps, address, t.quoteUnavailable]);

  // wagmi v3: useBalance is native-only; ERC-20 balance comes from balanceOf.
  const fromIsNative = isNative(fromToken.address);
  const { data: nativeBal } = useBalance({
    address,
    chainId: chain.id,
    query: { enabled: Boolean(address) && fromIsNative },
  });
  const { data: erc20Bal } = useReadContract({
    address: fromToken.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address as Address] : undefined,
    chainId: chain.id,
    query: { enabled: Boolean(address) && !fromIsNative },
  });
  const balanceValue = fromIsNative ? nativeBal?.value : (erc20Bal as bigint | undefined);
  const balanceFormatted = balanceValue != null ? formatUnits(balanceValue, fromToken.decimals) : undefined;

  const wrongNetwork = isConnected && Number(chainId) !== chain.id;
  const highImpact = (route?.priceImpactPct ?? 0) < -8;

  // UTXO Safe Sign review of the pending swap (recomputed whenever the route changes).
  const safeSign = useMemo(() => {
    if (!route) return null;
    return analyzeSwap({
      tokenSymbol: fromToken.symbol,
      tokenName: fromToken.name,
      isNative: isNative(fromToken.address),
      approvalAddress: route.approvalAddress,
      unlimitedApproval: false, // we always approve the exact amount
      priceImpactPct: route.priceImpactPct,
      recipientIsSelf: Boolean(address),
      routeProvider: route.provider,
      hasExecutableTx: Boolean(route.transactionRequest?.to),
    });
  }, [route, fromToken.symbol, fromToken.name, fromToken.address, address]);

  const execute = useCallback(async () => {
    if (!route || !address) return;
    setError(null);
    setTxHash(null);
    try {
      if (Number(chainId) !== chain.id) {
        await switchChainAsync({ chainId: chain.id });
      }
      // Approval (skip for native).
      if (!isNative(fromToken.address) && route.approvalAddress) {
        const amountWei = parseUnits(amount, fromToken.decimals);
        const allowance = (await readContract(wagmiConfig, {
          address: fromToken.address as Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address as Address, route.approvalAddress as Address],
          chainId: chain.id,
        })) as bigint;
        if (allowance < amountWei) {
          setStage("approving");
          // UTXO Safe Sign: approve the EXACT trade amount, never unlimited (maxUint256).
          const approveHash = await writeContract(wagmiConfig, {
            address: fromToken.address as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [route.approvalAddress as Address, amountWei],
            chainId: chain.id,
          });
          await waitForTransactionReceipt(wagmiConfig, { hash: approveHash, chainId: chain.id });
        }
      }

      const tx = route.transactionRequest;
      if (!tx || !tx.to) {
        setStage("idle");
        setError(t.quoteExpired);
        return;
      }
      setStage("swapping");
      const hash = await sendTransaction(wagmiConfig, {
        to: tx.to as Address,
        data: (tx.data as `0x${string}`) ?? undefined,
        value: tx.value ? BigInt(tx.value as string) : undefined,
        chainId: chain.id,
      });
      setTxHash(hash);
      setStage("pending");
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: chain.id });
      setStage(receipt.status === "success" ? "confirmed" : "failed");
      if (receipt.status !== "success") setError(t.txFailed);
    } catch (e) {
      const msg = String((e as Error)?.message || "");
      setStage("failed");
      if (/reject|denied|cancel|User rejected/i.test(msg)) setError(t.swapRejected);
      else if (/insufficient/i.test(msg)) setError(t.insufficientBalance);
      else if (/rpc|network|fetch/i.test(msg)) setError(t.rpcError);
      else setError(msg || t.txFailed);
    }
  }, [route, address, chainId, chain.id, fromToken, amount, switchChainAsync, t]);

  const explorerUrl = txHash ? `${chain.explorerUrl}/tx/${txHash}` : undefined;

  let primaryLabel = t.reviewSwap;
  let primaryDisabled = false;
  let primaryAction: () => void = () => void execute();

  if (!PROJECT_ID_VALID) {
    primaryLabel = t.walletProjectMissing;
    primaryDisabled = true;
  } else if (!isConnected) {
    primaryLabel = t.connectWallet;
    primaryAction = () => void openAppKit("Connect").catch(() => undefined);
  } else if (wrongNetwork) {
    primaryLabel = t.walletWrongNetwork;
    primaryAction = () => void switchChainAsync({ chainId: chain.id }).catch(() => undefined);
  } else if (!amount) {
    primaryLabel = t.enterAmount;
    primaryDisabled = true;
  } else if (quoting) {
    primaryLabel = t.quoting;
    primaryDisabled = true;
  } else if (!route) {
    primaryLabel = t.quoteUnavailable;
    primaryDisabled = true;
  } else if (stage === "approving" || stage === "swapping" || stage === "pending") {
    primaryLabel = t.txPending;
    primaryDisabled = true;
  } else if (toIsBtc && !btcAddress.trim()) {
    primaryLabel = t.enterBtcAddress;
    primaryDisabled = true;
  } else if (safeSign?.decision === "block") {
    primaryLabel = t.safeSignBlock;
    primaryDisabled = true;
  } else if (highImpact) {
    primaryLabel = t.swapAnyway;
  }

  const outDisplay = route ? fmt(route.outputAmount, toToken.decimals) : "";

  return (
    <section className="swap-card" aria-label="Swap">
      <div className="swap-header">
        <div className="swap-title">
          <strong>{t.swap}</strong>
          <span>
            {t.bestRoute}
            {route ? <span className="best-badge"><span className="best-dot" aria-hidden="true" />{route.provider}</span> : null}
          </span>
        </div>
      </div>

      <div className="swap-input">
        <div className="swap-input-top">
          <span>{t.youPay}</span>
          {address && balanceFormatted ? (
            <span className="balance-line">
              {t.balance}: {Number(balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 6 })}
              <button type="button" className="max-button" onClick={() => setAmount(balanceFormatted)}>MAX</button>
            </span>
          ) : null}
        </div>
        <div className="swap-input-main">
          <input className="amount-input" inputMode="decimal" placeholder="0" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
          <div className="asset-pick">
            <ChainSelector t={t} chain={chain} onChange={changeChain} chains={EVM_CHAINS} variant="chip" />
            <TokenSelector t={t} chainId={chain.id} token={fromToken} onChange={(x) => setFromToken(x)} />
          </div>
        </div>
      </div>

      <div className="switch-row">
        <button className="switch-button" type="button" aria-label="Switch tokens" disabled={!toChain.isEvm}
          onClick={() => {
            if (!toChain.isEvm) return;
            const a = fromToken; const ac = chain;
            setChain(toChain); setToChain(ac);
            setFromToken(toToken); setToToken(a);
            setAmount(""); setRoute(null); setComparison([]);
          }}>↓</button>
      </div>

      <div className="swap-input">
        <div className="swap-input-top"><span>{t.youReceive}</span></div>
        <div className="swap-input-main">
          <input className="amount-input" placeholder="0" value={quoting ? "…" : outDisplay} readOnly />
          <div className="asset-pick">
            <ChainSelector t={t} chain={toChain} onChange={changeToChain} chains={DEST_CHAINS} variant="chip" />
            <TokenSelector t={t} chainId={toChain.id} token={toToken} onChange={(x) => setToToken(x)} />
          </div>
        </div>
      </div>

      {toIsBtc ? (
        <div className="btc-dest">
          <label htmlFor="btc-addr">{t.btcDestLabel}</label>
          <input id="btc-addr" className="btc-input" placeholder="bc1q…" value={btcAddress} spellCheck={false}
            onChange={(e) => setBtcAddress(e.target.value.trim())} />
          <span className="btc-hint">{t.btcDestHint}</span>
        </div>
      ) : null}

      <div className="settings-row">
        <div className="inline-settings">
          <span className="mini-badge">{t.slippage}: {(slippageBps / 100).toFixed(2)}%</span>
          <span className="mini-badge">{t.route}: {route?.provider ?? "Vestige"}</span>
        </div>
        <button className="icon-button" aria-label={t.settings} onClick={() => setShowSettings((v) => !v)}>⚙</button>
      </div>

      {showSettings ? (
        <div className="settings-panel">
          <span>{t.slippage}</span>
          <div className="slippage-row">
            {[10, 50, 100].map((bps) => (
              <button key={bps} type="button" className={`slippage-chip${slippageBps === bps ? " active" : ""}`}
                onClick={() => setSlippageBps(bps)}>{(bps / 100).toFixed(2)}%</button>
            ))}
          </div>
        </div>
      ) : null}

      {safeSign ? <SafeSign t={t} review={safeSign} /> : null}

      <button className="primary-button" disabled={primaryDisabled} onClick={primaryAction}>{primaryLabel}</button>

      {error ? <p className="swap-error" role="alert">{error}</p> : null}
      {highImpact && route ? <p className="swap-warn">{t.priceImpactWarning}</p> : null}

      <div className={`route-card${quoting ? " is-loading" : ""}`}>
        <div className="route-row"><span>{t.provider}</span><strong>{route?.provider ?? "—"}</strong></div>
        <div className="route-row"><span>{t.minimumReceived}</span><strong>{route ? `${fmt(route.toAmountMin, toToken.decimals)} ${toToken.symbol}` : "—"}</strong></div>
        <div className="route-row"><span>{t.priceImpact}</span><strong>{route?.priceImpactPct != null ? `${route.priceImpactPct.toFixed(2)}%` : "—"}</strong></div>
        <div className="route-row"><span>{t.gas}</span><strong>{route?.gasUsd ? `$${Number(route.gasUsd).toFixed(2)}` : "—"}</strong></div>
        <div className="route-row"><span>{t.fee}</span><strong>{route?.feeUsd ? `$${Number(route.feeUsd).toFixed(2)}` : t.feePolicy}</strong></div>
        <div className="route-row"><span>{t.platformFee}</span><strong>{feeLabel(PLATFORM_FEE_BPS)}</strong></div>
      </div>

      {route && comparison.length > 0 ? (
        <div className="provider-compare">
          <h4>{t.bestPriceAcross}</h4>
          {(() => {
            const rows = [
              { provider: "LI.FI", outputWei: route.outputAmount, executable: true, via: route.provider },
              ...comparison.map((c) => ({ provider: c.provider, outputWei: c.outputWei, executable: false, via: c.via })),
            ];
            let bestWei = 0n;
            for (const r of rows) { try { const v = BigInt(r.outputWei || "0"); if (v > bestWei) bestWei = v; } catch { /* skip */ } }
            return rows.map((r) => {
              let isBest = false;
              try { isBest = BigInt(r.outputWei || "0") === bestWei && bestWei > 0n; } catch { /* skip */ }
              return (
                <div key={r.provider} className={`provider-row${isBest ? " best" : ""}`}>
                  <span>{r.provider}{r.via && r.via !== r.provider ? ` · ${r.via}` : ""}{r.executable ? "" : ` · ${t.compareOnly}`}</span>
                  <strong>
                    {fmt(r.outputWei, toToken.decimals)} {toToken.symbol}
                    {isBest ? <span className="pill">{t.best}</span> : null}
                  </strong>
                </div>
              );
            });
          })()}
        </div>
      ) : null}

      <TransactionTimeline t={t} stage={stage} explorerUrl={explorerUrl} />

      <div className="vigix-strip">
        <img src={VIGIX.logoURI} alt="" />
        <div className="vigix-strip-body">
          <strong>{t.vigixTitle}</strong>
          <span>{t.vigixText}</span>
        </div>
        <div className="vigix-price" title={t.vigixPriceSource}>
          {vigix.isLoading && !vigix.data ? (
            <span className="vigix-price-loading">{t.vigixPriceLoading}</span>
          ) : vigix.data ? (
            <>
              <span className="vigix-price-value">
                ${vigix.data.priceUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </span>
              <span className="vigix-price-label">{t.vigixPriceLabel}</span>
            </>
          ) : (
            <span className="vigix-price-loading">{t.vigixPriceUnavailable}</span>
          )}
        </div>
      </div>

      <p className="disclaimer">{t.disclaimer}</p>
    </section>
  );
}
