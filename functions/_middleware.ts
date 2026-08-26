// VigiSwap edge guard (Cloudflare Pages Functions).
//
// The public PAGES stay fully crawlable — SEO and LLM discovery depend on it — so nothing here
// challenges or blocks a page request. What is guarded is `/api/*`, which exists only for this
// site's own front end and carries provider API keys on the server side.
//
// The previous version denied a request when it declared itself cross-site and allowed it
// otherwise. Absence of evidence is not evidence: a caller who simply did not send
// `Sec-Fetch-Site`, with a browser-shaped `User-Agent`, walked straight through and had a free,
// keyed LI.FI and OKX proxy — our quota, our keys, our reputation (M-07, audit 2026-08-26).
//
// It is the other way round now: a request reaches the API only if it PROVES it came from this
// site, through a browser's own `Sec-Fetch-Site` or through an `Origin`/`Referer` that belongs to
// us. Anything that proves nothing is refused.
//
// Header attribution stops hotlinking and casual scraping. It does not stop somebody who forges
// headers, and it is not pretended to: the control that does is a rate limit, and a rate limit
// needs durable state. If a `RATE_LIMIT` KV namespace is bound, the per-address ceiling below is
// enforced; without the binding the site says so in its response headers rather than implying a
// protection it does not have.

const BAD_UA =
  /(curl|wget|python-requests|python-urllib|libwww|aiohttp|scrapy|httpclient|go-http-client|okhttp|java\/|axios\/|node-fetch|httpx|phantomjs|headlesschrome|puppeteer|playwright|selenium|bot\b|spider|crawler|scrape)/i;

/** Hosts whose pages are allowed to call this API. */
const ALLOWED_HOSTS = new Set([
  "vigiswap.com",
  "www.vigiswap.com",
  "vigiswap.pages.dev",
  "localhost",
  "127.0.0.1",
]);

/** Requests per address per window, when durable state is available to count them. */
const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type Env = {
  RATE_LIMIT?: KVNamespace;
};

function hostAllowed(rawUrl: string | null): boolean {
  if (!rawUrl) return false;
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return ALLOWED_HOSTS.has(host) || host.endsWith(".vigiswap.pages.dev");
  } catch {
    return false;
  }
}

function deny(reason: string, status = 403): Response {
  return new Response(JSON.stringify({ error: "Forbidden", reason }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** Count this address's requests in the current window. Returns false when it is over the limit. */
async function withinRateLimit(env: Env, address: string): Promise<boolean | null> {
  if (!env.RATE_LIMIT) return null;
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `rl:${address}:${window}`;
  const current = Number((await env.RATE_LIMIT.get(key)) ?? "0");
  if (current >= RATE_LIMIT_REQUESTS) return false;
  await env.RATE_LIMIT.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2,
  });
  return true;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/")) return next();
  if (request.method === "OPTIONS") return next();

  const ua = (request.headers.get("user-agent") || "").trim();
  if (!ua || BAD_UA.test(ua)) return deny("automation");

  const site = (request.headers.get("sec-fetch-site") || "").toLowerCase();
  const attributedToUs =
    hostAllowed(request.headers.get("origin")) || hostAllowed(request.headers.get("referer"));
  const browserSaysSameSite = site === "same-origin" || site === "same-site";

  // A page of ours fetching its own API is always same-origin. Anything else has to name the page
  // it came from, and that page has to be one of ours.
  if (!browserSaysSameSite && !attributedToUs) {
    return deny(site ? "cross-site" : "unattributed");
  }

  const address = request.headers.get("cf-connecting-ip") || "unknown";
  const allowed = await withinRateLimit(env, address);
  if (allowed === false) return deny("rate-limited", 429);

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("x-vigiswap-rate-limit", allowed === null ? "unenforced-no-binding" : "enforced");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
