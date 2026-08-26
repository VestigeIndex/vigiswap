// VigiSwap Pages Function: server-side gateway to the SAME upstream data sources that
// VestigeIndex uses (LI.FI today; 1inch / Velora added with the multi-provider engine).
// We call the upstreams DIRECTLY rather than proxying through vestigeindex.com, because
// Cloudflare blocks Worker->Worker fetches between the two zones (HTTP 1010). Any provider
// API key stays server-side in this function's env and is never exposed to the browser.
type Env = {
  LIFI_API_KEY?: string;
  ONEINCH_API_KEY?: string;
};

type Upstream = {
  url: string;
  method: "GET" | "POST";
  keyEnv?: keyof Env;
  keyHeader?: string;
  cache?: string;
  forwardQuery?: boolean;
};

// Map of "<provider>/<action>" -> real upstream. Mirrors VestigeIndex's own proxies.
const ROUTES: Record<string, Upstream> = {
  "lifi/routes": { url: "https://li.quest/v1/advanced/routes", method: "POST", keyEnv: "LIFI_API_KEY", keyHeader: "x-lifi-api-key", cache: "no-store" },
  "lifi/tokens": { url: "https://li.quest/v1/tokens", method: "GET", keyEnv: "LIFI_API_KEY", keyHeader: "x-lifi-api-key", forwardQuery: true, cache: "public, max-age=1800, stale-while-revalidate=3600" },
  "lifi/chains": { url: "https://li.quest/v1/chains", method: "GET", keyEnv: "LIFI_API_KEY", keyHeader: "x-lifi-api-key", forwardQuery: true, cache: "public, max-age=3600" },
  "lifi/quote": { url: "https://li.quest/v1/quote", method: "GET", keyEnv: "LIFI_API_KEY", keyHeader: "x-lifi-api-key", forwardQuery: true, cache: "no-store" },
};

// `*` made this a public API for anybody who found the URL. It is not a public API: it exists for
// this site's own pages and it spends this site's provider quota (M-07, audit 2026-08-26). The
// browser's own page never needs CORS at all — it calls same-origin — so the only origins echoed
// back are ours, and an unknown origin gets no CORS header and therefore no answer it can read.
const ALLOWED_ORIGINS = new Set([
  "https://vigiswap.com",
  "https://www.vigiswap.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function corsFor(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".vigiswap.pages.dev"))) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(request) });

  const pathParam = params?.path;
  const pathArr = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
  const key = pathArr.filter(Boolean).join("/");
  const route = ROUTES[key];
  if (!route) {
    return new Response(JSON.stringify({ error: `Unknown upstream: ${key}` }), {
      status: 404,
      headers: { "content-type": "application/json", ...corsFor(request) },
    });
  }
  if (method !== route.method) {
    return new Response("Method Not Allowed", { status: 405, headers: corsFor(request) });
  }

  const target = new URL(route.url);
  if (route.forwardQuery) {
    new URL(request.url).searchParams.forEach((value, k) => target.searchParams.set(k, value));
  }

  const headers = new Headers({ accept: "application/json" });
  if (route.method === "POST") headers.set("content-type", "application/json");
  const apiKey = route.keyEnv ? env[route.keyEnv] : undefined;
  if (apiKey && route.keyHeader) headers.set(route.keyHeader, apiKey);

  try {
    const upstream = await fetch(target.toString(), {
      method: route.method,
      headers,
      body: route.method === "POST" ? await request.text() : undefined,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": upstream.status === 200 ? (route.cache || "no-store") : "no-store",
        ...corsFor(request),
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Upstream request failed" }),
      { status: 502, headers: { "content-type": "application/json", "cache-control": "no-store", ...corsFor(request) } },
    );
  }
};

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
export const onRequestOptions = onRequest;
