"use client";

import type { Messages } from "@/lib/types";

export type TxStage = "idle" | "approving" | "swapping" | "pending" | "confirmed" | "failed";

export function TransactionTimeline({
  t,
  stage,
  explorerUrl,
}: {
  t: Messages;
  stage: TxStage;
  explorerUrl?: string;
}) {
  if (stage === "idle") return null;

  const steps: { key: TxStage; label: string }[] = [
    { key: "approving", label: t.txApproving },
    { key: "swapping", label: t.txSubmitting },
    { key: "pending", label: t.txPending },
    { key: "confirmed", label: t.txConfirmed },
  ];

  const order = ["approving", "swapping", "pending", "confirmed"];
  const currentIdx = order.indexOf(stage === "failed" ? "pending" : stage);

  return (
    <div className={`tx-timeline${stage === "failed" ? " tx-failed" : ""}`} role="status" aria-live="polite">
      {steps.map((s, i) => {
        const done = i < currentIdx || stage === "confirmed";
        const active = i === currentIdx && stage !== "confirmed";
        return (
          <div key={s.key} className={`tx-step${done ? " done" : ""}${active ? " active" : ""}`}>
            <span className="tx-dot" aria-hidden="true" />
            <span>{s.label}</span>
          </div>
        );
      })}
      {stage === "failed" ? <div className="tx-step failed"><span className="tx-dot" />{t.txFailed}</div> : null}
      {explorerUrl ? (
        <a className="tx-explorer" href={explorerUrl} target="_blank" rel="noreferrer">{t.viewExplorer}</a>
      ) : null}
    </div>
  );
}
