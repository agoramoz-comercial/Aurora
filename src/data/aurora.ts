export type AreaPoint = { label: string; value: number };
export type BarPoint = { label: string; value: number };

export const areaSeries: AreaPoint[] = [
  { label: "Mon", value: 32 },
  { label: "Tue", value: 48 },
  { label: "Wed", value: 38 },
  { label: "Thu", value: 64 },
  { label: "Fri", value: 52 },
  { label: "Sat", value: 88 },
  { label: "Sun", value: 60 },
  { label: "Mon", value: 72 },
  { label: "Tue", value: 56 },
  { label: "Wed", value: 78 },
];

export const areaPeakIndex = 5;

export const barSeries: BarPoint[] = [
  { label: "W1", value: 4120 },
  { label: "W2", value: 5380 },
  { label: "W3", value: 3940 },
  { label: "W4", value: 6210 },
  { label: "W5", value: 4880 },
  { label: "W6", value: 7842 },
  { label: "W7", value: 5060 },
  { label: "W8", value: 3420 },
];

export const barPeakValue = 7842;

export type ActivityRow = {
  id: string;
  initials: string;
  name: string;
  note: string;
  value: string;
};

export const recentActivity: ActivityRow[] = [
  { id: "a1", initials: "OC", name: "Olivia Chen", note: "New subscription", value: "+$240" },
  { id: "a2", initials: "MR", name: "Marco Rivera", note: "Upgraded to Pro", value: "+$89" },
  { id: "a3", initials: "AS", name: "Aiko Sato", note: "Annual renewal", value: "+$1.2k" },
];

export const teamMembers: ActivityRow[] = [
  { id: "t1", initials: "JT", name: "Jordan Tate", note: "Design lead", value: "Online" },
  { id: "t2", initials: "PN", name: "Priya Nair", note: "Engineering", value: "Focus" },
  { id: "t3", initials: "LV", name: "Luca Verdi", note: "Product", value: "Away" },
];
export const teamSelectedId = "t2";

export type GoalRow = { id: string; label: string; progress: number; value: string };
export const goals: GoalRow[] = [
  { id: "g1", label: "Monthly revenue", progress: 72, value: "72%" },
  { id: "g2", label: "Conversion rate", progress: 48, value: "48%" },
];

export type Kpi = { label: string; value: string };
export const kpiCards: { id: string; primary: Kpi; secondary: Kpi }[] = [
  {
    id: "k1",
    primary: { label: "Active users", value: "12,480" },
    secondary: { label: "+8.4% this week", value: "" },
  },
  {
    id: "k2",
    primary: { label: "Sessions", value: "38,210" },
    secondary: { label: "+3.1% this week", value: "" },
  },
];

export const microCards: { id: string; primary: Kpi; secondary: Kpi }[] = [
  {
    id: "m1",
    primary: { label: "Churn", value: "1.8%" },
    secondary: { label: "−0.3 pts", value: "" },
  },
  { id: "m2", primary: { label: "NPS", value: "62" }, secondary: { label: "+4 pts", value: "" } },
];

export const timeframes = ["1D", "1W", "1M", "1Y"] as const;
export type Timeframe = (typeof timeframes)[number];

export const heroStats: { label: string; value: string }[] = [
  { label: "Revenue", value: "$84.2k" },
  { label: "Sessions", value: "38.2k" },
  { label: "Avg order", value: "$54" },
];

export type DockChip = { id: string; label: string; value: string };
export const dockChips: DockChip[] = [
  { id: "d1", label: "Inbox", value: "12" },
  { id: "d2", label: "Tasks", value: "5" },
  { id: "d3", label: "Calendar", value: "Today" },
  { id: "d4", label: "Profile", value: "You" },
];
