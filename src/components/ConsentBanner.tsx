"use client";

import { useEffect, useState } from "react";
import type { Messages } from "@/lib/types";

export function ConsentBanner({ t }: { t: Messages }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem("vigiswap-consent") !== "set");
  }, []);

  function choose(value: "accepted" | "rejected") {
    localStorage.setItem("vigiswap-consent", "set");
    localStorage.setItem("vigiswap-consent-value", value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section className="consent" role="dialog" aria-label="Privacy consent">
      <p>{t.consent}</p>
      <div className="consent-actions">
        <button className="secondary-button" onClick={() => choose("rejected")}>{t.reject}</button>
        <button className="secondary-button strong" onClick={() => choose("accepted")}>{t.accept}</button>
      </div>
    </section>
  );
}
