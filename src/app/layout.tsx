import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_VIGISWAP_SITE_URL || "https://vigiswap.com"),
  title: "VigiSwap — Fast Non-Custodial Crypto Swaps",
  description: "Swap crypto across supported networks with best-route non-custodial routing powered by Vestige Index.",
  applicationName: "VigiSwap",
  authors: [{ name: "UTXO Labs" }],
  creator: "UTXO Labs",
  publisher: "UTXO Labs",
  openGraph: {
    title: "VigiSwap — Fast Non-Custodial Crypto Swaps",
    description: "A premium swap-only interface powered by Vestige Index best-route routing.",
    url: "https://vigiswap.com",
    siteName: "VigiSwap",
    type: "website",
    images: [{ url: "/logo/vigiswap-mark.svg", width: 160, height: 160, alt: "VigiSwap" }]
  },
  twitter: {
    card: "summary",
    title: "VigiSwap — Fast Non-Custodial Crypto Swaps",
    description: "Fast non-custodial best-route routing powered by Vestige Index.",
    images: ["/logo/vigiswap-mark.svg"]
  },
  icons: { icon: "/logo/vigiswap-mark.svg", shortcut: "/logo/vigiswap-mark.svg", apple: "/logo/vigiswap-mark.svg" }
};

export const viewport: Viewport = {
  themeColor: "#F7E7C8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
