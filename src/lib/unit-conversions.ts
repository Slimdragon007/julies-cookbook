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
  }
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
