import { AnimatedBackground } from "./AnimatedBackground";
import { BrandMark } from "./BrandMark";

export function LegalPage({ kind, content }: { kind: string; content: { title: string; body: readonly string[] } }) {
  return (
    <main className="vigi-page">
      <AnimatedBackground />
      <div className="legal-page">
        <header className="topbar">
          <BrandMark />
          <a className="pill" href="/">Back to swap</a>
        </header>
        <article className="legal-card">
          <div className="eyebrow"><span className="eyebrow-dot" />{kind}</div>
          <h1>{content.title}</h1>
          {content.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
      </div>
    </main>
  );
}
