// Estimate-from-fallback-table macro math. Distinct from src/lib/macros.ts
// (which sums and portions stored ingredient macros for the UI).
// This file is the LAST step in the USDA → Claude → fallback chain.

import { FALLBACK_MACROS } from "./fallback-table";

export interface EstimatedMacros {
  cal: number;
  p: number;
  c: number;
  f: number;
}

export function getUnitMultiplier(
  recipeUnit: string | null,
  refUnit: string,
): number {
  const u = recipeUnit?.replace("/", "") || "";
  if (u === refUnit) return 1;
  if (u === "tsp" && refUnit === "tbsp") return 1 / 3;
  if (u === "tbsp" && refUnit === "tsp") return 3;
  if (u === "cup" && refUnit === "tbsp") return 16;
  if (u === "tbsp" && refUnit === "cup") return 1 / 16;
  if (u === "cup" && refUnit === "tsp") return 48;
  if (u === "tsp" && refUnit === "cup") return 1 / 48;
  if (u === "oz" && refUnit === "14oz") return 1 / 14;
  if (u === "oz" && refUnit === "28oz") return 1 / 28;
  if (u === "oz" && refUnit === "8oz") return 1 / 8;
  return 1;
}

export function estimateMacros(
  name: string,
  qty: number | null,
  unit: string,
): EstimatedMacros | null {
  const ref = FALLBACK_MACROS[name];
  if (!ref) return null;
  const q = qty ?? 1;
  const multiplier = getUnitMultiplier(unit, ref.per);
  const scale = q * multiplier;
  return {
    cal: Math.round(ref.cal * scale),
    p: Math.round(ref.p * scale),
    c: Math.round(ref.c * scale),
    f: Math.round(ref.f * scale),
  };
}
