/**
 * Is this actually a Bitcoin address on the network we are sending to?
 *
 * The destination for a swap that ends in BTC was checked by asking whether the box was empty
 * (H-07, audit 2026-08-26). Everything else about it was taken on faith: a typo, a truncated
 * paste, a testnet address, or an address for another chain entirely would all have been accepted
 * and handed to a bridge, and a bridge sends where it is told. Bitcoin has carried a checksum
 * since the beginning precisely so that software does not have to guess.
 *
 * What is checked here: the base58 checksum for legacy and P2SH addresses, and the bech32/bech32m
 * checksum, prefix and witness-version rules for segwit ones — including the detail that a version
 * 0 program must be bech32 and a version 1+ program must be bech32m, which is what separates a
 * valid Taproot address from a mistyped one.
 *
 * No dependency: an address validator is thirty lines of arithmetic and one constant table, and
 * that is a smaller thing to own than a supply-chain edge on the path where funds leave.
 */

export type BitcoinNetwork = "mainnet" | "testnet";

export type AddressVerdict =
  | { ok: true; kind: "p2pkh" | "p2sh" | "segwit"; network: BitcoinNetwork }
  | { ok: false; reason: string };

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function base58Decode(input: string): Uint8Array | null {
  const bytes: number[] = [0];
  for (const character of input) {
    const value = BASE58_ALPHABET.indexOf(character);
    if (value < 0) return null;
    let carry = value;
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i]! * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const character of input) {
    if (character !== "1") break;
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", data as unknown as ArrayBuffer);
  return new Uint8Array(digest);
}

/** Legacy and P2SH addresses: 21 payload bytes followed by the first four bytes of a double SHA-256. */
export async function verifyBase58Address(address: string): Promise<AddressVerdict> {
  const decoded = base58Decode(address);
  if (!decoded || decoded.length !== 25) {
    return { ok: false, reason: "This is not a valid Bitcoin address." };
  }
  const payload = decoded.slice(0, 21);
  const checksum = decoded.slice(21);
  const expected = (await sha256(await sha256(payload))).slice(0, 4);
  if (checksum.some((byte, index) => byte !== expected[index])) {
    return {
      ok: false,
      reason: "That address fails its own checksum — it is mistyped or truncated.",
    };
  }
  const version = payload[0]!;
  if (version === 0x00) return { ok: true, kind: "p2pkh", network: "mainnet" };
  if (version === 0x05) return { ok: true, kind: "p2sh", network: "mainnet" };
  if (version === 0x6f || version === 0xc4) {
    return { ok: true, kind: version === 0x6f ? "p2pkh" : "p2sh", network: "testnet" };
  }
  return { ok: false, reason: "That address is not for the Bitcoin network." };
}

function bech32Polymod(values: number[]): number {
  const generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let checksum = 1;
  for (const value of values) {
    const top = checksum >> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) checksum ^= generator[i]!;
    }
  }
  return checksum;
}

function bech32HrpExpand(hrp: string): number[] {
  const high: number[] = [];
  const low: number[] = [];
  for (const character of hrp) {
    const code = character.charCodeAt(0);
    high.push(code >> 5);
    low.push(code & 31);
  }
  return [...high, 0, ...low];
}

/** Segwit addresses, including the bech32 / bech32m distinction that separates v0 from Taproot. */
export function verifyBech32Address(address: string): AddressVerdict {
  const lower = address.toLowerCase();
  if (address !== lower && address !== address.toUpperCase()) {
    return { ok: false, reason: "A Bitcoin address cannot mix upper and lower case." };
  }
  const separator = lower.lastIndexOf("1");
  if (separator < 1 || separator + 7 > lower.length || lower.length > 90) {
    return { ok: false, reason: "This is not a valid Bitcoin address." };
  }
  const hrp = lower.slice(0, separator);
  const network: BitcoinNetwork | null =
    hrp === "bc" ? "mainnet" : hrp === "tb" || hrp === "bcrt" ? "testnet" : null;
  if (!network) {
    return { ok: false, reason: "That address is not for the Bitcoin network." };
  }

  const data: number[] = [];
  for (const character of lower.slice(separator + 1)) {
    const value = BECH32_ALPHABET.indexOf(character);
    if (value < 0) return { ok: false, reason: "This is not a valid Bitcoin address." };
    data.push(value);
  }

  const checksum = bech32Polymod([...bech32HrpExpand(hrp), ...data]);
  const witnessVersion = data[0]!;
  // Version 0 is signed with the original bech32 constant; every later version with bech32m.
  const expected = witnessVersion === 0 ? 1 : 0x2bc830a3;
  if (checksum !== expected) {
    return {
      ok: false,
      reason: "That address fails its own checksum — it is mistyped or truncated.",
    };
  }
  if (witnessVersion > 16) {
    return { ok: false, reason: "This is not a valid Bitcoin address." };
  }

  const programLength = data.length - 7;
  const programBits = programLength * 5;
  const programBytes = Math.floor(programBits / 8);
  if (witnessVersion === 0 && programBytes !== 20 && programBytes !== 32) {
    return { ok: false, reason: "This is not a valid Bitcoin address." };
  }
  if (programBytes < 2 || programBytes > 40) {
    return { ok: false, reason: "This is not a valid Bitcoin address." };
  }

  return { ok: true, kind: "segwit", network };
}

/**
 * The single entry point: is this a Bitcoin address, and is it for `expected`?
 *
 * A testnet address on a mainnet swap is the failure this catches that a checksum alone does not —
 * it is perfectly well-formed and the coins are gone all the same.
 */
export async function verifyBitcoinAddress(
  address: string,
  expected: BitcoinNetwork = "mainnet",
): Promise<AddressVerdict> {
  const trimmed = address.trim();
  if (!trimmed) return { ok: false, reason: "Enter the Bitcoin address to receive at." };

  const verdict = /^(bc1|tb1|bcrt1)/i.test(trimmed)
    ? verifyBech32Address(trimmed)
    : await verifyBase58Address(trimmed);

  if (!verdict.ok) return verdict;
  if (verdict.network !== expected) {
    return {
      ok: false,
      reason: `That is a ${verdict.network} address and this swap settles on ${expected}.`,
    };
  }
  return verdict;
}
