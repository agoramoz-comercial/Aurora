import type { AssetClass, AssetMeta } from "./types";

const E = (
  symbol: string,
  name: string,
  domain: string,
  brandColor: string,
  textColor = "#FFFFFF",
  sector?: string,
  siSlug?: string,
): AssetMeta => ({ assetClass: "equity", symbol, name, domain, brandColor, textColor, sector, siSlug });

const C = (
  symbol: string,
  name: string,
  coingeckoId: string,
  brandColor: string,
  textColor = "#FFFFFF",
): AssetMeta => ({ assetClass: "crypto", symbol, name, coingeckoId, brandColor, textColor });

const F = (
  symbol: string,
  name: string,
  issuer: "spdr" | "vanguard" | "ishares" | "invesco" | "wisdomtree" | "other",
  issuerDomain: string,
  brandColor: string,
  textColor = "#FFFFFF",
): AssetMeta => ({ assetClass: "etf", symbol, name, issuer, issuerDomain, brandColor, textColor });

const X = (
  symbol: string,
  base: string,
  quote: string,
  baseFlag: string,
  quoteFlag: string,
  brandColor = "#1E293B",
  textColor = "#FFFFFF",
): AssetMeta => ({
  assetClass: "forex",
  symbol,
  name: `${base}/${quote}`,
  baseCurrency: base,
  quoteCurrency: quote,
  baseFlag,
  quoteFlag,
  brandColor,
  textColor,
});

export const ASSET_REGISTRY: Record<string, AssetMeta> = {
  // Equities
  AAPL: E("AAPL", "Apple Inc.", "apple.com", "#000000", "#FFFFFF", "Technology", "apple"),
  MSFT: E("MSFT", "Microsoft", "microsoft.com", "#00A4EF", "#FFFFFF", "Technology", "microsoft"),
  NVDA: E("NVDA", "NVIDIA", "nvidia.com", "#76B900", "#000000", "Technology", "nvidia"),
  TSLA: E("TSLA", "Tesla", "tesla.com", "#CC0000", "#FFFFFF", "Automotive", "tesla"),
  AMZN: E("AMZN", "Amazon", "amazon.com", "#FF9900", "#000000", "Consumer", "amazon"),
  GOOGL: E("GOOGL", "Alphabet", "abc.xyz", "#4285F4", "#FFFFFF", "Technology", "google"),
  META: E("META", "Meta Platforms", "meta.com", "#0668E1", "#FFFFFF", "Technology", "meta"),
  JPM: E("JPM", "JPMorgan Chase", "jpmorganchase.com", "#0033A0", "#FFFFFF", "Financials"),
  V: E("V", "Visa", "visa.com", "#1A1F71", "#FFFFFF", "Financials", "visa"),
  "BRK.B": E("BRK.B", "Berkshire Hathaway", "berkshirehathaway.com", "#B11B25", "#FFFFFF", "Conglomerate"),

  // Crypto
  BTC: C("BTC", "Bitcoin", "bitcoin", "#F7931A"),
  ETH: C("ETH", "Ethereum", "ethereum", "#627EEA"),
  SOL: C("SOL", "Solana", "solana", "#14F195", "#000000"),
  BNB: C("BNB", "BNB", "binancecoin", "#F3BA2F", "#000000"),
  XRP: C("XRP", "XRP", "ripple", "#000000"),
  ADA: C("ADA", "Cardano", "cardano", "#0033AD"),
  DOGE: C("DOGE", "Dogecoin", "dogecoin", "#C2A633", "#000000"),
  AVAX: C("AVAX", "Avalanche", "avalanche-2", "#E84142"),

  // ETFs
  SPY: F("SPY", "SPDR S&P 500", "spdr", "ssga.com", "#0F4C81"),
  QQQ: F("QQQ", "Invesco QQQ", "invesco", "invesco.com", "#003DA5"),
  VOO: F("VOO", "Vanguard S&P 500", "vanguard", "vanguard.com", "#9E1B32"),
  VTI: F("VTI", "Vanguard Total Market", "vanguard", "vanguard.com", "#9E1B32"),
  IWM: F("IWM", "iShares Russell 2000", "ishares", "ishares.com", "#000000"),
  DIA: F("DIA", "SPDR Dow Jones", "spdr", "ssga.com", "#0F4C81"),
  GLD: F("GLD", "SPDR Gold Shares", "spdr", "ssga.com", "#D4AF37", "#000000"),
  SLV: F("SLV", "iShares Silver Trust", "ishares", "ishares.com", "#C0C0C0", "#000000"),
  TLT: F("TLT", "iShares 20+ Year Treasury", "ishares", "ishares.com", "#000000"),

  // Forex
  EURUSD: X("EURUSD", "EUR", "USD", "eu", "us"),
  GBPUSD: X("GBPUSD", "GBP", "USD", "gb", "us"),
  USDJPY: X("USDJPY", "USD", "JPY", "us", "jp"),
  USDCHF: X("USDCHF", "USD", "CHF", "us", "ch"),
  AUDUSD: X("AUDUSD", "AUD", "USD", "au", "us"),
  USDCAD: X("USDCAD", "USD", "CAD", "us", "ca"),
  NZDUSD: X("NZDUSD", "NZD", "USD", "nz", "us"),
  XAUUSD: X("XAUUSD", "XAU", "USD", "un", "us", "#D4AF37", "#000000"),
};

export function inferAssetClass(symbol: string): AssetClass {
  const meta = ASSET_REGISTRY[symbol.toUpperCase()];
  if (meta) return meta.assetClass;
  if (/^[A-Z]{3}[A-Z]{3}$/.test(symbol) || symbol.includes("/")) return "forex";
  return "equity";
}

export function getAssetMeta(symbol: string): AssetMeta {
  const key = symbol.toUpperCase().replace("/", "");
  const found = ASSET_REGISTRY[key];
  if (found) return found;
  // Generic fallback as equity placeholder
  return {
    assetClass: "equity",
    symbol,
    name: symbol,
    domain: "",
    brandColor: "#1F2937",
    textColor: "#FFFFFF",
  };
}
