import type { Messages } from "@/lib/types";

export function Promoters({ t }: { t: Messages }) {
  return (
    <section className="promoters" aria-label={t.promoters}>
      <span>{t.promoters}</span>
      <div className="promoter-logos">
        <a href="https://utxosuite.com" target="_blank" rel="noreferrer"><img src="/logo/utxosuite.svg" alt="UTXOSuite.com" /></a>
        <a href="https://idovio.com" target="_blank" rel="noreferrer"><img src="/logo/idovio.svg" alt="Idovio" /></a>
        <img src="/logo/utxo-labs.svg" alt="UTXO Labs" />
      </div>
    </section>
  );
}
