"use client";

import { useState } from "react";
import type { SafeSignReview } from "@/lib/security/securityCore";
import type { Messages } from "@/lib/types";

const DECISION_META: Record<SafeSignReview["decision"], { cls: string; key: keyof Messages }> = {
  safe: { cls: "ss-safe", key: "safeSignSafe" },
  review: { cls: "ss-review", key: "safeSignReview" },
  block: { cls: "ss-block", key: "safeSignBlock" },
};

// UTXO Safe Sign — pre-signing review surface powered by the UTXO Security Core. Collapsed
// by default into a single verdict chip (Uniswap-clean); expands to the full check list.
export function SafeSign({ t, review }: { t: Messages; review: SafeSignReview }) {
  const [open, setOpen] = useState(review.decision !== "safe");
  const meta = DECISION_META[review.decision];

  return (
    <div className={`safesign ${meta.cls}`}>
      <button type="button" className="safesign-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="safesign-shield" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <span className="safesign-title">
          <strong>{t.safeSignTitle}</strong>
          <em>{String(t[meta.key])} · {review.score}/100</em>
        </span>
        <span className="safesign-chev" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <ul className="safesign-checks">
          {review.checks.map((c) => (
            <li key={c.id} className={`ss-${c.status}`}>
              <span className="ss-ico" aria-hidden="true">{c.status === "pass" ? "✓" : c.status === "warn" ? "!" : "✕"}</span>
              <span className="ss-text"><strong>{c.label}</strong>{c.detail ? <em>{c.detail}</em> : null}</span>
            </li>
          ))}
          <li className="safesign-foot">{t.safeSignPoweredBy}</li>
        </ul>
      )}
    </div>
  );
}
