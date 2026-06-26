import { useState } from "react";
import { cn } from "@/lib/utils";
import { getAssetMeta, inferAssetClass } from "@/lib/assets/registry";
import { getForexFlags, getLogoCandidates } from "@/lib/assets/logoSources";
import type { AssetClass, AssetMeta, ForexMeta } from "@/lib/assets/types";

function Monogram({ meta, size = 22 }: { meta: AssetMeta; size?: number }) {
  const letter =
    meta.assetClass === "forex"
      ? `${meta.baseCurrency[0]}${meta.quoteCurrency[0]}`
      : meta.symbol.replace(".", "").slice(0, meta.symbol.length > 3 ? 2 : 1);
  return (
    <span
      aria-label={`${meta.name} logo`}
      className="flex h-full w-full items-center justify-center rounded-[5px] font-semibold"
      style={{
        background: meta.brandColor,
        color: meta.textColor,
        fontSize: Math.round(size * 0.42),
        lineHeight: 1,
      }}
    >
      {letter}
    </span>
  );
}

function LogoBox({ meta }: { meta: AssetMeta }) {
  const [sourceIndex, setSourceIndex] = useState(0);

  if (meta.assetClass === "forex") {
    return <ForexBox meta={meta} />;
  }

  const candidates = getLogoCandidates(meta);
  const url = candidates[sourceIndex];

  if (!url) {
    return <Monogram meta={meta} size={22} />;
  }

  return (
    <img
      src={url}
      alt={`${meta.name} logo`}
      width={36}
      height={36}
      loading="lazy"
      decoding="async"
      onError={() => setSourceIndex((i) => i + 1)}
      className="h-[18px] w-[18px] object-contain"
    />
  );
}

function ForexBox({ meta }: { meta: ForexMeta }) {
  const [baseErr, setBaseErr] = useState(false);
  const [quoteErr, setQuoteErr] = useState(false);
  const flags = getForexFlags(meta);
  if (baseErr && quoteErr) return <Monogram meta={meta} size={22} />;
  return (
    <span className="relative block h-[20px] w-[24px]">
      {!baseErr && (
        <img
          src={flags.base}
          alt={`${meta.baseCurrency} flag`}
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          onError={() => setBaseErr(true)}
          className="absolute left-0 top-0 h-[14px] w-[14px] rounded-full object-cover ring-1 ring-black/30"
        />
      )}
      {!quoteErr && (
        <img
          src={flags.quote}
          alt={`${meta.quoteCurrency} flag`}
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          onError={() => setQuoteErr(true)}
          className="absolute bottom-0 right-0 h-[14px] w-[14px] rounded-full object-cover ring-1 ring-black/30"
        />
      )}
    </span>
  );
}

export interface TickerCellProps {
  symbol: string;
  assetClass?: AssetClass;
  className?: string;
}

export function TickerCell({ symbol, assetClass, className }: TickerCellProps) {
  const base = getAssetMeta(symbol);
  const cls = assetClass ?? inferAssetClass(symbol);
  const meta: AssetMeta =
    base.assetClass === cls ? base : ({ ...base, assetClass: cls } as AssetMeta);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
        <LogoBox meta={meta} />
      </span>
      <span className="truncate text-[11px] font-semibold tabular-nums text-white">{symbol}</span>
    </span>
  );
}
