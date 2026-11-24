/** Text and number helpers shared by the wealth agents (pt-PT / MZ formats). */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Parses "1.234,56", "1,234.56", "-1234.56", "1 234,56 MT" → number. */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/[^\d,.\-−()]/g, "").replace("−", "-");
  if (!s) return null;
  const neg = s.startsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  s = s.replace(/[-()]/g, "");
  const lc = s.lastIndexOf(",");
  const ld = s.lastIndexOf(".");
  if (lc > ld) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}

/** dd/mm/yyyy, dd-mm-yy, yyyy-mm-dd, yyyymmdd → YYYY-MM-DD. */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{4})[-/.]?(\d{2})[-/.]?(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(s);
  if (m) {
    const y = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
    return `${y}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  }
  return null;
}

export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const h = a.length >> 1;
  return a.length % 2 ? a[h]! : (a[h - 1]! + a[h]!) / 2;
};

export const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
