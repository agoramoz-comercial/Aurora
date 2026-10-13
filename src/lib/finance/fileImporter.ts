/**
 * fileImporter.ts
 *
 * Imports financial data from external CSV, JSON, or tabular text files,
 * validates accounting structure integrity, and converts it into system
 * ModelDrivers & Financial Statements.
 */

import { z } from "zod";
import type { ModelDrivers } from "./excelModelEngine";

export const ImportedFinancialItemSchema = z.object({
  metricName: z.string(),
  category: z.enum(["Revenue", "COGS", "OPEX", "Asset", "Liability", "Equity", "Driver"]),
  value: z.number(),
  year: z.number().optional(),
  unit: z.string().optional(),
});

export type ImportedFinancialItem = z.infer<typeof ImportedFinancialItemSchema>;

export interface FileImportResult {
  fileName: string;
  fileType: "csv" | "json" | "txt";
  parsedItems: ImportedFinancialItem[];
  accountingValidation: {
    isValid: boolean;
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
    difference: number;
    warnings: string[];
  };
  generatedDrivers: Partial<ModelDrivers>;
}

export function parseFinancialFile(content: string, fileName: string): FileImportResult {
  const isJson = fileName.endsWith(".json") || content.trim().startsWith("{") || content.trim().startsWith("[");
  const warnings: string[] = [];

  let items: ImportedFinancialItem[] = [];

  if (isJson) {
    try {
      const raw = JSON.parse(content);
      const arr = Array.isArray(raw) ? raw : [raw];
      items = arr.map((obj) => ({
        metricName: String(obj.metricName || obj.name || obj.account || "Custom Metric"),
        category: validateCategory(String(obj.category || obj.type || "Driver")),
        value: Number(obj.value || obj.amount || 0),
        year: obj.year ? Number(obj.year) : 2025,
        unit: obj.unit ? String(obj.unit) : "USD",
      }));
    } catch {
      warnings.push("Failed to parse JSON file structure cleanly. Using fallback parser.");
    }
  } else {
    // Parse CSV or TSV lines
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const headers = lines[0]?.split(/[,;\t]/).map((h) => h.trim().toLowerCase()) ?? [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length < 2) continue;

      const name = parts[0] || `Item ${i}`;
      const valStr = parts[1]?.replace(/[$,]/g, "") ?? "0";
      const val = parseFloat(valStr) || 0;
      const catStr = parts[2] ?? "Driver";

      items.push({
        metricName: name,
        category: validateCategory(catStr),
        value: val,
        year: 2025,
        unit: "USD",
      });
    }
  }

  // Calculate balance sheet checks from imported items
  let totalAssets = 0;
  let totalLiabEquity = 0;

  items.forEach((item) => {
    if (item.category === "Asset") totalAssets += item.value;
    if (item.category === "Liability" || item.category === "Equity") totalLiabEquity += item.value;
  });

  const difference = Math.abs(totalAssets - totalLiabEquity);
  const isValid = totalAssets === 0 && totalLiabEquity === 0 ? true : difference < 100;

  if (!isValid) {
    warnings.push(`Imported Balance Sheet is out of balance by $${difference.toLocaleString()}. Check Assets vs Liabilities & Equity.`);
  }

  // Extract / Map drivers
  const generatedDrivers: Partial<ModelDrivers> = {};

  items.forEach((item) => {
    const key = item.metricName.toLowerCase();
    if (key.includes("volume") || key.includes("units")) generatedDrivers.unitVolumeBase = item.value;
    if (key.includes("price") || key.includes("asp")) generatedDrivers.averageUnitPrice = item.value;
    if (key.includes("gross margin")) generatedDrivers.grossMarginPct = item.value > 1 ? item.value / 100 : item.value;
    if (key.includes("sg&a") || key.includes("sga")) generatedDrivers.sgaPctOfRev = item.value > 1 ? item.value / 100 : item.value;
    if (key.includes("r&d") || key.includes("rd")) generatedDrivers.rdPctOfRev = item.value > 1 ? item.value / 100 : item.value;
    if (key.includes("cash")) generatedDrivers.initialCash = item.value;
    if (key.includes("debt")) generatedDrivers.initialDebt = item.value;
    if (key.includes("equity")) generatedDrivers.initialEquity = item.value;
  });

  return {
    fileName,
    fileType: isJson ? "json" : "csv",
    parsedItems: items,
    accountingValidation: {
      isValid,
      totalAssets,
      totalLiabilitiesAndEquity: totalLiabEquity,
      difference,
      warnings,
    },
    generatedDrivers,
  };
}

function validateCategory(cat: string): ImportedFinancialItem["category"] {
  const c = cat.toLowerCase();
  if (c.includes("rev")) return "Revenue";
  if (c.includes("cogs") || c.includes("cost")) return "COGS";
  if (c.includes("opex") || c.includes("exp")) return "OPEX";
  if (c.includes("asset") || c.includes("cash") || c.includes("ar") || c.includes("ppe")) return "Asset";
  if (c.includes("liab") || c.includes("debt") || c.includes("ap")) return "Liability";
  if (c.includes("equity") || c.includes("stock")) return "Equity";
  return "Driver";
}
