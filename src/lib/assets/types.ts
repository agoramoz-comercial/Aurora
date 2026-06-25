/** Discriminated asset metadata supporting equities, crypto, ETFs, forex. */

export type AssetClass = "equity" | "crypto" | "etf" | "forex";

export interface BaseAssetMeta {
  symbol: string;
  name: string;
  brandColor: string;
  textColor: string;
}

export interface EquityMeta extends BaseAssetMeta {
  assetClass: "equity";
  domain: string;
  localLogoPath?: string;
  siSlug?: string;
  sector?: string;
}

export interface CryptoMeta extends BaseAssetMeta {
  assetClass: "crypto";
  coingeckoId: string;
  localLogoPath?: string;
}

export interface ETFMeta extends BaseAssetMeta {
  assetClass: "etf";
  issuer: "spdr" | "vanguard" | "ishares" | "invesco" | "wisdomtree" | "other";
  issuerDomain: string;
  localLogoPath?: string;
}

export interface ForexMeta extends BaseAssetMeta {
  assetClass: "forex";
  baseCurrency: string;
  quoteCurrency: string;
  baseFlag: string;
  quoteFlag: string;
}

export type AssetMeta = EquityMeta | CryptoMeta | ETFMeta | ForexMeta;
