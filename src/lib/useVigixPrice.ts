import { useQuery } from "@tanstack/react-query";
import { fetchVigixSpot, type VigixSpot } from "./vigix";

// Live on-chain VIGIX spot price (bonding-curve contract). Refetched every 30s.
// No fallback/placeholder price is shown — if the read fails the UI hides the value.
export function useVigixPrice() {
  return useQuery<VigixSpot>({
    queryKey: ["vigix-spot"],
    queryFn: fetchVigixSpot,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
