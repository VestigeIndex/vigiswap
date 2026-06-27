export const legalText = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "VigiSwap is designed as a non-custodial swap interface. We do not ask for seed phrases, private keys or wallet recovery data.",
      "Essential local storage may be used for language, consent state and interface preferences.",
      "No marketing analytics are enabled by default in this starter. If analytics are added later, consent must be requested before activation.",
      "Server-side logs must never store seed phrases, private keys or sensitive wallet secrets."
    ]
  },
  cookies: {
    title: "Cookie & Consent Policy",
    body: [
      "VigiSwap uses essential storage for language, consent and security preferences.",
      "Non-essential cookies, analytics and marketing trackers must remain disabled unless the user consents.",
      "The swap function must not depend on invasive tracking."
    ]
  },
  terms: {
    title: "Terms of Use",
    body: [
      "VigiSwap provides a non-custodial interface for swaps routed by Vestige Index APIs.",
      "VigiSwap (vigiswap.com) is a product of VestigeIndex (vestigeindex.com), which is part of UTXO Suite (utxosuite.com). The VigiSwap, VestigeIndex and UTXO Suite brands, together with affiliated products including Idovio (idovio.com), Regikaha (regikaha.com) and Regitrámites (regitramites.com), are ultimately owned and operated by UTXO Labs and Huris S&C. All trademarks, logos and rights are reserved by their respective owners within this group.",
      "A platform fee of 0.10% is applied to swaps and accrues to the operator; routing aggregators may also apply their own protocol fees, which are reflected in the quoted route.",
      "Users are responsible for reviewing token addresses, route details, slippage, fees and wallet confirmations.",
      "VigiSwap never guarantees profits, future token prices or market outcomes.",
      "VIGIX must be presented as a platform token with contract-defined curve pricing, not as speculative investment marketing."
    ]
  },
  risk: {
    title: "Risk Notice",
    body: [
      "Crypto swaps involve smart contract, liquidity, market, price impact and network risks.",
      "VigiSwap must always show real route data from Vestige Index or a clear error if no quote is available.",
      "Never enter a seed phrase on VigiSwap or any website claiming to be VigiSwap.",
      "The official domain is vigiswap.com."
    ]
  }
} as const;
