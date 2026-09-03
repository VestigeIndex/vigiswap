import { describe, expect, it } from "vitest";
import { analyzeSwap, authorizePreparedTransaction, reviewExactTransaction } from "./securityCore";

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
  it("requires the UTXO SDK review before a route carries an exact transaction", () => {
    const review = analyzeSwap({
      ...base,
      recipientRequestedForConnectedWallet: true,
      routeVerified: true,
    });

    expect(review.decision).toBe("review");
    expect(review.checks.find((check) => check.id === "route-binding")?.status).toBe("pass");
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

  it("uses the UTXO SDK signer boundary to deny a mutated reviewed request", () => {
    const transaction = {
      to: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
      data: "0x12345678" as const,
      value: 0n,
      chainId: 137,
    };
    const prepared = reviewExactTransaction(transaction, true);

    expect(authorizePreparedTransaction(prepared, transaction).mayReachSigner).toBe(true);
    expect(authorizePreparedTransaction(prepared, { ...transaction, data: "0x87654321" }).mayReachSigner).toBe(false);
  });
});

