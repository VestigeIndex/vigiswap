import { describe, expect, it } from "vitest";
import { analyzeSwap } from "./securityCore";

const base = {
  tokenSymbol: "USDC",
  tokenName: "USD Coin",
  isNative: false,
  approvalAddress: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  unlimitedApproval: false,
  priceImpactPct: -0.2,
  routeProvider: "LI.FI",
  hasExecutableTx: true,
};

describe("VigiSwap SafeSign review", () => {
  it("allows a prepared, intent-bound same-chain route", () => {
    const review = analyzeSwap({
      ...base,
      recipientRequestedForConnectedWallet: true,
      routeVerified: true,
    });

    expect(review.decision).toBe("safe");
    expect(review.checks.find((check) => check.id === "route")?.status).toBe("pass");
  });

  it("blocks a quote whose requested recipient is not the connected wallet", () => {
    const review = analyzeSwap({
      ...base,
      recipientRequestedForConnectedWallet: false,
      routeVerified: true,
    });

    expect(review.decision).toBe("block");
    expect(review.checks.find((check) => check.id === "recipient")?.status).toBe("fail");
  });

  it("requires review until an unsigned route is prepared and verified", () => {
    const review = analyzeSwap({
      ...base,
      recipientRequestedForConnectedWallet: true,
      routeVerified: false,
    });

    expect(review.decision).toBe("review");
  });
});
