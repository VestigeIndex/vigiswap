import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About — Non-Custodial Best-Route Crypto Swap",
  description:
    "About VigiSwap: a non-custodial, swap-only interface that auto-selects the best route across the LI.FI and OKX engines. For trading, markets and funds, VigiSwap connects to VestigeIndex.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <AboutPage />;
}
