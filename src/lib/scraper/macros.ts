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

// Returns null when no conversion rule is registered. Callers must treat null
// as "macros unknown" rather than silently scaling by 1, which previously
// produced wildly wrong totals (e.g. 8 oz milk against a per-cup ref).
export function getUnitMultiplier(
  recipeUnit: string | null,
  refUnit: string,
): number | null {
  const u = recipeUnit?.replace("/", "") || "";
  if (u === refUnit) return 1;
  if (u === "tsp" && refUnit === "tbsp") return 1 / 3;
  if (u === "tbsp" && refUnit === "tsp") return 3;
  if (u === "cup" && refUnit === "tbsp") return 16;
  if (u === "tbsp" && refUnit === "cup") return 1 / 16;
  if (u === "cup" && refUnit === "tsp") return 48;
  if (u === "tsp" && refUnit === "cup") return 1 / 48;
  const cannedMatch = u === "oz" ? refUnit.match(/^(\d+)oz$/) : null;
  if (cannedMatch) return 1 / Number(cannedMatch[1]);
  return null;
}

export function estimateMacros(
  name: string,
  qty: number | null,
  unit: string,
): EstimatedMacros | null {
  const ref = FALLBACK_MACROS[name];
  if (!ref) return null;
  const multiplier = getUnitMultiplier(unit, ref.per);
  if (multiplier === null) return null;
  const q = qty ?? 1;
  const scale = q * multiplier;
  return {
    cal: Math.round(ref.cal * scale),
    p: Math.round(ref.p * scale),
    c: Math.round(ref.c * scale),
    f: Math.round(ref.f * scale),
  };
}
