// VigiSwap edge anti-bot middleware (Cloudflare Pages Functions).
//
// Philosophy: the PUBLIC PAGES stay 100% crawlable (SEO + LLM discovery depend on it), so we
// never challenge or block page requests here. We ONLY guard the signed `/api/*` endpoints —
// which exist solely for our own front-end — against scrapers, hotlinking and automated abuse.
// The checks are deliberately conservative to avoid ever blocking a real user mid-swap:
//   1. Block obvious automation user-agents (curl/python/scrapy/headless/etc.).
//   2. Block cross-site API calls (the app only ever calls its own API same-origin).
// Everything else (real browsers, dapp webviews) passes through untouched.

const BAD_UA = /(curl|wget|python-requests|python-urllib|libwww|aiohttp|scrapy|httpclient|go-http-client|okhttp|java\/|axios\/|node-fetch|httpx|phantomjs|headlesschrome|puppeteer|playwright|selenium|bot\b|spider|crawler|scrape)/i;

function deny(reason: string): Response {
  return new Response(JSON.stringify({ error: "Forbidden", reason }), {
    status: 403,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // Only the API surface is guarded; pages are left fully open to crawlers and users.
  if (!url.pathname.startsWith("/api/")) return next();

  // Let CORS preflights resolve in the function itself.
  if (request.method === "OPTIONS") return next();

  const ua = (request.headers.get("user-agent") || "").trim();
  if (!ua || BAD_UA.test(ua)) return deny("automation");

  // The front-end only ever calls its own API same-origin/same-site. Cross-site calls to the
  // signed endpoints are hotlinking/abuse — drop them (real same-origin fetches are unaffected;
  // browsers that omit the header are allowed through to avoid false positives).
  const sfs = (request.headers.get("sec-fetch-site") || "").toLowerCase();
  if (sfs === "cross-site" || sfs === "cross-origin") return deny("cross-site");

  return next();
};
