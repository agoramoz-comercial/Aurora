import {
  Activity,
  BarChart2,
  BookOpen,
  FileText,
  Globe,
  Radio,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AttentionLevel,
  ConfidenceBand,
  EventType,
  Horizon,
  PrimaryNewsItem,
  SecondaryNewsItem,
} from "@/data/newsData";
import heroAapl from "@/assets/hero_aapl.png";
import heroBtc from "@/assets/hero_btc.png";

/** Editorial imagery keyed by story id; stories without one get generated art. */
export const HERO_IMAGES: Record<string, string> = {
  p1: heroAapl,
  p4: heroBtc,
};

export interface AttentionPalette {
  bg: string;
  border: string;
  text: string;
  dot: string;
  glow: string;
}

export function attentionColor(level: AttentionLevel): AttentionPalette {
  switch (level) {
    case "critical":
      return {
        bg: "rgba(248,113,113,0.16)",
        border: "rgba(248,113,113,0.5)",
        text: "#fca5a5",
        dot: "#f87171",
        glow: "rgba(248,113,113,0.28)",
      };
    case "high":
      return {
        bg: "rgba(251,146,60,0.15)",
        border: "rgba(251,146,60,0.45)",
        text: "#fdba74",
        dot: "#fb923c",
        glow: "rgba(251,146,60,0.22)",
      };
    case "moderate":
      return {
        bg: "rgba(251,191,36,0.14)",
        border: "rgba(251,191,36,0.4)",
        text: "#fcd34d",
        dot: "#fbbf24",
        glow: "rgba(251,191,36,0.2)",
      };
    case "low":
      return {
        bg: "rgba(74,158,255,0.12)",
        border: "rgba(74,158,255,0.35)",
        text: "#93c5fd",
        dot: "#4a9eff",
        glow: "rgba(74,158,255,0.2)",
      };
  }
}

export const ATTENTION_LABEL: Record<AttentionLevel, string> = {
  critical: "Crítico",
  high: "Alta atenção",
  moderate: "Moderado",
  low: "Baixo",
};

export function confidenceBadge(band: ConfidenceBand) {
  switch (band) {
    case "high":
      return { label: "Confiança alta", color: "#4ade80" };
    case "medium":
      return { label: "Confiança média", color: "#fbbf24" };
    case "low":
      return { label: "Confiança baixa", color: "#f87171" };
    case "early":
      return { label: "Sinal precoce", color: "#c084fc" };
  }
}

export const HORIZON_LABEL: Record<Horizon, string> = {
  intraday: "Intraday",
  "1-5d": "1–5 dias",
  "1-4w": "1–4 semanas",
  structural: "Estrutural",
};

export const EVENT_LABEL: Record<EventType, string> = {
  earnings: "Resultados",
  guidance: "Guidance",
  macro: "Macro",
  ma: "M&A",
  regulatory: "Regulação",
  supply: "Cadeia de fornecimento",
  geopolitical: "Geopolítica",
  technical: "Técnico",
  fundamental: "Fundamental",
  social: "Social",
};

export const EVENT_ICON: Record<EventType, LucideIcon> = {
  earnings: BarChart2,
  guidance: FileText,
  macro: Globe,
  ma: Users,
  regulatory: Shield,
  supply: Activity,
  geopolitical: Globe,
  technical: BarChart2,
  fundamental: BookOpen,
  social: Radio,
};

export const EVIDENCE_META: Record<string, { label: string; icon: LucideIcon }> = {
  market: { label: "Mercado", icon: BarChart2 },
  technical: { label: "Técnico", icon: Activity },
  fundamental: { label: "Fundamental", icon: BookOpen },
  statistical: { label: "Estatístico", icon: BarChart2 },
  documentary: { label: "Documental", icon: FileText },
  social: { label: "Social", icon: Radio },
};

export function formatMinutesAgo(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const signed = (n: number, unit = "%") => `${n >= 0 ? "+" : ""}${n}${unit}`;

/** Lower-cased haystack for the newsroom search. */
export function searchText(item: PrimaryNewsItem | SecondaryNewsItem) {
  return [
    item.headline,
    item.summary,
    item.assetName,
    "ticker" in item ? item.ticker : "",
    ...item.tags,
  ]
    .join(" ")
    .toLowerCase();
}

/** Tag frequency across both layers, most discussed first. */
export function trendingTopics(items: { tags: string[] }[], limit = 10) {
  const counts = new Map<string, number>();
  for (const it of items) for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
