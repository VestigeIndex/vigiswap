// OKX DEX aggregator quote — SIGNED server-side. OKX requires HMAC-SHA256 request signing
// with the secret key, so this must run in the Function (never the browser). Credentials come
// from Cloudflare secrets (OKX_API_KEY / OKX_SECRET_KEY / OKX_API_PASSPHRASE / OKX_PROJECT_ID).
// This is a COMPARISON quote source only (price), exactly like Velora/Odos — not executable.
type Env = {
  OKX_API_KEY?: string;
  OKX_SECRET_KEY?: string;
  OKX_API_PASSPHRASE?: string;
  OKX_PROJECT_ID?: string;
};

const OKX_HOST = "https://www.okx.com";
const QUOTE_PATH = "/api/v5/dex/aggregator/quote";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
  });
}

async function hmacBase64(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  let binary = "";
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.OKX_API_KEY || !env.OKX_SECRET_KEY || !env.OKX_API_PASSPHRASE) {
    return json({ error: "OKX credentials not configured" }, 503);
  }

  const incoming = new URL(request.url);
  // Whitelist the params we forward to OKX.
  const params = new URLSearchParams();
  for (const k of ["chainId", "amount", "fromTokenAddress", "toTokenAddress", "slippage"]) {
    const v = incoming.searchParams.get(k);
    if (v) params.set(k, v);
  }

  const requestPath = `${QUOTE_PATH}?${params.toString()}`;
  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}GET${requestPath}`;

  try {
    const sign = await hmacBase64(env.OKX_SECRET_KEY, prehash);
    const headers: Record<string, string> = {
      "OK-ACCESS-KEY": env.OKX_API_KEY,
      "OK-ACCESS-SIGN": sign,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": env.OKX_API_PASSPHRASE,
      "Content-Type": "application/json",
    };
    if (env.OKX_PROJECT_ID) headers["OK-ACCESS-PROJECT"] = env.OKX_PROJECT_ID;

    const upstream = await fetch(`${OKX_HOST}${requestPath}`, { method: "GET", headers });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "OKX request failed" }, 502);
  }
};
