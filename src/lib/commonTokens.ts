// Common/pinned tokens per chain, mirrored verbatim from VestigeIndex's TOKEN_REGISTRY
// (native + stables + majors). Shown at the top of each network's list for fast access;
// the FULL token universe for every chain is loaded live from LI.FI (see tokens.ts).
// Generated from VestigeIndex — do not hand-edit; regenerate from the registry instead.
import type { TokenConfig } from "./tokens";

export const COMMON_TOKENS: Record<number, TokenConfig[]> = {
  "1": [
    {
      "chainId": 1,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/eth.png",
      "isNative": true
    },
    {
      "chainId": 1,
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "symbol": "WBTC",
      "name": "Wrapped Bitcoin",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/wbtc.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "symbol": "DAI",
      "name": "Dai",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/dai.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      "symbol": "LINK",
      "name": "Chainlink",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/link.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "symbol": "UNI",
      "name": "Uniswap",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/uni.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      "symbol": "AAVE",
      "name": "Aave",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/aave.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
      "symbol": "MKR",
      "name": "Maker",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/mkr.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
      "symbol": "LDO",
      "name": "Lido DAO",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/ldo.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      "symbol": "STETH",
      "name": "Lido Staked Ether",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/steth.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      "symbol": "PEPE",
      "name": "Pepe",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/31053/small/pepe-token.jpeg",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      "symbol": "SHIB",
      "name": "Shiba Inu",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3",
      "symbol": "ONDO",
      "name": "Ondo",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/26580/small/ONDO.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x808507121B80c02388fAd14726482e061B8da827",
      "symbol": "PENDLE",
      "name": "Pendle",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x57e114B691Db790C35207b2e685D4A43181e6061",
      "symbol": "ENA",
      "name": "Ethena",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/36530/small/ethena.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x111111111117dC0aa78b770fA6A738034120C302",
      "symbol": "1INCH",
      "name": "1inch",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/providers/1inch.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
      "symbol": "ARB",
      "name": "Arbitrum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/arb.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x4200000000000000000000000000000000000042",
      "symbol": "OP",
      "name": "Optimism",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/op.png",
      "isNative": false
    },
    {
      "chainId": 1,
      "address": "0x7D1AfA7B718fb893dB30A3abc0Cfc608AaCFebb0",
      "symbol": "MATIC",
      "name": "Polygon",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/matic.png",
      "isNative": false
    }
  ],
  "10": [
    {
      "chainId": 10,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/eth.png",
      "isNative": true
    },
    {
      "chainId": 10,
      "address": "0x0b2C639c533813f4Aa9D7837CaF62653d097Ff85",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 10,
      "address": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    },
    {
      "chainId": 10,
      "address": "0x4200000000000000000000000000000000000042",
      "symbol": "OP",
      "name": "Optimism",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/op.png",
      "isNative": false
    },
    {
      "chainId": 10,
      "address": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "symbol": "DAI",
      "name": "Dai",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/dai.png",
      "isNative": false
    },
    {
      "chainId": 10,
      "address": "0x68f180fcce6836688e9084f035309e29bf0a2095",
      "symbol": "WBTC",
      "name": "Wrapped Bitcoin",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/wbtc.png",
      "isNative": false
    },
    {
      "chainId": 10,
      "address": "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
      "symbol": "LINK",
      "name": "Chainlink",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/link.png",
      "isNative": false
    }
  ],
  "25": [
    {
      "chainId": 25,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "CRO",
      "name": "Cronos",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/cro.png",
      "isNative": true
    },
    {
      "chainId": 25,
      "address": "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 25,
      "address": "0x66e428c3f67a68878562e79a0234c1f83c208770",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    }
  ],
  "56": [
    {
      "chainId": 56,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "BNB",
      "name": "BNB",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/bnb.png",
      "isNative": true
    },
    {
      "chainId": 56,
      "address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x55d398326f99059fF775485246999027B3197955",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      "symbol": "DAI",
      "name": "Dai",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/dai.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/eth.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x7130d2A12B9BCBFAe4f2634d864A1Ee1Ce3Ead9c",
      "symbol": "BTCB",
      "name": "Bitcoin BEP2",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/wbtc.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0xc5f0f7b66764f6ec8c8dff7ba683102295e16409",
      "symbol": "FDUSD",
      "name": "First Digital USD",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/31079/small/FDUSD_ICON_BLUE.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",
      "symbol": "LINK",
      "name": "Chainlink",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/link.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x1D2F0dA169ceB9Fc7B3144628dB156f3F6c60dBE",
      "symbol": "XRP",
      "name": "XRP Token",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
      "symbol": "DOGE",
      "name": "Dogecoin",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/doge.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x2859e4544C4bB03966803b044A93563bD2D0dD4D",
      "symbol": "SHIB",
      "name": "Shiba Inu",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00",
      "symbol": "PEPE",
      "name": "Pepe",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/31053/small/pepe-token.jpeg",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
      "symbol": "ADA",
      "name": "Cardano Token",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/975/small/cardano.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2E0b1677",
      "symbol": "DOT",
      "name": "Polkadot Token",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x86B3F23B6e90F5bbfac59b5b2661134e8fD8A507",
      "symbol": "AVAX",
      "name": "Avalanche Token",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0xCE7de646e7208A4Ef112cb6ed5038FA6C0cFfE2C",
      "symbol": "TRX",
      "name": "TRON Token",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x4B0F1812e5Df2A09796481Ff14017e6005508003",
      "symbol": "TWT",
      "name": "Trust Wallet",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/11085/small/Trust.png",
      "isNative": false
    },
    {
      "chainId": 56,
      "address": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      "symbol": "CAKE",
      "name": "PancakeSwap",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo_%281%29.png",
      "isNative": false
    }
  ],
  "137": [
    {
      "chainId": 137,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "MATIC",
      "name": "Polygon",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/matic.png",
      "isNative": true
    },
    {
      "chainId": 137,
      "address": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      "symbol": "DAI",
      "name": "Dai",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/dai.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/eth.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
      "symbol": "WBTC",
      "name": "Wrapped Bitcoin",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/wbtc.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0x53E0bca35eC356BD5ddDFebBD1Fc0fD03FaBad39",
      "symbol": "LINK",
      "name": "Chainlink",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/link.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
      "symbol": "AAVE",
      "name": "Aave",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/aave.png",
      "isNative": false
    },
    {
      "chainId": 137,
      "address": "0xb33EaAd8d922B1083446DC23f610c2567fB5180f",
      "symbol": "UNI",
      "name": "Uniswap",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/uni.png",
      "isNative": false
    }
  ],
  "8332": [
    {
      "chainId": 8332,
      "address": "BTC.BTC",
      "symbol": "BTC",
      "name": "Bitcoin",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/btc.png",
      "isNative": true
    }
  ],
  "8453": [
    {
      "chainId": 8453,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/eth.png",
      "isNative": true
    },
    {
      "chainId": 8453,
      "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 8453,
      "address": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      "symbol": "DAI",
      "name": "Dai",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/dai.png",
      "isNative": false
    },
    {
      "chainId": 8453,
      "address": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    },
    {
      "chainId": 8453,
      "address": "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
      "symbol": "CBBTC",
      "name": "Coinbase Wrapped BTC",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/wbtc.png",
      "isNative": false
    }
  ],
  "42161": [
    {
      "chainId": 42161,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/eth.png",
      "isNative": true
    },
    {
      "chainId": 42161,
      "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdc.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9",
      "symbol": "USDT",
      "name": "Tether",
      "decimals": 6,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/usdt.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0x912CE59144191C1204E64559FE8253a0e49E6548",
      "symbol": "ARB",
      "name": "Arbitrum",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/arb.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      "symbol": "WBTC",
      "name": "Wrapped Bitcoin",
      "decimals": 8,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/wbtc.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "symbol": "DAI",
      "name": "Dai",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/dai.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
      "symbol": "LINK",
      "name": "Chainlink",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/link.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
      "symbol": "UNI",
      "name": "Uniswap",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/uni.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0xba5DdD1f9d7F570dc94a51479a000E3BCE967196",
      "symbol": "AAVE",
      "name": "Aave",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/aave.png",
      "isNative": false
    },
    {
      "chainId": 42161,
      "address": "0x13Ad51ed4f1B069E7D0303FF5c9c46A8771A7a62",
      "symbol": "LDO",
      "name": "Lido DAO",
      "decimals": 18,
      "logoURI": "https://www.vestigeindex.com/logos/tokens/ldo.png",
      "isNative": false
    }
  ]
};
