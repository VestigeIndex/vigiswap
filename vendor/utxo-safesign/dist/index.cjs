"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  KNOWN_BAD: () => KNOWN_BAD,
  KNOWN_DOMAINS: () => KNOWN_DOMAINS,
  analyzeCall: () => analyzeCall,
  analyzeDomain: () => analyzeDomain,
  analyzeTypedData: () => analyzeTypedData,
  colToLetter: () => colToLetter,
  decodeCallData: () => decodeCallData,
  formatAmount: () => formatAmount,
  isError: () => isError,
  letterToCol: () => letterToCol,
  scoreReport: () => scoreReport,
  shortAddr: () => shortAddr
});
module.exports = __toCommonJS(index_exports);
var KNOWN_DOMAINS = [
  "metamask.io",
  "coinbase.com",
  "coinbase.com",
  "binance.com",
  "uniswap.org",
  "app.uniswap.org",
  "pancakeswap.finance",
  "opensea.io",
  "rarible.com",
  "magiceden.io",
  "ledger.com",
  "trezor.io",
  "rabby.io",
  "etherscan.io",
  "polygonscan.com",
  "arbiscan.io",
  "optimistic.etherscan.io",
  "ens.domains",
  "app.ens.domains",
  "aave.com",
  "compound.finance",
  "curve.fi",
  "balancer.fi",
  "lido.fi",
  "rocketpool.net",
  "frax.finance",
  "1inch.io",
  "0x.org",
  "matcha.xyz",
  "kraken.com",
  "gemini.com",
  "bitstamp.net",
  "phantom.app",
  "solflare.com",
  "utxosuite.com",
  "www.utxosuite.com"
];
var KNOWN_BAD = [
  /metamask-?(?:io|wallet|app|verify|connect|update|support|login)\..*$/i,
  /-?metamask\.com$/i,
  /(?:coinbase|binance|uniswap|opensea|ledger|trezor)-?(?:claim|verify|airdrop|support|update|reward|recover)\..*$/i
];
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}
function analyzeDomain(domain) {
  const signals = [];
  const d = domain.toLowerCase().replace(/^www\./, "");
  if (KNOWN_DOMAINS.includes(d) || KNOWN_DOMAINS.includes(`www.${d}`)) {
    return {
      level: "safe",
      score: 5,
      signals: [{ code: "VERIFIED", level: "safe", title: "Verified domain", description: "This domain is on the UTXO Guard verified list." }]
    };
  }
  for (const re of KNOWN_BAD) {
    if (re.test(d)) {
      signals.push({ code: "PHISH_PATTERN", level: "critical", title: "Known phishing pattern", description: `Domain matches a known phishing pattern (${re.source}).` });
    }
  }
  let closest = "", best = Infinity;
  for (const k of KNOWN_DOMAINS) {
    const dist = levenshtein(d, k);
    if (dist < best) {
      best = dist;
      closest = k;
    }
  }
  if (best > 0 && best <= 2 && d !== closest) {
    signals.push({
      code: "TYPOSQUAT",
      level: "critical",
      title: "Lookalike of " + closest,
      description: `This domain is only ${best} character${best > 1 ? "s" : ""} different from the legitimate ${closest}. Typosquatting is a common way to drain wallets.`
    });
  }
  const suspiciousTlds = [".xyz", ".click", ".top", ".monster", ".cyou", ".ml", ".tk", ".gq"];
  if (suspiciousTlds.some((tld) => d.endsWith(tld))) {
    signals.push({ code: "TLD", level: "low", title: "Uncommon TLD", description: `Top-level domain "${d.match(/\.[^.]+$/)?.[0]}" is overrepresented in scams. Not a guarantee of risk, just a flag.` });
  }
  if (/^(?:[a-z0-9-]+\.){3,}[a-z]+$/.test(d) && d.length > 30) {
    signals.push({ code: "DEEP_SUBDOMAIN", level: "low", title: "Deep subdomain", description: "Many nested subdomains can hide the real owner. Verify the registered domain before connecting." });
  }
  if (/(?:xn--|punycode)/.test(d)) {
    signals.push({ code: "PUNYCODE", level: "high", title: "Punycode / IDN domain", description: "Domain uses internationalized characters. Easy to spoof \u2014 verify spelling carefully." });
  }
  if (/\d{4,}/.test(d.split(".")[0])) {
    signals.push({ code: "NUMERIC", level: "low", title: "Numeric domain", description: "Long numeric sequences in the domain name are unusual for legitimate dApps." });
  }
  if (typeof location !== "undefined" && location.protocol === "http:") {
    signals.push({ code: "HTTP", level: "high", title: "Not HTTPS", description: "This page is served over plain HTTP \u2014 never sign or connect a wallet here." });
  }
  return scoreReport(signals);
}
var MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
var HUGE_ALLOWANCE = BigInt("0xffffffffffffffffffffffffffffffffffffffff");
function strip0x(s) {
  return s.startsWith("0x") ? s.slice(2) : s;
}
function decodeCallData(data) {
  if (!data) return null;
  const hex = strip0x(data);
  if (hex.length < 8) return null;
  const selector = "0x" + hex.slice(0, 8).toLowerCase();
  const args = hex.slice(8);
  function readAddress(at) {
    return "0x" + args.slice(at + 24, at + 64).toLowerCase();
  }
  function readUint(at) {
    return BigInt("0x" + (args.slice(at, at + 64) || "0"));
  }
  switch (selector) {
    case "0x095ea7b3": {
      const spender = readAddress(0);
      const amount = readUint(64);
      return { kind: "erc20_approve", spender, amount, unlimited: amount >= HUGE_ALLOWANCE };
    }
    case "0x39509351": {
      return { kind: "erc20_increase", spender: readAddress(0), delta: readUint(64) };
    }
    case "0xd505accf": {
      const owner = readAddress(0);
      const spender = readAddress(64);
      const value = readUint(128);
      const deadline = readUint(192);
      return { kind: "permit", owner, spender, value, deadline };
    }
    case "0xa22cb465": {
      const operator = readAddress(0);
      const approved = readUint(64) !== 0n;
      return { kind: "nft_setApprovalForAll", operator, approved };
    }
    case "0xa9059cbb": {
      return { kind: "transfer", to: readAddress(0), amount: readUint(64) };
    }
  }
  return { kind: "raw", selector, bytes: data };
}
function analyzeTypedData(input) {
  if (!input || typeof input !== "object") return null;
  const obj = input;
  const domain = (obj.domain && typeof obj.domain === "object" ? obj.domain.name : "") || "";
  const primaryType = String(obj.primaryType ?? "");
  const message = obj.message ?? {};
  const signals = [];
  const isPermit2 = primaryType === "PermitSingle" || primaryType === "PermitBatch" || typeof domain === "string" && domain.includes("Permit2");
  let isUnlimitedPermit = false;
  if (primaryType.includes("Permit")) {
    const value = message.value ?? message.amount;
    if (typeof value === "string" || typeof value === "number") {
      try {
        const v = BigInt(String(value));
        if (v >= HUGE_ALLOWANCE) {
          isUnlimitedPermit = true;
          signals.push({
            code: "PERMIT_UNLIMITED",
            level: "critical",
            title: "Unlimited Permit signature",
            description: `This signature gives spender unlimited allowance via EIP-2612 Permit. If signed, the contract can drain that token at any time.`
          });
        }
      } catch {
      }
    }
    if (!isUnlimitedPermit) {
      signals.push({
        code: "PERMIT",
        level: "medium",
        title: "Permit / off-chain approval",
        description: "EIP-2612 Permit signatures are off-chain approvals. They don't show in your wallet transaction history but are equally powerful as on-chain approvals."
      });
    }
  }
  return { domain: String(domain), primaryType, isPermit2, isUnlimitedPermit, message, signals };
}
function analyzeCall(call) {
  const out = [];
  switch (call.kind) {
    case "erc20_approve":
      if (call.unlimited) {
        out.push({
          code: "APPROVE_UNLIMITED",
          level: "critical",
          title: "Unlimited token approval",
          description: `You are about to grant ${shortAddr(call.spender)} unlimited spending of this token. If the spender contract is compromised, every coin you hold of this token can be drained.`
        });
      } else if (call.amount === 0n) {
        out.push({ code: "APPROVE_ZERO", level: "safe", title: "Revoking approval", description: "Approval set to 0 \u2014 this revokes the spender's allowance." });
      } else {
        out.push({ code: "APPROVE", level: "medium", title: "Token approval", description: `Grants ${shortAddr(call.spender)} the ability to spend up to ${formatAmount(call.amount)} units of this token.` });
      }
      break;
    case "erc20_increase":
      out.push({ code: "APPROVE_INCREASE", level: "medium", title: "Increasing approval", description: `Adds ${formatAmount(call.delta)} units to ${shortAddr(call.spender)}'s allowance.` });
      break;
    case "permit":
      out.push({ code: "PERMIT_CALL", level: "high", title: "On-chain permit call", description: `Spender ${shortAddr(call.spender)} can pull up to ${formatAmount(call.value)} units before block timestamp ${call.deadline}.` });
      break;
    case "nft_setApprovalForAll":
      if (call.approved) out.push({
        code: "NFT_APPROVE_ALL",
        level: "critical",
        title: "NFT collection-wide approval",
        description: `You are granting ${shortAddr(call.operator)} permission to transfer ANY NFT you own in this collection. Common wallet-drainer technique.`
      });
      else out.push({ code: "NFT_REVOKE", level: "safe", title: "Revoking NFT approval", description: "setApprovalForAll(false) \u2014 revokes operator's collection-wide approval." });
      break;
    case "transfer":
      out.push({ code: "TRANSFER", level: "low", title: "Token transfer", description: `Sending ${formatAmount(call.amount)} units to ${shortAddr(call.to)}.` });
      break;
    case "raw":
      out.push({ code: "UNKNOWN_METHOD", level: "medium", title: "Unknown contract method", description: `Method selector ${call.selector}. UXG could not decode it \u2014 proceed only if you know what this contract does.` });
      break;
  }
  return out;
}
function scoreReport(signals) {
  const weights = { safe: 0, low: 6, medium: 18, high: 40, critical: 80 };
  let score = 0;
  for (const s of signals) score = Math.min(100, score + weights[s.level]);
  let level = "safe";
  if (score >= 80) level = "critical";
  else if (score >= 40) level = "high";
  else if (score >= 18) level = "medium";
  else if (score >= 6) level = "low";
  return { level, score, signals };
}
function shortAddr(a) {
  if (!a || a.length < 10) return a;
  return a.slice(0, 6) + "\u2026" + a.slice(-4);
}
function formatAmount(a) {
  if (a >= HUGE_ALLOWANCE) return "UNLIMITED";
  const s = a.toString();
  if (s.length > 18) return s.slice(0, -18) + "." + s.slice(-18).slice(0, 4).replace(/0+$/, "") + " (assuming 18 dp)";
  return s;
}
var FORMULA_ERRORS = /* @__PURE__ */ new Set([
  "#DIV/0!",
  "#VALUE!",
  "#REF!",
  "#NAME?",
  "#NUM!",
  "#N/A",
  "#ERROR!"
]);
function isError(value) {
  return typeof value === "string" && FORMULA_ERRORS.has(value);
}
function colToLetter(col) {
  if (!Number.isInteger(col) || col < 0) {
    throw new RangeError("Column index must be a non-negative integer.");
  }
  let n = col + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}
function letterToCol(letter) {
  const clean = letter.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(clean)) {
    throw new RangeError("Column letters must contain A-Z only.");
  }
  let n = 0;
  for (const ch of clean) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KNOWN_BAD,
  KNOWN_DOMAINS,
  analyzeCall,
  analyzeDomain,
  analyzeTypedData,
  colToLetter,
  decodeCallData,
  formatAmount,
  isError,
  letterToCol,
  scoreReport,
  shortAddr
});

