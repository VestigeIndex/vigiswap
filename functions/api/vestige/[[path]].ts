// Cloudflare Pages Function: same-origin proxy from VigiSwap to the VestigeIndex API.
// Keeps any private key server-side and avoids cross-origin/CORS edge cases.
// VESTIGE_API_BASE is set as a Pages env var; falls back to the live WWW host.
type Env = {
  VESTIGE_API_BASE?: string;
  VESTIGE_API_KEY?: string;
};

const DEFAULT_BASE = "https://www.vestigeindex.com/api";

function safePath(parts: string[] | undefined) {
  return (parts || []).filter(Boolean).map((p) => encodeURIComponent(p)).join("/");
}

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "POST" && method !== "OPTIONS") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const base = (env.VESTIGE_API_BASE || DEFAULT_BASE).replace(/\/$/, "");
  const pathParam = params?.path;
  const pathArr = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
  const target = new URL(`${base}/${safePath(pathArr)}`);

  const incoming = new URL(request.url);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const headers = new Headers({ accept: "application/json" });
  if (method === "POST") headers.set("content-type", "application/json");
  if (env.VESTIGE_API_KEY) headers.set("authorization", `Bearer ${env.VESTIGE_API_KEY}`);

  try {
    const upstream = await fetch(target.toString(), {
      method,
      headers,
      body: method === "POST" ? await request.text() : undefined,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "VestigeIndex API request failed" }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
export const onRequestOptions = onRequest;
