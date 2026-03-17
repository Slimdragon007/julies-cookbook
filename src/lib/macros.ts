import { Ingredient } from "./types";

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Sum macros across all ingredients */
export function sumIngredientMacros(ingredients: Ingredient[]): MacroTotals {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories ?? 0),
      protein: acc.protein + (ing.protein ?? 0),
      carbs: acc.carbs + (ing.carbs ?? 0),
      fat: acc.fat + (ing.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Calculate macros for a weighed portion (tare scale) */
export function portionMacros(
  totals: MacroTotals,
  portionG: number,
  batchWeightG: number
): MacroTotals {
  const fraction = portionG / batchWeightG;
  return {
    calories: Math.round(totals.calories * fraction),
    protein: Math.round(totals.protein * fraction),
    carbs: Math.round(totals.carbs * fraction),
    fat: Math.round(totals.fat * fraction),
  };
}

/** Calculate macros per serving (fallback when no batch weight) */
export function perServingMacros(totals: MacroTotals, servings: number): MacroTotals {
  const s = servings || 1;
  return {
    calories: Math.round(totals.calories / s),
    protein: Math.round(totals.protein / s),
    carbs: Math.round(totals.carbs / s),
    fat: Math.round(totals.fat / s),
  };
}

/** Calculate macros for a portion — uses batch weight if available, falls back to per-serving */
export function calculatePortionMacros(
  ingredients: Ingredient[],
  portionG: number,
  batchWeightG: number | null,
  servings: number
): { macros: MacroTotals; method: "batch_weight" | "per_serving" } {
  const totals = sumIngredientMacros(ingredients);

  if (batchWeightG && batchWeightG > 0) {
    return {
      macros: portionMacros(totals, portionG, batchWeightG),
      method: "batch_weight",
    };
  }

  return {
    macros: perServingMacros(totals, servings),
    method: "per_serving",
  };
}
