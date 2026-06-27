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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const pathParam = params?.path;
  const pathArr = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
  const key = pathArr.filter(Boolean).join("/");
  const route = ROUTES[key];
  if (!route) {
    return new Response(JSON.stringify({ error: `Unknown upstream: ${key}` }), {
      status: 404,
      headers: { "content-type": "application/json", ...CORS },
    });
  }
  if (method !== route.method) {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
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
        ...CORS,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Upstream request failed" }),
      { status: 502, headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS } },
    );
  }
};

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
export const onRequestOptions = onRequest;
