import { describe, expect, it } from "vitest";
import { ROUTE_TTL_MS, buildSwapIntent, verifyRouteExecution } from "./routeGuard";

const ACCOUNT = "0x1111111111111111111111111111111111111111";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const LIFI = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";
const ATTACKER = "0xbadbadbadbadbadbadbadbadbadbadbadbadbad0";
const NATIVE = "0x0000000000000000000000000000000000000000";

const NOW = 1_800_000_000_000;

function intent(overrides: Partial<ReturnType<typeof buildSwapIntent>> = {}) {
  return buildSwapIntent({
    chainId: 1,
    fromToken: USDC,
    toToken: WETH,
    amount: "1000000",
    account: ACCOUNT,
    slippageBps: 50,
    crossChain: false,
    createdAt: NOW,
    ...overrides,
  });
}

describe("route execution guard", () => {
  it("accepts a reviewed router that matches the trade", () => {
    const verdict = verifyRouteExecution({
      intent: intent(),
      tx: { to: LIFI, data: "0xdeadbeef", value: 0n, chainId: 1 },
      spender: LIFI,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW + 1_000,
    });
    expect(verdict.reasons).toEqual([]);
    expect(verdict.ok).toBe(true);
  });

  it("refuses a contract that is not a reviewed router", () => {
    const verdict = verifyRouteExecution({
      intent: intent(),
      tx: { to: ATTACKER, data: "0xdeadbeef", value: 0n, chainId: 1 },
      spender: ATTACKER,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join(" ")).toContain("not a reviewed router");
  });

  it("refuses when the approved spender is not the contract being called", () => {
    const verdict = verifyRouteExecution({
      intent: intent(),
      tx: { to: LIFI, data: "0xdeadbeef", value: 0n, chainId: 1 },
      spender: ATTACKER,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join(" ")).toContain("not the contract being called");
  });

  it("refuses a token trade that also sends native value", () => {
    const verdict = verifyRouteExecution({
      intent: intent(),
      tx: { to: LIFI, data: "0x01", value: "5000000000000000000", chainId: 1 },
      spender: LIFI,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join(" ")).toContain("no native value");
  });

  it("requires a native trade to send exactly what was entered", () => {
    const nativeIntent = intent({ fromToken: NATIVE, amount: "1000000000000000000" });
    const wrong = verifyRouteExecution({
      intent: nativeIntent,
      tx: { to: LIFI, data: "0x01", value: "2000000000000000000", chainId: 1 },
      outputAmount: "1000000",
      minimumReceived: "997000",
      now: NOW,
    });
    expect(wrong.ok).toBe(false);
    expect(wrong.reasons.join(" ")).toContain("exactly the amount entered");

    const right = verifyRouteExecution({
      intent: nativeIntent,
      tx: { to: LIFI, data: "0x01", value: "1000000000000000000", chainId: 1 },
      outputAmount: "1000000",
      minimumReceived: "997000",
      now: NOW,
    });
    expect(right.ok).toBe(true);
  });

  it("refuses a missing or too-low minimum received", () => {
    const none = verifyRouteExecution({
      intent: intent(),
      tx: { to: LIFI, data: "0x01", value: 0n, chainId: 1 },
      spender: LIFI,
      outputAmount: "1000000000000000",
      now: NOW,
    });
    expect(none.reasons.join(" ")).toContain("no minimum received");

    const low = verifyRouteExecution({
      intent: intent(),
      tx: { to: LIFI, data: "0x01", value: 0n, chainId: 1 },
      spender: LIFI,
      outputAmount: "1000000000000000",
      minimumReceived: "500000000000000",
      now: NOW,
    });
    expect(low.reasons.join(" ")).toContain("below the slippage");
  });

  it("keeps cross-chain trades quote-only", () => {
    const verdict = verifyRouteExecution({
      intent: intent({ crossChain: true }),
      tx: { to: LIFI, data: "0x01", value: 0n, chainId: 1 },
      spender: LIFI,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join(" ")).toContain("quote-only");
  });

  it("refuses a stale quote", () => {
    const verdict = verifyRouteExecution({
      intent: intent(),
      tx: { to: LIFI, data: "0x01", value: 0n, chainId: 1 },
      spender: LIFI,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW + ROUTE_TTL_MS + 1,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join(" ")).toContain("older than the site will sign for");
  });

  it("reports the call as it would be signed, even when refusing", () => {
    const verdict = verifyRouteExecution({
      intent: intent(),
      tx: { to: ATTACKER, data: "0xabcdef", value: 0n, chainId: 1 },
      spender: ATTACKER,
      outputAmount: "1000000000000000",
      minimumReceived: "997000000000000",
      now: NOW,
    });
    expect(verdict.canonical.router).toBe(ATTACKER);
    expect(verdict.canonical.calldata).toBe("0xabcdef");
    expect(verdict.canonical.routerLabel).toBe("not a reviewed router");
  });
});
