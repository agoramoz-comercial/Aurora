import type { ReactNode } from "react";
import type { TooltipProps } from "recharts";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";

/**
 * Shared Recharts tooltip body: frosted panel, colour key per series and
 * tabular values. Honours the `formatter` / `labelFormatter` contract callers
 * already pass to <Tooltip>, including `null` to hide a row.
 *
 * Kept hook-free on purpose: Recharts calls `content` as a plain function.
 */
export function GlassTooltip<V extends ValueType, N extends NameType>(props: TooltipProps<V, N>) {
  const { active, payload, label, formatter, labelFormatter } = props;
  if (!active || !payload?.length) return null;

  const rows: { key: string; color?: string; name: ReactNode; value: ReactNode }[] = [];
  payload.forEach((item: Payload<V, N>, i) => {
    let value: ReactNode = item.value as ReactNode;
    let name: ReactNode = item.name as ReactNode;
    if (formatter) {
      const out = formatter(item.value as V, item.name as N, item, i, payload);
      if (out === null || out === undefined) return;
      if (Array.isArray(out)) {
        value = out[0] as ReactNode;
        name = (out[1] as ReactNode) ?? name;
      } else {
        value = out as ReactNode;
      }
    }
    const p = item.payload as { fill?: string; stroke?: string } | undefined;
    rows.push({
      key: `${String(item.dataKey ?? item.name)}-${i}`,
      color: item.color ?? p?.fill ?? p?.stroke,
      name,
      value,
    });
  });
  if (!rows.length) return null;

  const heading = labelFormatter ? labelFormatter(label, payload) : label;

  return (
    <div
      className="min-w-[140px] rounded-xl px-2.5 py-2 text-[11px] text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
      style={{
        background: "linear-gradient(135deg, rgba(16,20,30,0.96) 0%, rgba(10,14,22,0.94) 100%)",
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(16px)",
      }}
    >
      {heading !== undefined && heading !== "" ? (
        <p className="mb-1.5 text-[10px] font-medium text-white/50">{heading as ReactNode}</p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: r.color ?? "rgba(255,255,255,0.6)" }}
            />
            <span className="min-w-0 flex-1 truncate text-white/65">{r.name}</span>
            <span className="font-semibold tabular-nums text-white">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
