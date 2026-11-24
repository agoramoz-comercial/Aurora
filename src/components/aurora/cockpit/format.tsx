/** pt-PT number helpers for instruments. */
export const pctPt = (fraction: number, digits = 2, sign = false) =>
  `${sign && fraction > 0 ? "+" : ""}${(fraction * 100).toFixed(digits).replace(".", ",").replace("-", "−")}%`;

export function Stat({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <p className="cx-eyebrow">{k}</p>
      <p
        className="mt-1 text-[22px] font-bold tabular-nums lg:text-[24px]"
        style={{ color: tone ? `var(--cx-${tone})` : "var(--cx-ink-1)" }}
      >
        {v}
      </p>
    </div>
  );
}
