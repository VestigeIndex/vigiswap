export type RouteCandidate = {
  provider: string;
  outputAmount: string;
  gasUsd?: string;
  feeUsd?: string;
  estimatedNetOutput?: string;
  route?: string[];
};

/**
 * VigiSwap must always request and display the best available route.
 *
 * Rule:
 * - Never invent prices/routes.
 * - Ask VestigeIndex routing API for real route candidates.
 * - Compare net result: expected output minus gas/fees when API provides normalized values.
 * - Mark the best route explicitly.
 * - Only apply VigiSwap/Vestige fee if current Vestige policy says the route improves the user's result.
 */
export function selectBestRoute(candidates: RouteCandidate[]) {
  if (!candidates.length) return null;

  return [...candidates].sort((a, b) => {
    const av = Number(a.estimatedNetOutput || a.outputAmount || 0);
    const bv = Number(b.estimatedNetOutput || b.outputAmount || 0);
    return bv - av;
  })[0];
}
