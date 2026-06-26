import { useState, useEffect } from "react";
import { GlassCard } from "../GlassCard";
import { Pill } from "../primitives";
import { formatNum, formatPct } from "@/lib/finance/calculations";
import { holdingsData } from "@/data/portfolio";
import { getEnrichedBySymbol } from "@/data/portfolioEnriched";
import { cn } from "@/lib/utils";
import { Target, BarChart3, HelpCircle } from "lucide-react";

export interface ValuationPanelProps {
  symbol: string;
}

export function ValuationPanel({ symbol }: ValuationPanelProps) {
  const stock = holdingsData.find((h) => h.symbol === symbol) || holdingsData[0]!;
  const enriched = getEnrichedBySymbol(stock.symbol);

  const [mobileView, setMobileView] = useState<"inputs" | "outputs">("inputs");

  // 1. WACC Calculator States (Defaults from Excel)
  const [riskFree, setRiskFree] = useState(0.025);
  const [marketReturn, setMarketReturn] = useState(0.085);
  const [beta, setBeta] = useState(stock.beta);
  const [equityPct, setEquityPct] = useState(0.5);
  const [costOfDebt, setCostOfDebt] = useState(0.05);
  const [taxRate, setTaxRate] = useState(0.3);

  // 2. Growth and Multiples States
  const [fcfGrowth, setFcfGrowth] = useState(0.1);
  const [terminalGrowth, setTerminalGrowth] = useState(0.02);
  const [revGrowth, setRevGrowth] = useState(0.08);
  const [epsGrowth, setEpsGrowth] = useState(0.12);

  // Sync state when selected ticker changes
  useEffect(() => {
    setBeta(stock.beta);
  }, [stock]);

  // Parse Revenue to Numeric (Billions/Millions to absolute number)
  const parseRevenue = (revStr: string): number => {
    const num = parseFloat(revStr);
    if (revStr.endsWith("B")) return num * 1e9;
    if (revStr.endsWith("M")) return num * 1e6;
    return num;
  };

  const directRev = stock.symbol === "MSFT" ? 87.25e9 : stock.symbol === "AAPL" ? 220.46e9 : 50e9; // fallbacks based on holdings data
  const sharesEst =
    stock.symbol === "MSFT"
      ? 7549.35e6
      : stock.symbol === "AAPL"
        ? 5081.25e6
        : (stock.positionSize / stock.price) * 1e6;

  // WACC Calculations
  const costOfEquity = riskFree + beta * (marketReturn - riskFree);
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
  const debtPct = 1 - equityPct;
  const wacc = costOfEquity * equityPct + afterTaxCostOfDebt * debtPct;

  // const base FCF from EBITDA or Price
  const baseFcf = stock.price * sharesEst * 0.08; // Assume 8% of market cap as starting FCF

  // DCF Calculations (5 years)
  const fcfs: number[] = [];
  const discountedFcfs: number[] = [];
  let sumDiscountedFcfs = 0;

  for (let t = 1; t <= 5; t++) {
    const fcf = baseFcf * Math.pow(1 + fcfGrowth, t);
    fcfs.push(fcf);
    const disc = fcf / Math.pow(1 + wacc, t);
    discountedFcfs.push(disc);
    sumDiscountedFcfs += disc;
  }

  // Guard WACC <= terminalGrowth to prevent division by zero or negative terminal value
  const adjustedWacc = wacc <= terminalGrowth ? terminalGrowth + 0.01 : wacc;
  const terminalVal = (fcfs[4]! * (1 + terminalGrowth)) / (adjustedWacc - terminalGrowth);
  const discountedTerminalVal = terminalVal / Math.pow(1 + wacc, 5);
  const impliedEnterpriseVal = sumDiscountedFcfs + discountedTerminalVal;
  const dcfTargetJustRight = impliedEnterpriseVal / sharesEst;
  const dcfTargetBullish = dcfTargetJustRight * 1.15;
  const dcfTargetBearish = dcfTargetJustRight * 0.85;

  // P/R Calculations (Price to Revenue)
  // Projected Revenue in 5 years
  const revBase = directRev;
  const revYear5 = revBase * Math.pow(1 + revGrowth, 5);
  // Target Prices in Year 5
  const prBullish5 = (revYear5 * 10) / sharesEst;
  const prBearish5 = (revYear5 * 5) / sharesEst;
  const prJustRight5 = (revYear5 * 7.5) / sharesEst;
  // Discounted Target Price Today (4 years discounting as in xlsx)
  const prTargetBullish = prBullish5 / Math.pow(1 + wacc, 4);
  const prTargetBearish = prBearish5 / Math.pow(1 + wacc, 4);
  const prTargetJustRight = prJustRight5 / Math.pow(1 + wacc, 4);

  // P/E Calculations (Price to Earnings)
  const epsBase =
    stock.symbol === "MSFT" ? 2.27 : stock.symbol === "AAPL" ? 8.52 : stock.price * 0.05; // Estimate if not there
  const epsYear5 = epsBase * Math.pow(1 + epsGrowth, 5);
  // Target P/E Multipliers in Year 5
  const peBullishMult = 2.0 * epsGrowth * 100;
  const peBearishMult = 1.0 * epsGrowth * 100;
  const peJustRightMult = 1.5 * epsGrowth * 100;
  // Target Prices in Year 5
  const peBullish5 = epsYear5 * peBullishMult;
  const peBearish5 = epsYear5 * peBearishMult;
  const peJustRight5 = epsYear5 * peJustRightMult;
  // Discounted Target Price Today (4 years discounting)
  const peTargetBullish = peBullish5 / Math.pow(1 + wacc, 4);
  const peTargetBearish = peBearish5 / Math.pow(1 + wacc, 4);
  const peTargetJustRight = peJustRight5 / Math.pow(1 + wacc, 4);

  // Bottom Line - Average of all 3 'Just Right' targets
  const averageTargetPrice = (dcfTargetJustRight + prTargetJustRight + peTargetJustRight) / 3;
  const priceUpside = averageTargetPrice / stock.price - 1;

  // 3. Multiples comparison data
  const sector = stock.sector;
  const getIndustryAverages = (sec: string) => {
    if (sec === "Technology") {
      return { pe: 28.5, fpe: 22.0, pb: 6.5, ps: 5.2, peg: 1.4, evEbitda: 18.2, pFcf: 24.5 };
    }
    if (sec === "Consumer Goods" || sec === "Consumer Cyclical" || sec === "Consumer Electronics") {
      return { pe: 22.1, fpe: 18.5, pb: 4.8, ps: 3.1, peg: 1.6, evEbitda: 14.0, pFcf: 19.0 };
    }
    if (sec === "Healthcare") {
      return { pe: 24.0, fpe: 17.5, pb: 4.0, ps: 4.2, peg: 1.5, evEbitda: 15.1, pFcf: 20.0 };
    }
    if (sec === "Energy") {
      return { pe: 11.5, fpe: 10.0, pb: 1.8, ps: 1.1, peg: 1.1, evEbitda: 6.8, pFcf: 9.5 };
    }
    // Industrial / fallback
    return { pe: 18.2, fpe: 15.0, pb: 3.2, ps: 1.8, peg: 1.3, evEbitda: 11.5, pFcf: 15.5 };
  };

  const peerAvg = getIndustryAverages(sector);
  const peVal = enriched?.valuation.peRatio ?? 0;
  const fpeVal = enriched?.valuation.forwardPE ?? 0;
  const pbVal = enriched?.valuation.pbRatio ?? 0;
  const psVal = enriched?.valuation.psRatio ?? 0;
  const pegVal = enriched?.valuation.pegRatio ?? 0;
  const evEbitdaVal = enriched?.valuation.evToEbitda ?? 0;
  const pFcfVal = enriched?.valuation.priceToFcf ?? 0;

  const multiples = [
    { label: "P/E Ratio", value: peVal, peer: peerAvg.pe },
    { label: "Forward P/E", value: fpeVal, peer: peerAvg.fpe },
    { label: "P/B Ratio", value: pbVal, peer: peerAvg.pb },
    { label: "P/S Ratio", value: psVal, peer: peerAvg.ps },
    { label: "PEG Ratio", value: pegVal, peer: peerAvg.peg },
    { label: "EV/EBITDA", value: evEbitdaVal, peer: peerAvg.evEbitda },
    { label: "Price/FCF", value: pFcfVal, peer: peerAvg.pFcf },
  ];

  // Analyst Range Setup
  const wallStreetTarget = enriched?.sentiment.averageTargetPrice ?? stock.price * 1.15;
  const lowTarget = wallStreetTarget * 0.8;
  const highTarget = wallStreetTarget * 1.2;
  const currentPrice = stock.price;

  // Margin of safety = (averageTargetPrice - currentPrice) / averageTargetPrice
  const modelMarginOfSafety = (averageTargetPrice - currentPrice) / averageTargetPrice;
  const streetMarginOfSafety = (wallStreetTarget - currentPrice) / wallStreetTarget;

  // Rating Consensus
  const buy = enriched?.sentiment.analystBuy ?? 20;
  const hold = enriched?.sentiment.analystHold ?? 5;
  const sell = enriched?.sentiment.analystSell ?? 1;
  const totalA = buy + hold + sell;
  let consensus = "Hold";
  let consensusColor = "text-[#FFB020]";
  if (totalA > 0) {
    const buyPct = buy / totalA;
    const sellPct = sell / totalA;
    if (buyPct >= 0.7) {
      consensus = "Strong Buy";
      consensusColor = "text-[#00D17A]";
    } else if (buyPct >= 0.5) {
      consensus = "Buy";
      consensusColor = "text-[#00D17A]/80";
    } else if (sellPct >= 0.4) {
      consensus = "Sell";
      consensusColor = "text-[#FF4D4F]";
    } else if (sellPct >= 0.2) {
      consensus = "Underperform";
      consensusColor = "text-[#FF4D4F]/80";
    }
  }

  // Price position inside Bear-Bull range (0 to 100)
  const rangePct = Math.min(
    100,
    Math.max(0, ((currentPrice - lowTarget) / (highTarget - lowTarget)) * 100),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile Toggle between Assumptions & Summary */}
      <div className="md:hidden flex shrink-0">
        <div className="glass-soft flex w-full gap-0.5 p-0.5" style={{ borderRadius: 10 }}>
          <button
            onClick={() => setMobileView("inputs")}
            className={cn(
              "flex-1 text-center py-2 text-[11px] font-semibold transition-all duration-200",
              mobileView === "inputs"
                ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
            style={{ borderRadius: 8 }}
          >
            Assumptions (Inputs)
          </button>
          <button
            onClick={() => setMobileView("outputs")}
            className={cn(
              "flex-1 text-center py-2 text-[11px] font-semibold transition-all duration-200",
              mobileView === "outputs"
                ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
            style={{ borderRadius: 8 }}
          >
            Valuation Engine (Outputs)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Parameters Panel */}
        <GlassCard
          className={cn(
            "flex flex-col !p-4 min-h-[350px]",
            mobileView === "inputs" ? "flex" : "hidden md:flex",
          )}
        >
          <Pill className="self-start !px-3 !py-1 !text-[12px] !font-semibold mb-3">
            Valuation Assumptions ({stock.symbol})
          </Pill>

          <div className="flex-1 flex flex-col gap-3.5 text-[11px] overflow-y-auto max-h-[380px] pr-1">
            {/* Risk Free Rate Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-semibold text-white/80">
                <span>Risk Free Rate</span>
                <span>{formatPct(riskFree)}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.08"
                step="0.001"
                value={riskFree}
                onChange={(e) => setRiskFree(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Market Return Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-semibold text-white/80">
                <span>Stock Market Return</span>
                <span>{formatPct(marketReturn)}</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.16"
                step="0.002"
                value={marketReturn}
                onChange={(e) => setMarketReturn(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Beta Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-semibold text-white/80">
                <span>Beta (Risk Profile)</span>
                <span>{formatNum(beta)}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Capital Structure (Equity Weight) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-semibold text-white/80">
                <span>Equity Weight</span>
                <span>{formatPct(equityPct, 0)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={equityPct}
                onChange={(e) => setEquityPct(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* FCF Growth Slider */}
            <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
              <div className="flex justify-between font-semibold text-white/80">
                <span>FCF Growth Rate (DCF)</span>
                <span>{formatPct(fcfGrowth)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.3"
                step="0.01"
                value={fcfGrowth}
                onChange={(e) => setFcfGrowth(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Revenue Growth Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-semibold text-white/80">
                <span>Rev Growth Rate (P/R)</span>
                <span>{formatPct(revGrowth)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.25"
                step="0.01"
                value={revGrowth}
                onChange={(e) => setRevGrowth(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* EPS Growth Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-semibold text-white/80">
                <span>EPS Growth Rate (P/E)</span>
                <span>{formatPct(epsGrowth)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.3"
                step="0.01"
                value={epsGrowth}
                onChange={(e) => setEpsGrowth(parseFloat(e.target.value))}
                className="w-full accent-[#00D17A] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </GlassCard>

        {/* Outputs Panel */}
        <GlassCard
          className={cn(
            "flex flex-col !p-4 min-h-[350px] lg:col-span-2",
            mobileView === "outputs" ? "flex" : "hidden md:flex",
          )}
        >
          <Pill className="self-start !px-3 !py-1 !text-[12px] !font-semibold mb-3">
            Valuation Engine Summary ({stock.symbol})
          </Pill>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Left: Summary Metrics */}
            <div className="flex flex-col justify-around gap-2 text-[11px]">
              <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col">
                <span className="text-white/50 text-[10px] uppercase tracking-wider">
                  Weighted Cost of Capital (WACC)
                </span>
                <span className="text-xl font-bold tabular-nums text-white mt-1">
                  {formatPct(wacc)}
                </span>
                <div className="flex justify-between text-[9px] text-white/40 mt-1">
                  <span>Cost of Equity: {formatPct(costOfEquity)}</span>
                  <span>Cost of Debt: {formatPct(afterTaxCostOfDebt)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center justify-between">
                <div>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider block">
                    Current Stock Price
                  </span>
                  <span className="text-xl font-bold tabular-nums text-white mt-1 block">
                    ${formatNum(stock.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-white/50 text-[10px] uppercase tracking-wider block">
                    Average Target Price
                  </span>
                  <span className="text-xl font-bold tabular-nums text-[#00D17A] mt-1 block">
                    ${formatNum(averageTargetPrice)}
                  </span>
                </div>
              </div>

              {/* Implied Upside Card */}
              <div
                className="rounded-xl p-3 flex items-center justify-between border"
                style={{
                  backgroundColor:
                    priceUpside >= 0 ? "rgba(0, 209, 122, 0.08)" : "rgba(255, 77, 79, 0.08)",
                  borderColor:
                    priceUpside >= 0 ? "rgba(0, 209, 122, 0.2)" : "rgba(255, 77, 79, 0.2)",
                }}
              >
                <div>
                  <span className="text-white/60 text-[10px] uppercase tracking-wider block">
                    Implied Upside
                  </span>
                  <span
                    className="text-2xl font-black tabular-nums mt-0.5 block"
                    style={{ color: priceUpside >= 0 ? "#00D17A" : "#FF4D4F" }}
                  >
                    {priceUpside >= 0 ? "+" : ""}
                    {formatPct(priceUpside)}
                  </span>
                </div>
                <span
                  className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0"
                  style={{
                    backgroundColor:
                      priceUpside >= 0 ? "rgba(0, 209, 122, 0.2)" : "rgba(255, 77, 79, 0.2)",
                    color: priceUpside >= 0 ? "#00D17A" : "#FF4D4F",
                  }}
                >
                  {priceUpside >= 0 ? "BUY / LONG" : "SELL / SHORT"}
                </span>
              </div>
            </div>

            {/* Right: Methodologies breakdown */}
            <div className="flex flex-col gap-2.5 text-[11px] justify-center">
              {/* DCF Breakdown */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">1. DCF Valuation Target</span>
                  <span className="font-bold tabular-nums text-white">
                    ${formatNum(dcfTargetJustRight)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] text-center text-white/50">
                  <div className="bg-white/5 rounded py-0.5">
                    Bear: ${formatNum(dcfTargetBearish)}
                  </div>
                  <div className="bg-[#00D17A]/15 text-[#00D17A] rounded py-0.5">Just Right</div>
                  <div className="bg-white/5 rounded py-0.5">
                    Bull: ${formatNum(dcfTargetBullish)}
                  </div>
                </div>
              </div>

              {/* P/R Breakdown */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">2. Price to Revenue Multiple</span>
                  <span className="font-bold tabular-nums text-white">
                    ${formatNum(prTargetJustRight)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] text-center text-white/50">
                  <div className="bg-white/5 rounded py-0.5">
                    Bear (5x): ${formatNum(prTargetBearish)}
                  </div>
                  <div className="bg-[#00D17A]/15 text-[#00D17A] rounded py-0.5">
                    Just Right (7.5x)
                  </div>
                  <div className="bg-white/5 rounded py-0.5">
                    Bull (10x): ${formatNum(prTargetBullish)}
                  </div>
                </div>
              </div>

              {/* P/E Breakdown */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">3. Price to Earnings Multiple</span>
                  <span className="font-bold tabular-nums text-white">
                    ${formatNum(peTargetJustRight)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] text-center text-white/50">
                  <div className="bg-white/5 rounded py-0.5">
                    Bear: ${formatNum(peTargetBearish)}
                  </div>
                  <div className="bg-[#00D17A]/15 text-[#00D17A] rounded py-0.5">
                    Just Right (1.5x)
                  </div>
                  <div className="bg-white/5 rounded py-0.5">
                    Bull: ${formatNum(peTargetBullish)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Peer Multiples & Analyst Target Ranges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Multiples Peer Comparison */}
        <GlassCard className="!p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 size={14} className="text-[#4a9eff]" />
              <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
                Valuation Multiples vs Industry Peer Average
              </Pill>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider text-[9px]">
                    <th className="pb-1.5">Metric</th>
                    <th className="pb-1.5 text-right">{stock.symbol}</th>
                    <th className="pb-1.5 text-right">Industry Avg</th>
                    <th className="pb-1.5 text-right">Premium / Disc.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {multiples.map((m) => {
                    const diff = m.peer > 0 ? (m.value - m.peer) / m.peer : 0;
                    const isDiscount = diff < 0;
                    const color = isDiscount ? "text-[#00D17A]" : "text-[#FF4D4F]";
                    return (
                      <tr key={m.label} className="hover:bg-white/5 transition-colors">
                        <td className="py-1.5 font-medium text-white/70">{m.label}</td>
                        <td className="py-1.5 text-right font-semibold text-white">
                          {formatNum(m.value)}
                        </td>
                        <td className="py-1.5 text-right text-white/50">{formatNum(m.peer)}</td>
                        <td className={cn("py-1.5 text-right font-bold tabular-nums", color)}>
                          {isDiscount ? "" : "+"}
                          {formatPct(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[9.5px] text-white/40 mt-3 pt-2 border-t border-white/5 flex justify-between">
            <span>Industry Peers: {stock.sector} Segment</span>
            <span className="flex items-center gap-0.5">
              <HelpCircle size={10} /> Discount is generally favorable
            </span>
          </div>
        </GlassCard>

        {/* Analyst Target Range & Margin of Safety */}
        <GlassCard className="!p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Target size={14} className="text-[#4a9eff]" />
              <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
                Wall Street Analyst Targets
              </Pill>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-white/5 border border-white/5 p-2.5">
                <span className="text-[9.5px] uppercase tracking-wider text-white/40 block">
                  Consensus Rating
                </span>
                <span className={cn("text-[15px] font-bold mt-0.5 block", consensusColor)}>
                  {consensus}
                </span>
                <span className="text-[9px] text-white/30 block mt-0.5">
                  Based on {totalA} analysts ({buy} Buy, {hold} Hold, {sell} Sell)
                </span>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/5 p-2.5">
                <span className="text-[9.5px] uppercase tracking-wider text-white/40 block">
                  Average Target Price
                </span>
                <span className="text-[15px] font-black text-white mt-0.5 block">
                  ${formatNum(wallStreetTarget)}
                </span>
                <span className="text-[9px] text-white/30 block mt-0.5">
                  High: ${formatNum(highTarget)} | Low: ${formatNum(lowTarget)}
                </span>
              </div>
            </div>

            {/* Target Price Range Slider/Progress Bar */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[9px] text-white/50 font-semibold uppercase">
                <span>Low (${formatNum(lowTarget)})</span>
                <span>High (${formatNum(highTarget)})</span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-[#FF4D4F] via-[#FFB020] to-[#00D17A] rounded-full"
                  style={{ left: "0%", right: "0%" }}
                />
                {/* Pointer for current price */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white border border-black shadow-[0_0_4px_rgba(255,255,255,0.8)] z-10"
                  style={{ left: `${rangePct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-white/40 mt-1">
                <span>Current Price: ${formatNum(currentPrice)}</span>
                <span className="font-semibold text-white/80">{rangePct.toFixed(0)}% of Range</span>
              </div>
            </div>

            {/* Margin of Safety Callout */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div
                className="rounded-xl p-2.5 border text-center"
                style={{
                  backgroundColor:
                    modelMarginOfSafety >= 0
                      ? "rgba(0, 209, 122, 0.05)"
                      : "rgba(255, 77, 79, 0.05)",
                  borderColor:
                    modelMarginOfSafety >= 0
                      ? "rgba(0, 209, 122, 0.15)"
                      : "rgba(255, 77, 79, 0.15)",
                }}
              >
                <span className="text-[9px] text-white/55 block">Model Margin of Safety</span>
                <span
                  className="text-[15px] font-black tabular-nums mt-0.5 block"
                  style={{ color: modelMarginOfSafety >= 0 ? "#00D17A" : "#FF4D4F" }}
                >
                  {modelMarginOfSafety >= 0 ? "+" : ""}
                  {formatPct(modelMarginOfSafety)}
                </span>
              </div>
              <div
                className="rounded-xl p-2.5 border text-center"
                style={{
                  backgroundColor:
                    streetMarginOfSafety >= 0
                      ? "rgba(0, 209, 122, 0.05)"
                      : "rgba(255, 77, 79, 0.05)",
                  borderColor:
                    streetMarginOfSafety >= 0
                      ? "rgba(0, 209, 122, 0.15)"
                      : "rgba(255, 77, 79, 0.15)",
                }}
              >
                <span className="text-[9px] text-white/55 block">Street Margin of Safety</span>
                <span
                  className="text-[15px] font-black tabular-nums mt-0.5 block"
                  style={{ color: streetMarginOfSafety >= 0 ? "#00D17A" : "#FF4D4F" }}
                >
                  {streetMarginOfSafety >= 0 ? "+" : ""}
                  {formatPct(streetMarginOfSafety)}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
