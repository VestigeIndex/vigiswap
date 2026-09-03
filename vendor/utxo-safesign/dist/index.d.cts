/**
 * UTXO Guard — risk analysis kernel.
 *
 * Pure functions. No side effects, no network calls (extension stays
 * local-only). Imported by the popup, content script and service worker.
 */
type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";
type RiskSignal = {
    code: string;
    level: RiskLevel;
    title: string;
    description: string;
};
type RiskReport = {
    level: RiskLevel;
    score: number;
    signals: RiskSignal[];
};
/**
 * Known crypto / wallet / DeFi domains. Used as anchors for typosquat
 * detection (Levenshtein distance) and as a "legit" lookup for the popup.
 * Curated; not exhaustive. Extending this list does not change behavior
 * for legitimate visits to these domains — only protects against close
 * lookalikes.
 */
declare const KNOWN_DOMAINS: string[];
/** Hard-block list. Edit cautiously; false positives are user-facing. */
declare const KNOWN_BAD: RegExp[];
declare function analyzeDomain(domain: string): RiskReport;
type DecodedCall = {
    kind: "erc20_approve";
    spender: string;
    amount: bigint;
    unlimited: boolean;
} | {
    kind: "erc20_increase";
    spender: string;
    delta: bigint;
} | {
    kind: "permit";
    spender: string;
    owner: string;
    value: bigint;
    deadline: bigint;
} | {
    kind: "permit2";
    spender: string;
    amount: bigint;
} | {
    kind: "nft_setApprovalForAll";
    operator: string;
    approved: boolean;
} | {
    kind: "transfer";
    to: string;
    amount: bigint;
} | {
    kind: "raw";
    selector: string;
    bytes: string;
};
declare function decodeCallData(data: string): DecodedCall | null;
/** Decode an EIP-712 typed-data payload and detect known dangerous patterns. */
type TypedDataSummary = {
    domain: string;
    primaryType: string;
    isPermit2: boolean;
    isUnlimitedPermit: boolean;
    message: Record<string, unknown>;
    signals: RiskSignal[];
};
declare function analyzeTypedData(input: unknown): TypedDataSummary | null;
declare function analyzeCall(call: DecodedCall): RiskSignal[];
declare function scoreReport(signals: RiskSignal[]): RiskReport;
declare function shortAddr(a: string): string;
declare function formatAmount(a: bigint): string;
type FormulaError = "#DIV/0!" | "#VALUE!" | "#REF!" | "#NAME?" | "#NUM!" | "#N/A" | "#ERROR!";
declare function isError(value: unknown): value is FormulaError;
declare function colToLetter(col: number): string;
declare function letterToCol(letter: string): number;

export { type DecodedCall, type FormulaError, KNOWN_BAD, KNOWN_DOMAINS, type RiskLevel, type RiskReport, type RiskSignal, type TypedDataSummary, analyzeCall, analyzeDomain, analyzeTypedData, colToLetter, decodeCallData, formatAmount, isError, letterToCol, scoreReport, shortAddr };

