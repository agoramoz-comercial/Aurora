import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  CandlestickChart,
  Activity,
  DollarSign,
  ShieldAlert,
  Bell,
  Heart,
  Wrench,
} from "lucide-react";
import { Pill } from "../primitives";
import { holdingsData } from "@/data/portfolio";
import { getAlertCounts } from "@/data/alertsEngine";
import { cn } from "@/lib/utils";

// Tabs
import { DashboardTab } from "./tabs/DashboardTab";
import { BasicStockTab } from "./tabs/BasicStockTab";
import { PriceVolumeTab } from "./tabs/PriceVolumeTab";
import { TechnicalTab } from "./tabs/TechnicalTab";
import { ValuationPanel } from "./ValuationPanel";
import { HoldingsTable } from "./HoldingsTable";
import { RiskEngine } from "./RiskEngine";
import { AlertsTab } from "./tabs/AlertsTab";
import { SentimentTab } from "./tabs/SentimentTab";
import { PortfolioBuilderTab } from "./tabs/PortfolioBuilderTab";

const TAB_IDS = [
  "dashboard",
  "basic",
  "priceVolume",
  "technical",
  "valuation",
  "risk",
  "alerts",
  "sentiment",
  "builder",
] as const;

type TabId = (typeof TAB_IDS)[number];

const TAB_CONFIG: {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Dash", icon: LayoutDashboard },
  { id: "basic", label: "Stock Data", shortLabel: "Stock", icon: FileText },
  { id: "priceVolume", label: "Price & Volume", shortLabel: "Price", icon: CandlestickChart },
  { id: "technical", label: "Technical", shortLabel: "Tech", icon: Activity },
  { id: "valuation", label: "Valuation", shortLabel: "Value", icon: DollarSign },
  { id: "risk", label: "Risk & Macro", shortLabel: "Risk", icon: ShieldAlert },
  { id: "alerts", label: "Alerts", shortLabel: "Alerts", icon: Bell },
  { id: "sentiment", label: "Sentiment", shortLabel: "Sent.", icon: Heart },
  { id: "builder", label: "My Portfolio", shortLabel: "Build", icon: Wrench },
];

export function PortfolioWorkspace() {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const stockName = holdingsData.find((h) => h.symbol === selectedTicker)?.name || "Apple Inc.";

  const alertCounts = getAlertCounts();
  const totalAlerts = alertCounts.critical + alertCounts.warning + alertCounts.info;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Pill className="!px-4 !py-1.5 !text-[15px] !font-semibold">Portfolio Management</Pill>
          <span className="glass-pill inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Institutional V2.1
          </span>
        </div>
        <div className="text-[11px] text-white/50 hidden sm:block font-mono">
          Last Snapshot: July 2017
        </div>
      </header>

      {/* Title Detail */}
      <p className="mt-1 truncate text-[12px] text-white/55">
        Fund AUM overview · Active asset:{" "}
        <span className="text-[#00D17A] font-semibold">
          {selectedTicker} ({stockName})
        </span>
      </p>

      {/* Tab Navigation */}
      <div className="mt-3 shrink-0">
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1 pb-1">
          <div
            className="glass-soft flex gap-0.5 p-0.5 w-max min-w-full"
            style={{ borderRadius: 12 }}
          >
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isAlerts = tab.id === "alerts";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-[10px] lg:text-[11px] font-semibold transition-all duration-300 whitespace-nowrap",
                    isActive
                      ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_2px_8px_rgba(0,0,0,0.12)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                  style={{ borderRadius: 8 }}
                >
                  <Icon size={13} className={isActive ? "text-[#4a9eff]" : ""} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>

                  {/* Alert badge */}
                  {isAlerts && totalAlerts > 0 && (
                    <span
                      className={cn(
                        "ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 rounded-full px-1 text-[8px] font-bold",
                        alertCounts.critical > 0
                          ? "bg-[#FF4D4F] text-white"
                          : "bg-[#FFB020] text-black",
                      )}
                    >
                      {totalAlerts}
                    </span>
                  )}

                  {/* Critical pulse dot */}
                  {isAlerts && alertCounts.critical > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D4F] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4D4F]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto mt-4 pr-0.5 min-h-0 scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "basic" && <BasicStockTab />}
            {activeTab === "priceVolume" && <PriceVolumeTab />}
            {activeTab === "technical" && <TechnicalTab />}
            {activeTab === "valuation" && (
              <div className="space-y-4">
                <HoldingsTable activeSymbol={selectedTicker} onSelect={setSelectedTicker} />
                <ValuationPanel symbol={selectedTicker} />
              </div>
            )}
            {activeTab === "risk" && <RiskEngine />}
            {activeTab === "alerts" && <AlertsTab />}
            {activeTab === "sentiment" && <SentimentTab />}
            {activeTab === "builder" && <PortfolioBuilderTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
