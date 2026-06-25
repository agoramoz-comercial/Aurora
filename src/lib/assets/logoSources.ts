import type { AssetMeta, ForexMeta } from "./types";

const cache = new Map<string, string[]>();

/**
 * Returns an ordered cascade of logo URL candidates (highest fidelity first).
 * TickerCell walks the list via onError until one resolves.
 */
export function getLogoCandidates(meta: AssetMeta): string[] {
  const key = `${meta.assetClass}:${meta.symbol}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const urls: string[] = [];

  switch (meta.assetClass) {
    case "equity": {
      if (meta.localLogoPath) urls.push(meta.localLogoPath);
      // Clearbit HD multicolor PNG (256px → crisp at 22px retina)
      if (meta.domain) urls.push(`https://logo.clearbit.com/${meta.domain}?size=256&format=png`);
      // simple-icons vector SVG fallback (brand-colored monochrome)
      if (meta.siSlug) {
        const hex = meta.brandColor.replace("#", "");
        urls.push(`https://cdn.simpleicons.org/${meta.siSlug}/${hex}`);
      }
      break;
    }
    case "etf": {
      if (meta.localLogoPath) urls.push(meta.localLogoPath);
      if (meta.issuerDomain)
        urls.push(`https://logo.clearbit.com/${meta.issuerDomain}?size=256&format=png`);
      break;
    }
    case "crypto": {
      if (meta.localLogoPath) urls.push(meta.localLogoPath);
      const sym = meta.symbol.toLowerCase();
      // Official vector SVGs from atomiclabs/cryptocurrency-icons
      urls.push(
        `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1.0.0/svg/color/${sym}.svg`,
      );
      // CoinGecko large PNG fallback
      urls.push(`https://assets.coingecko.com/coins/images/1/large/${meta.coingeckoId}.png`);
      break;
    }
    case "forex":
      // handled via getForexFlags
      break;
  }

  cache.set(key, urls);
  return urls;
}

export function getForexFlags(meta: ForexMeta): { base: string; quote: string } {
  return {
    base: `https://flagcdn.com/w80/${meta.baseFlag}.png`,
    quote: `https://flagcdn.com/w80/${meta.quoteFlag}.png`,
  };
}
