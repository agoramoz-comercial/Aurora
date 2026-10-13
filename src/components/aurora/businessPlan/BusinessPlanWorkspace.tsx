/**
 * BusinessPlanWorkspace.tsx
 *
 * Ultra-Advanced Institutional Business Plan Workspace ("Ambiente de Plano de Negócios")
 * Built according to McKinsey, WPP, and KPMG consulting standards.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Target,
  Users,
  DollarSign,
  ShieldCheck,
  Building2,
  TrendingUp,
  Sparkles,
  Award,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  Download,
  Share2,
} from "lucide-react";
import {
  generateBusinessPlanPackage,
  type BusinessPlanPackage,
  type UnitEconomics,
} from "@/lib/finance/businessPlanEngine";
import { SECTOR_PRESETS, type ModelDrivers } from "@/lib/finance/excelModelEngine";
import { GlassCard } from "../GlassCard";
import { AccentBadge, Pill, WorkspaceHeader, StatTile, SegmentedTabs } from "../primitives";

/** Compact money formatting shared by the plan's KPI band. */
function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function BusinessPlanWorkspace() {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("automotive");
  const [drivers, setDrivers] = useState<ModelDrivers>(
    SECTOR_PRESETS.automotive!.defaultDrivers
  );
  const [activeModule, setActiveModule] = useState<
    "strategy" | "market" | "unitEconomics" | "financials" | "risk"
  >("strategy");

  // Editable Unit Economics State
  const [cac, setCac] = useState<number>(Math.round(drivers.averageUnitPrice * 0.12));
  const [arpu, setArpu] = useState<number>(Math.round(drivers.averageUnitPrice * 0.35));
  const [churn, setChurn] = useState<number>(8); // 8%

  // Business plan package state
  const [planPackage, setPlanPackage] = useState<BusinessPlanPackage | null>(null);

  useEffect(() => {
    const pkg = generateBusinessPlanPackage(drivers, {
      cac,
      arpu,
      annualChurnPct: churn / 100,
    });
    setPlanPackage(pkg);
  }, [drivers, cac, arpu, churn]);

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    const preset = SECTOR_PRESETS[key];
    if (preset) {
      setDrivers(preset.defaultDrivers);
      setCac(Math.round(preset.defaultDrivers.averageUnitPrice * 0.12));
      setArpu(Math.round(preset.defaultDrivers.averageUnitPrice * 0.35));
    }
  };

  if (!planPackage) return null;

  const { unitEconomics, breakEven, fundingRoadmap, mckinsey7s, kpmgRisks, reports, valuation } = planPackage;
  const firstReport = reports[0]!;
  const lastReport = reports[reports.length - 1]!;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {/* Header & Preset Switcher */}
      <WorkspaceHeader
        title="Plano de Negócios"
        subtitle={`${drivers.companyName} · Padrão McKinsey & Company · KPMG Audit Risk & WPP GTM`}
        badge={
          <AccentBadge>
            <Briefcase className="h-3 w-3" /> {drivers.ticker}
          </AccentBadge>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {Object.values(SECTOR_PRESETS).map((p) => {
          const isActive = p.id === selectedPresetKey;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              aria-pressed={isActive}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                isActive
                  ? "bg-[var(--aurora-accent)] text-white shadow-[0_0_16px_rgba(74,158,255,0.55)]"
                  : "bg-white/8 text-white/55 hover:bg-white/16 hover:text-white"
              }`}
            >
              {p.name.split("&")[0]}
            </button>
          );
        })}
      </div>

      {/* Top Strategic Overview Banner */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile
          label="Rácio LTV / CAC"
          value={`${unitEconomics.ltvCacRatio}x`}
          delta="Excelente"
          deltaTone="up"
          footnote={`Payback em ${unitEconomics.paybackMonths} meses`}
        />
        <StatTile
          accent
          label="Break-even"
          value={fmtMoney(breakEven.breakEvenRevenue)}
          delta={`${breakEven.marginOfSafetyPct}%`}
          deltaTone="up"
          footnote="Margem de segurança"
        />
        <StatTile
          label="Runway de caixa"
          value={`${planPackage.runwayMonths} meses`}
          footnote="Buffer mínimo preservado"
        />
        <StatTile
          accent
          label="McKinsey 7S"
          value={`${mckinsey7s.alignmentScore}/100`}
          footnote="Alinhamento estratégico alto"
        />
      </div>

      {/* Module Navigation Tabs */}
      <SegmentedTabs
        active={activeModule}
        onSelect={setActiveModule}
        tabs={[
          { id: "strategy", label: "1. Visão Estratégica & 7S", shortLabel: "Estratégia", icon: Award },
          { id: "market", label: "2. Mercado & TAM/SAM/SOM", shortLabel: "Mercado", icon: Target },
          { id: "unitEconomics", label: "3. Economia Unitária & GTM", shortLabel: "Economia", icon: DollarSign },
          { id: "financials", label: "4. Projeções & Break-Even", shortLabel: "Projeções", icon: FileSpreadsheet },
          { id: "risk", label: "5. Risco & Capital (KPMG)", shortLabel: "Risco", icon: ShieldCheck },
        ]}
      />

      {/* MODULE CONTENT */}

      {/* 1. Strategy & McKinsey 7S */}
      {activeModule === "strategy" && (
        <GlassCard className="space-y-6 !p-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-[var(--aurora-accent)] flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--aurora-accent)]" /> Resumo Executivo & Pilares Estratégicos
            </h2>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              {planPackage.executiveSummary}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--aurora-accent)]" /> Framework McKinsey 7S (Alinhamento Organizacional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-1.5">
                <span className="font-bold text-[var(--aurora-accent)] uppercase text-[10px] tracking-wider block">Strategy (Estratégia)</span>
                <p className="text-white/80 leading-snug">{mckinsey7s.strategy}</p>
              </div>
              <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-1.5">
                <span className="font-bold text-[var(--aurora-accent)] uppercase text-[10px] tracking-wider block">Structure (Estrutura)</span>
                <p className="text-white/80 leading-snug">{mckinsey7s.structure}</p>
              </div>
              <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-1.5">
                <span className="font-bold text-[var(--aurora-accent)] uppercase text-[10px] tracking-wider block">Systems (Sistemas)</span>
                <p className="text-white/80 leading-snug">{mckinsey7s.systems}</p>
              </div>
              <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-1.5">
                <span className="font-bold text-[var(--aurora-accent)] uppercase text-[10px] tracking-wider block">Shared Values (Valores Partilhados)</span>
                <p className="text-white/80 leading-snug">{mckinsey7s.sharedValues}</p>
              </div>
              <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-1.5">
                <span className="font-bold text-[var(--aurora-accent)] uppercase text-[10px] tracking-wider block">Style & Staff (Liderança & Equipa)</span>
                <p className="text-white/80 leading-snug">{mckinsey7s.style} · {mckinsey7s.staff}</p>
              </div>
              <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-1.5">
                <span className="font-bold text-[var(--aurora-accent)] uppercase text-[10px] tracking-wider block">Skills (Competências Core)</span>
                <p className="text-white/80 leading-snug">{mckinsey7s.skills}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 2. Market Sizing */}
      {activeModule === "market" && (
        <GlassCard className="space-y-6 !p-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-[var(--aurora-accent)] flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--aurora-accent)]" /> Sizing de Mercado (TAM / SAM / SOM) & Moat
            </h2>
            <p className="text-xs text-white/60">Análise de penetração de mercado e vantagens competitivas sustentáveis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[rgba(74,158,255,0.32)] bg-[rgba(74,158,255,0.10)] p-5 text-center space-y-2">
              <span className="text-xs font-bold text-[var(--aurora-accent)] uppercase tracking-wider block">TAM (Total Addressable Market)</span>
              <span className="text-2xl font-black text-white">$1.45 Triliões</span>
              <p className="text-[11px] text-white/60">Mercado global total no setor de {drivers.sector}</p>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center space-y-2">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">SAM (Serviceable Addressable Market)</span>
              <span className="text-2xl font-black text-white">$380 Biliões</span>
              <p className="text-[11px] text-white/60">Mercado servível nos segmentos foco</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">SOM (Serviceable Obtainable Market)</span>
              <span className="text-2xl font-black text-white">$65 Biliões</span>
              <p className="text-[11px] text-white/60">Meta de captura em 5 anos</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 3. Unit Economics */}
      {activeModule === "unitEconomics" && (
        <GlassCard className="space-y-6 !p-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-[var(--aurora-accent)] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[var(--aurora-accent)]" /> Economia Unitária & Simulador Interativo (CAC / LTV)
            </h2>
            <p className="text-xs text-white/60">Ajuste os parâmetros de aquisição e retenção para simular o rácio LTV/CAC em tempo real.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sliders */}
            <div className="rounded-xl border border-white/10 glass-soft p-4 space-y-4 text-xs">
              <h3 className="font-bold text-white uppercase text-[11px]">Parâmetros de Entrada</h3>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/70">CAC (Custo Aquisição Cliente)</span>
                  <span className="font-mono font-bold text-[var(--aurora-accent)]">${cac.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={Math.round(drivers.averageUnitPrice * 0.4)}
                  step={100}
                  value={cac}
                  onChange={(e) => setCac(Number(e.target.value))}
                  className="w-full accent-[var(--aurora-accent)]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/70">ARPU (Receita Média por Cliente/Ano)</span>
                  <span className="font-mono font-bold text-[var(--aurora-accent)]">${arpu.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={Math.round(drivers.averageUnitPrice * 0.8)}
                  step={500}
                  value={arpu}
                  onChange={(e) => setArpu(Number(e.target.value))}
                  className="w-full accent-[var(--aurora-accent)]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/70">Churn Anual (% Cancelamento)</span>
                  <span className="font-mono font-bold text-[var(--aurora-accent)]">{churn}%</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={1}
                  value={churn}
                  onChange={(e) => setChurn(Number(e.target.value))}
                  className="w-full accent-[var(--aurora-accent)]"
                />
              </div>
            </div>

            {/* Results Display */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-white/60 text-[11px] block uppercase">Lifetime Value (LTV)</span>
                <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">${unitEconomics.ltv.toLocaleString()}</span>
                <p className="text-[10px] text-white/50 mt-1">Margem Bruta {(drivers.grossMarginPct * 100).toFixed(0)}% / Churn {churn}%</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-white/60 text-[11px] block uppercase">Rácio LTV / CAC</span>
                <span className="text-3xl font-black text-[var(--aurora-accent)] font-mono mt-1 block">{unitEconomics.ltvCacRatio}x</span>
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">Target Ideal &gt; 3.0x</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-white/60 text-[11px] block uppercase">Payback em Meses</span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">{unitEconomics.paybackMonths} Meses</span>
                <p className="text-[10px] text-white/50 mt-1">Tempo de recuperação do CAC</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-white/60 text-[11px] block uppercase">Margem de Contribuição</span>
                <span className="text-3xl font-black text-[var(--aurora-accent)] font-mono mt-1 block">{(breakEven.contributionMarginRatio * 100).toFixed(1)}%</span>
                <p className="text-[10px] text-white/50 mt-1">Rácio unitário pós custos variáveis</p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 4. Financials & Break-even */}
      {activeModule === "financials" && (
        <GlassCard className="space-y-6 !p-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-[var(--aurora-accent)] flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[var(--aurora-accent)]" /> Projeções Sistémicas 5Y & Análise de Break-Even
            </h2>
            <p className="text-xs text-white/60">Projeção financeira completa derivada do modelo de 20.+Complete+the+BS_before.xlsx</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/10 text-white/80 font-semibold">
                <tr>
                  <th className="p-3">Demonstração Financeira ($ M)</th>
                  {reports.map((r) => (
                    <th key={r.year} className="p-3 text-right font-mono">{r.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-white/90">
                <tr className="bg-white/5 font-bold text-white">
                  <td className="p-3 font-sans">Receita Total</td>
                  {reports.map((r) => (
                    <td key={r.year} className="p-3 text-right">${(r.totalRevenue / 1e6).toFixed(1)}M</td>
                  ))}
                </tr>
                <tr className="font-semibold text-emerald-300">
                  <td className="p-3 font-sans">Lucro Bruto</td>
                  {reports.map((r) => (
                    <td key={r.year} className="p-3 text-right">${(r.grossProfit / 1e6).toFixed(1)}M</td>
                  ))}
                </tr>
                <tr className="bg-[rgba(74,158,255,0.10)] font-bold text-[var(--aurora-accent)]">
                  <td className="p-3 font-sans">EBITDA</td>
                  {reports.map((r) => (
                    <td key={r.year} className="p-3 text-right">${(r.ebitda / 1e6).toFixed(1)}M</td>
                  ))}
                </tr>
                <tr className="font-bold text-emerald-400 bg-emerald-500/10">
                  <td className="p-3 font-sans">Lucro Líquido (Net Income)</td>
                  {reports.map((r) => (
                    <td key={r.year} className="p-3 text-right">${(r.netIncome / 1e6).toFixed(1)}M</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-sans text-white/70">Fluxo de Caixa Operacional (CFO)</td>
                  {reports.map((r) => (
                    <td key={r.year} className="p-3 text-right">${(r.cashFromOperations / 1e6).toFixed(1)}M</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* 5. Risk & KPMG Audit Matrix */}
      {activeModule === "risk" && (
        <GlassCard className="space-y-6 !p-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-[var(--aurora-accent)] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--aurora-accent)]" /> Matriz de Risco & Auditoria (Padrão KPMG)
            </h2>
            <p className="text-xs text-white/60">Mapeamento de riscos estratégicos, operacionais, regulatórios e financeiros.</p>
          </div>

          <div className="space-y-3">
            {kpmgRisks.map((r, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 glass-soft p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{r.riskCategory} Risk</span>
                    <Pill tone={r.auditStatus === "Compliant" ? "active" : "alert"}>
                      {r.auditStatus}
                    </Pill>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-white/60">Impacto: <strong className="text-[var(--aurora-accent)]">{r.impactLevel}</strong></span>
                    <span className="text-white/60">Probabilidade: <strong className="text-white">{r.likelihood}</strong></span>
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed">{r.riskDescription}</p>
                <div className="rounded-lg bg-white/5 p-2 text-emerald-300 font-medium text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Estratégia de Mitigação: {r.mitigationStrategy}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Funding Roadmap */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--aurora-accent)]" /> Roadmap de Rondas de Financiamento & Diluição
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {fundingRoadmap.map((round, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 glass-soft p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--aurora-accent)] text-sm">{round.roundName}</span>
                    <Pill className="!px-2 !py-0.5 !text-[10px]">Ano {round.targetYear}</Pill>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-sans text-white/60">Montante de Capital Target:</span>
                      <span className="text-emerald-300 font-bold">${(round.capitalAmount / 1e6).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-white/60">Valuação Post-Money:</span>
                      <span>${(round.postMoneyValuation / 1e6).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-white/60">Equity Investidor (%):</span>
                      <span className="text-[var(--aurora-accent)]">{round.investorEquityPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
