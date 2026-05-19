/**
 * Unit conversion utilities for the portion calculator and food log.
 *
 * Julie can enter portions in familiar units (servings, cups, oz, tbsp, tsp)
 * and the system converts to grams internally for macro math.
 */

export type PortionUnit = "servings" | "cups" | "oz" | "tbsp" | "tsp" | "g";

export const PORTION_UNITS: { value: PortionUnit; label: string }[] = [
  { value: "servings", label: "servings" },
  { value: "cups", label: "cups" },
  { value: "oz", label: "oz" },
  { value: "tbsp", label: "tbsp" },
  { value: "tsp", label: "tsp" },
  { value: "g", label: "grams" },
];

/**
 * Standard gram equivalents for volume/weight units.
 * These are approximate averages — good enough for portion estimation.
 * (1 cup water = 237g, 1 oz = 28.35g, 1 tbsp = 14.8g, 1 tsp = 4.9g)
 */
const GRAMS_PER_UNIT: Record<Exclude<PortionUnit, "servings" | "g">, number> = {
  cups: 237,
  oz: 28.35,
  tbsp: 14.8,
  tsp: 4.9,
};

/**
 * Convert a portion amount + unit into grams.
 *
 * - "servings" uses batch weight or per-serving fallback (handled by caller)
 * - "g" passes through as-is
 * - volume/weight units multiply by standard gram equivalents
 */
export function toGrams(
  amount: number,
  unit: PortionUnit,
  opts?: {
    /** Total batch weight in grams (for servings calculation) */
    totalBatchWeightG?: number | null;
    /** Number of servings the recipe makes */
    servings?: number | null;
  },
): number | null {
  if (unit === "g") return amount;

  if (unit === "servings") {
    const s = opts?.servings || 1;
    if (opts?.totalBatchWeightG && opts.totalBatchWeightG > 0) {
      // Exact: 1 serving = batch weight / servings
      return Math.round((amount * opts.totalBatchWeightG) / s);
    }
    // No batch weight — return null to signal "use per-serving math instead"
    return null;
  }

  const gramsPerUnit = GRAMS_PER_UNIT[unit];
  return Math.round(amount * gramsPerUnit);
}

/**
 * Format a portion amount for display (e.g., "1.5 cups", "350 g").
 */
export function formatPortion(amount: number, unit: PortionUnit): string {
  const display = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
  const label = PORTION_UNITS.find((u) => u.value === unit)?.label ?? unit;
  return `${display} ${label}`;
}

// ---------------------------------------------------------------------------
// Display-only imperial → metric conversion for the recipe page.
//
// Distinct from toGrams() above. toGrams() is the macro-math pipeline (USDA-
// accurate, single canonical unit). convertForDisplay() is purely a render
// helper for the IngredientsTab toggle — the DB stays imperial, only the
// rendered number/label changes.
// ---------------------------------------------------------------------------

export type MeasurementSystem = "imperial" | "metric";

export interface DisplayQuantity {
  amount: number;
  label: string;
}

// Per spec: 1 cup=240ml, 1 tbsp=15ml, 1 tsp=5ml, 1 oz=28g, 1 lb=454g.
// These are deliberately rounder than the USDA-precise constants in
// GRAMS_PER_UNIT — readability beats accuracy for display.
const METRIC_CONVERSIONS: Record<string, { factor: number; label: string }> = {
  cup: { factor: 240, label: "ml" },
  cups: { factor: 240, label: "ml" },
  tbsp: { factor: 15, label: "ml" },
  tablespoon: { factor: 15, label: "ml" },
  tablespoons: { factor: 15, label: "ml" },
  tsp: { factor: 5, label: "ml" },
  teaspoon: { factor: 5, label: "ml" },
  teaspoons: { factor: 5, label: "ml" },
  oz: { factor: 28, label: "g" },
  ounce: { factor: 28, label: "g" },
  ounces: { factor: 28, label: "g" },
  lb: { factor: 454, label: "g" },
  lbs: { factor: 454, label: "g" },
  pound: { factor: 454, label: "g" },
  pounds: { factor: 454, label: "g" },
};

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\.$/, "");
}

function roundSensibly(value: number): number {
  if (value === 0) return 0;
  // For sub-1 values keep one decimal so 1/4 tsp → 1.3 ml doesn't collapse to 1.
  if (Math.abs(value) < 1) return Math.round(value * 10) / 10;
  return Math.round(value);
}

/**
 * Convert a scaled ingredient amount into the user's preferred display system.
 *
 * Imperial → pass-through (DB units are already imperial).
 * Metric → look up known conversions; unknown units like "each" or "can"
 * pass through unchanged so the user still sees something sensible.
 */
export function convertForDisplay(
  amount: number,
  unit: string | null,
  system: MeasurementSystem,
): DisplayQuantity {
  const safeUnit = unit ?? "";
  if (system === "imperial") {
    return { amount, label: safeUnit };
  }
  const conversion = METRIC_CONVERSIONS[normalizeUnit(safeUnit)];
  if (!conversion) {
    return { amount, label: safeUnit };
  }
  return {
    amount: roundSensibly(amount * conversion.factor),
    label: conversion.label,
  };
}
