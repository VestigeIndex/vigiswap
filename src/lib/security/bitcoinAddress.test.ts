import { describe, expect, it } from "vitest";
import { verifyBech32Address, verifyBitcoinAddress } from "./bitcoinAddress";

describe("bitcoin destination", () => {
  it("accepts the address shapes people actually paste", async () => {
    // Satoshi's, a well-known P2SH, the BIP-173 test vector, and a Taproot address.
    const cases = [
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0",
    ];
    for (const address of cases) {
      const verdict = await verifyBitcoinAddress(address);
      expect(verdict, address).toMatchObject({ ok: true, network: "mainnet" });
    }
  });

  it("refuses an address with one character changed", async () => {
    // The whole reason Bitcoin addresses carry a checksum.
    const verdict = await verifyBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb");
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain("checksum");
  });

  it("refuses a truncated bech32 address", async () => {
    const verdict = await verifyBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7k");
    expect(verdict.ok).toBe(false);
  });

  it("refuses a testnet address for a mainnet swap", async () => {
    // Well-formed, and the coins are gone all the same.
    const verdict = await verifyBitcoinAddress("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", "mainnet");
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain("testnet");
  });

  it("accepts that same testnet address when the swap settles on testnet", async () => {
    const verdict = await verifyBitcoinAddress("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", "testnet");
    expect(verdict).toMatchObject({ ok: true, network: "testnet" });
  });

  it("refuses an Ethereum address pasted into the Bitcoin box", async () => {
    const verdict = await verifyBitcoinAddress("0x1111111111111111111111111111111111111111");
    expect(verdict.ok).toBe(false);
  });

  it("refuses an empty destination with a useful message", async () => {
    const verdict = await verifyBitcoinAddress("   ");
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain("Enter the Bitcoin address");
  });

  it("refuses a mixed-case address, which bech32 forbids", () => {
    const verdict = verifyBech32Address("bc1QW508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
    expect(verdict.ok).toBe(false);
  });

  it("refuses a witness version 1 program signed with the version 0 checksum", () => {
    // The bech32/bech32m distinction: a Taproot address that used the old constant is not valid,
    // and accepting it would send to an address nobody controls.
    const verdict = verifyBech32Address("bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq0000000");
    expect(verdict.ok).toBe(false);
  });
});
