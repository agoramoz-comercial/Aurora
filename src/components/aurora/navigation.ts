import {
  BarChart3,
  Building2,
  FileCheck,
  FileSpreadsheet,
  Gem,
  Home,
  Landmark,
  LayoutGrid,
  MessageCircleHeart,
  Settings,
  Wallet,
} from "lucide-react";

/** Single source for the app's sections: sidebar, command palette and dock read from here. */
export const SECTIONS = [
  { id: "home", icon: Home, label: "Notícias", hint: "Fluxo de notícias com impacto em carteira" },
  {
    id: "proofmarket",
    icon: MessageCircleHeart,
    label: "Aurora Chat",
    hint: "Feed, perfil e chat sobre teses auditáveis",
  },
  {
    id: "financas",
    icon: Wallet,
    label: "Finanças Pessoais",
    hint: "Orçamento, dívidas, objetivos e previsão",
  },
  {
    id: "grid",
    icon: LayoutGrid,
    label: "Ollympius Dashboard",
    hint: "Visão geral · Reports abre o Portfolio Management",
  },
  { id: "bars", icon: BarChart3, label: "Analytics", hint: "Velas, RSI, risco e alertas" },
  {
    id: "brokers",
    icon: Landmark,
    label: "Corretoras",
    hint: "Contas ligadas e posições consolidadas",
  },
  {
    id: "benchmarkPage",
    icon: Building2,
    label: "Benchmark & Projeções",
    hint: "Cenários, 3-way e DCF",
  },
  {
    id: "businessPlan",
    icon: FileCheck,
    label: "Plano de Negócios",
    hint: "Economia unitária e risco",
  },
  {
    id: "teslaModel",
    icon: FileSpreadsheet,
    label: "Modelo Financeiro & DCF Hub",
    hint: "Pipeline de 38 folhas",
  },
  { id: "marketplace", icon: Gem, label: "Marketplace", hint: "Listagens e pedidos" },
  { id: "settings", icon: Settings, label: "Definições", hint: "Preferências e dados locais" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
