/**
 * useIipaModel — composes every IIPA engine output for the current mandate.
 * Heavy work (Monte Carlo, optimisation) is memoised per mandate, and the
 * mandate itself is deferred so editing it never blocks the UI.
 */
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  ANNUAL_COSTS,
  ASSET_CLASSES,
  BENCHMARK_LAYERS,
  CONSTRAINTS,
  CORRELATIONS,
  CURRENT_WEIGHTS,
  DATA_DOMAINS,
  DEFAULT_MANDATE,
  FORECAST_REGISTRY,
  LAYER_OBSERVATIONS,
  MANAGER_ALPHA,
  NAIVE_FORECASTS,
  POLICY_WEIGHTS,
  SCENARIOS,
  STRESS_TESTS,
  type BenchmarkLayer,
  type Mandate,
  type ScenarioId,
} from "@/lib/finance/iipaData";
import {
  LEVEL_RANK,
  attainableReturn,
  attribution,
  buildUniverse,
  dataQuality,
  evaluateAlerts,
  forecastValidation,
  fxExposure,
  liquidShare,
  monteCarlo,
  optimize,
  portfolioStats,
  relativeStats,
  runScenarios,
  scenarioUniverse,
  stressTests,
  toVec,
  yearReturnAt,
  type AlertLevel,
} from "@/lib/finance/iipaEngine";
import { holdingsData } from "@/data/portfolio";
import { usePortfolioStore } from "@/data/portfolioStore";

const STORAGE_KEY = "ollympius.iipa.mandate";

function loadMandate(): Mandate {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_MANDATE, ...(JSON.parse(raw) as Partial<Mandate>) } : DEFAULT_MANDATE;
  } catch {
    return DEFAULT_MANDATE;
  }
}

export function useMandate() {
  const [mandate, setMandateState] = useState<Mandate>(loadMandate);
  const setMandate = useCallback((m: Mandate) => {
    setMandateState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, []);
  const reset = useCallback(() => setMandate(DEFAULT_MANDATE), [setMandate]);
  return { mandate, setMandate, reset };
}

export const requiredReturn = (m: Mandate) => (1 + m.inflation) * (1 + m.realTarget) - 1;

export interface LayerResult extends BenchmarkLayer {
  portfolio: string;
  reference: string;
  ahead: boolean;
  samuraiScore: number;
  needsReview: boolean;
}

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

export function useIipaModel(mandateInput: Mandate) {
  const mandate = useDeferredValue(mandateInput);
  const { holdings } = usePortfolioStore();

  /* Issuer concentration: equity sleeve × each holding's share of it. */
  const issuer = useMemo(() => {
    const priced = holdings.map((h) => {
      const px = holdingsData.find((d) => d.symbol === h.symbol)?.price ?? h.purchasePrice;
      return { symbol: h.symbol, value: h.shares * px };
    });
    const total = priced.reduce((s, p) => s + p.value, 0) || 1;
    const top = [...priced].sort((a, b) => b.value - a.value)[0];
    const equitySleeve = CURRENT_WEIGHTS.gEq + CURRENT_WEIGHTS.emEq;
    return { max: top ? (top.value / total) * equitySleeve : 0, symbol: top?.symbol ?? "—" };
  }, [holdings]);

  const core = useMemo(() => {
    const target = requiredReturn(mandate);
    const u = buildUniverse(ASSET_CLASSES, CORRELATIONS);
    const wp = toVec(u, CURRENT_WEIGHTS);
    const wb = toVec(u, POLICY_WEIGHTS);
    const current = portfolioStats(u, wp, mandate.riskFree);
    const policy = portfolioStats(u, wb, mandate.riskFree);
    const relative = relativeStats(u, wp, wb);

    const mc = monteCarlo({
      mu: current.ret,
      sigma: current.vol,
      years: mandate.horizonYears,
      paths: 1500,
      seed: 424_242,
      capital: mandate.capitalUsd,
      target,
      maxLoss12m: mandate.maxLoss12m,
    });
    const scenarios = runScenarios(u, wp, SCENARIOS, mandate, target);
    const stress = stressTests(u, wp, STRESS_TESTS, mandate);
    const worstStress = [...stress].sort((a, b) => a.loss - b.loss)[0]!;
    const opt = optimize(u, wp, wb, mandate, CONSTRAINTS, target);
    const attr = attribution({
      u,
      wp,
      wb,
      alpha: toVec(u, MANAGER_ALPHA),
      costs: ANNUAL_COSTS,
      target,
      riskFree: mandate.riskFree,
    });
    const forecast = forecastValidation(FORECAST_REGISTRY, NAIVE_FORECASTS, mandate.riskFree);
    const dq = dataQuality(DATA_DOMAINS, mandate.minDataQuality);

    const drift = u.classes.map((c, i) => ({
      id: c.id,
      label: c.label,
      short: c.short,
      color: c.color,
      current: wp[i]!,
      policy: wb[i]!,
      delta: wp[i]! - wb[i]!,
    }));
    const maxDrift = [...drift].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]!;

    const attainableNominal = attainableReturn(
      current.ret,
      current.vol,
      mandate.horizonYears,
      0.65,
    );
    const attainableReal65 = (1 + attainableNominal) / (1 + mandate.inflation) - 1;
    const badYear = yearReturnAt(current.ret, current.vol, -1.6449);

    return {
      target,
      u,
      wp,
      wb,
      current,
      policy,
      relative,
      mc,
      scenarios,
      stress,
      worstStress,
      opt,
      attr,
      forecast,
      dq,
      drift,
      maxDrift,
      attainableReal65,
      badYear,
      liquidity: liquidShare(u, wp),
      fx: fxExposure(u, wp),
    };
  }, [mandate]);

  const alerts = useMemo(
    () =>
      evaluateAlerts({
        mandate,
        maxDrift: Math.abs(core.maxDrift.delta),
        driftClass: core.maxDrift.short,
        trackingError: core.relative.trackingError,
        badYear: core.badYear,
        dataScore: core.dq.score,
        modelBeatenBy: core.forecast.beatenBy,
        liquidity: core.liquidity,
        fx: core.fx,
        issuerMax: issuer.max,
        issuerName: issuer.symbol,
        worstStress: core.worstStress,
      }),
    [mandate, core, issuer],
  );

  const worstLevel: AlertLevel = alerts.reduce<AlertLevel>(
    (w, a) => (LEVEL_RANK[a.level] > LEVEL_RANK[w] ? a.level : w),
    "green",
  );

  const layers: LayerResult[] = useMemo(() => {
    const m = core.attr.metrics;
    const classesAhead = core.attr.byClass.filter((c) => c.selection > 0).length;
    const o = LAYER_OBSERVATIONS;
    const values: Record<string, { portfolio: string; reference: string; ahead: boolean }> = {
      objective: {
        portfolio: pct(core.current.ret),
        reference: pct(core.target),
        ahead: core.current.ret >= core.target,
      },
      policy: {
        portfolio: pct(m.portfolioReturn),
        reference: pct(m.policyReturn),
        ahead: m.activeReturn >= 0,
      },
      class: {
        portfolio: `${classesAhead} de ${core.attr.byClass.length}`,
        reference: "classes acima",
        ahead: classesAhead >= core.attr.byClass.length / 2,
      },
      peers: {
        portfolio: `${o.peersPercentile}.º`,
        reference: "percentil",
        ahead: o.peersPercentile <= 50,
      },
      risk: {
        portfolio: pct(core.current.vol),
        reference: pct(core.policy.vol),
        ahead: core.current.vol <= core.policy.vol * 1.15,
      },
      implementation: {
        portfolio: `${o.slippageBps.toFixed(1)} pb`,
        reference: `${o.slippageBudgetBps} pb`,
        ahead: o.slippageBps <= o.slippageBudgetBps,
      },
      sustainability: {
        portfolio: `${o.carbonIntensity} t`,
        reference: `${o.carbonIndex} t`,
        ahead: o.carbonIntensity <= o.carbonIndex,
      },
    };
    return BENCHMARK_LAYERS.map((l) => {
      const score = l.samurai.filter(Boolean).length;
      return {
        ...l,
        ...values[l.id]!,
        samuraiScore: score,
        needsReview: l.samurai.length - score >= 2,
      };
    });
  }, [core]);

  return {
    mandate,
    pending: mandate !== mandateInput,
    ...core,
    issuer,
    alerts,
    worstLevel,
    layers,
  };
}

export type IipaModel = ReturnType<typeof useIipaModel>;

/** Projection for a given horizon under a scenario (Projections section). */
export function useHorizonProjection(model: IipaModel, years: number, scenarioId: ScenarioId) {
  return useMemo(() => {
    const s = SCENARIOS.find((x) => x.id === scenarioId) ?? SCENARIOS[0]!;
    const su = scenarioUniverse(model.u, s);
    const st = portfolioStats(su, model.wp, model.mandate.riskFree);
    return {
      stats: st,
      mc: monteCarlo({
        mu: st.ret,
        sigma: st.vol,
        years,
        paths: 1200,
        seed: 900 + years * 13 + SCENARIOS.indexOf(s) * 7,
        capital: model.mandate.capitalUsd,
        target: model.target,
        maxLoss12m: model.mandate.maxLoss12m,
      }),
    };
  }, [model.u, model.wp, model.mandate, model.target, years, scenarioId]);
}
