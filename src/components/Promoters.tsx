import type { Messages } from "@/lib/types";

export function Promoters({ t }: { t: Messages }) {
  return (
    <section className="promoters" aria-label={t.promoters}>
      <span>{t.promoters}</span>
      <div className="promoter-logos">
        <img src="/logo/utxo-labs.svg" alt="UTXO Labs Team" />
      </div>
    </section>
  );
}
