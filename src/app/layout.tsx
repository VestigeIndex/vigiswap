import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_VIGISWAP_SITE_URL || "https://vigiswap.com";
const TITLE = "VigiSwap — Swap Any Crypto at the Best Rate | Non-Custodial DEX Aggregator";
const DESC =
  "VigiSwap is a fast, non-custodial crypto swap. Trade any token across 15+ EVM networks and native Bitcoin, " +
  "with the best route auto-selected from the LI.FI and OKX engines (1inch, 0x, Uniswap, PancakeSwap, Aerodrome " +
  "and 200+ DEXs). No sign-up, no custody, lower fees than Uniswap. Available in 16 languages.";

// Open Graph locale codes for the 16 supported UI languages (helps international discovery).
const OG_LOCALES = [
  "es_ES", "de_DE", "fr_FR", "it_IT", "pt_PT", "nl_NL", "ar_AR", "zh_CN",
  "ja_JP", "ko_KR", "ru_RU", "tr_TR", "hi_IN", "id_ID", "pl_PL",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s | VigiSwap" },
  description: DESC,
  applicationName: "VigiSwap",
  authors: [{ name: "UTXO Labs" }, { name: "VestigeIndex", url: "https://vestigeindex.com" }],
  creator: "VestigeIndex",
  publisher: "UTXO Labs",
  category: "finance",
  keywords: [
    "crypto swap", "token swap", "DEX aggregator", "best swap rate", "cheap crypto swap",
    "non-custodial swap", "cross-chain swap", "bridge crypto", "swap ETH", "swap USDC",
    "swap BTC", "Bitcoin swap", "Uniswap alternative", "1inch alternative", "best DEX",
    "Ethereum swap", "Arbitrum swap", "Base swap", "Polygon swap", "BNB swap", "Solana", "Optimism swap",
    "swap tokens online", "low fee swap", "DeFi swap", "LI.FI", "OKX DEX", "VigiSwap", "VIGIX",
    "intercambiar cripto", "échange crypto", "Krypto tauschen", "криптообмен", "加密货币兑换", "暗号資産スワップ",
  ],
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: SITE,
    siteName: "VigiSwap",
    type: "website",
    locale: "en_US",
    alternateLocale: OG_LOCALES,
    images: [{ url: "/logo/vigiswap-mark.svg", width: 512, height: 512, alt: "VigiSwap — non-custodial crypto swap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Swap any crypto at the best rate. Non-custodial, multi-chain, lower fees than Uniswap. 16 languages.",
    images: ["/logo/vigiswap-mark.svg"],
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo/vigiswap-mark.svg", shortcut: "/logo/vigiswap-mark.svg", apple: "/logo/vigiswap-mark.svg" },
};

export const viewport: Viewport = {
  themeColor: "#F7E7C8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Structured data so search engines + AI crawlers understand VigiSwap, its publisher
// hierarchy (the UTXO Labs conglomerate) and common swap questions (rich results).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#org`,
      name: "VigiSwap",
      url: SITE,
      logo: `${SITE}/logo/vigiswap-mark.svg`,
      parentOrganization: {
        "@type": "Organization",
        name: "VestigeIndex",
        url: "https://vestigeindex.com",
        parentOrganization: { "@type": "Organization", name: "UTXO Labs" },
      },
      sameAs: ["https://vestigeindex.com", "https://utxosuite.com"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "VigiSwap",
      description: DESC,
      publisher: { "@id": `${SITE}/#org` },
      inLanguage: ["en", "es", "de", "fr", "it", "pt", "nl", "ar", "zh", "ja", "ko", "ru", "tr", "hi", "id", "pl"],
    },
    {
      "@type": "WebApplication",
      name: "VigiSwap",
      url: SITE,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, iOS, Android",
      browserRequirements: "Requires a Web3 wallet (e.g. WalletConnect, MetaMask).",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Non-custodial token swaps",
        "Best-route across LI.FI and OKX aggregation engines",
        "15+ EVM networks and native Bitcoin",
        "Paste-any-address token support",
        "0.10% platform fee, lower than typical interface fees",
      ],
      publisher: { "@id": `${SITE}/#org` },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is VigiSwap?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "VigiSwap is a non-custodial crypto swap interface that finds the best route for your trade across the LI.FI and OKX aggregation engines, covering 15+ EVM networks and native Bitcoin. You keep custody of your funds at all times.",
          },
        },
        {
          "@type": "Question",
          name: "Is VigiSwap custodial?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. VigiSwap never holds your funds or private keys. You connect your own Web3 wallet and sign every transaction yourself.",
          },
        },
        {
          "@type": "Question",
          name: "What fees does VigiSwap charge?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "VigiSwap applies a 0.10% platform fee on swaps — lower than typical DEX interface fees. The underlying aggregators may also apply their own protocol fees, which are reflected in the quoted route.",
          },
        },
        {
          "@type": "Question",
          name: "Which networks and tokens can I swap?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Any token on 15+ EVM chains including Ethereum, Arbitrum, Base, Polygon, BNB Chain, Optimism and Avalanche, plus native Bitcoin. You can search any token or paste its contract address.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="x-default" href={SITE} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
