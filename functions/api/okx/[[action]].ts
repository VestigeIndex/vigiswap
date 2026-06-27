// VigiSwap Pages Function: signed gateway to the OKX DEX Aggregator API V6.
// OKX is one of the two EXECUTABLE swap engines (alongside LI.FI). Every call is signed
// server-side with HMAC-SHA256 over (timestamp + method + requestPath + body) using the
// OKX credentials kept as Cloudflare secrets — the browser never sees them.
//
// Host: https://web3.okx.com   Base path: /api/v6/dex/aggregator/<action>
// Actions: quote | swap | approve-transaction  (V6 uses `chainIndex`, not `chainId`).
type Env = {
  OKX_API_KEY?: string;
  OKX_SECRET_KEY?: string;
  OKX_API_PASSPHRASE?: string;
  OKX_PROJECT_ID?: string;
};

const OKX_HOST = "https://web3.okx.com";
const BASE = "/api/v6/dex/aggregator";

// Only these actions and query params are forwarded upstream (allow-list).
const ACTIONS = new Set(["quote", "swap", "approve-transaction"]);
const ALLOWED_PARAMS = new Set([
  "chainIndex",
  "amount",
  "fromTokenAddress",
  "toTokenAddress",
  "slippage",
  "slippagePercent",
  "userWalletAddress",
  "swapReceiverAddress",
  "tokenContractAddress",
  "approveAmount",
  "dexIds",
  "priceImpactProtectionPercentage",
  "feePercent",
  "fromTokenReferrerWalletAddress",
  "toTokenReferrerWalletAddress",
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function b64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64(mac);
}

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: CORS });

  const actionParam = params?.action;
  const action = Array.isArray(actionParam) ? actionParam.join("/") : String(actionParam || "");
  if (!ACTIONS.has(action)) {
    return new Response(JSON.stringify({ error: `Unknown OKX action: ${action}` }), {
      status: 404,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  const { OKX_API_KEY, OKX_SECRET_KEY, OKX_API_PASSPHRASE, OKX_PROJECT_ID } = env;
  if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_API_PASSPHRASE) {
    return new Response(JSON.stringify({ error: "OKX engine not configured", code: "no-okx-secrets" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
    });
  }

  // Build the upstream query from the allow-listed params only (sorted for a stable path).
  const incoming = new URL(request.url).searchParams;
  const upstream = new URLSearchParams();
  for (const k of [...incoming.keys()].sort()) {
    if (ALLOWED_PARAMS.has(k)) upstream.set(k, incoming.get(k) as string);
  }
  const requestPath = `${BASE}/${action}?${upstream.toString()}`;
  const timestamp = new Date().toISOString();
  const signature = await sign(OKX_SECRET_KEY, `${timestamp}GET${requestPath}`);

  const headers = new Headers({
    accept: "application/json",
    "OK-ACCESS-KEY": OKX_API_KEY,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": OKX_API_PASSPHRASE,
  });
  if (OKX_PROJECT_ID) headers.set("OK-ACCESS-PROJECT", OKX_PROJECT_ID);

  try {
    const res = await fetch(`${OKX_HOST}${requestPath}`, { method: "GET", headers });
    return new Response(res.body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
        ...CORS,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "OKX request failed" }),
      { status: 502, headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS } },
    );
  }
};

export const onRequestGet = onRequest;
export const onRequestOptions = onRequest;
