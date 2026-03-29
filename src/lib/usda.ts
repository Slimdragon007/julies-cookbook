/**
 * USDA FoodData Central API integration.
 *
 * Provides exact nutritional data per 100g for any ingredient,
 * replacing the hardcoded MACROS table and Claude AI estimation.
 *
 * API docs: https://fdc.nal.usda.gov/api-guide/requests/
 * Free key: https://fdc.nal.usda.gov/api-key-signup
 */

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

export interface USDANutrient {
  /** Calories per 100g */
  calories: number;
  /** Protein in grams per 100g */
  protein: number;
  /** Carbs in grams per 100g */
  carbs: number;
  /** Fat in grams per 100g */
  fat: number;
}

interface FDCSearchResult {
  foods?: {
    fdcId: number;
    description: string;
    foodNutrients: {
      nutrientId: number;
      nutrientName: string;
      value: number;
    }[];
  }[];
}

// USDA nutrient IDs
const NUTRIENT_IDS = {
  ENERGY: 1008,     // kcal
  PROTEIN: 1003,    // g
  CARBS: 1005,      // g (total carbohydrate)
  FAT: 1004,        // g (total fat)
} as const;

// In-memory cache to avoid redundant API calls during a scrape session
const cache = new Map<string, USDANutrient | null>();

/**
 * Look up exact nutrition per 100g from USDA FoodData Central.
 *
 * Returns null if no match found or API key not set.
 * Prefers "SR Legacy" and "Foundation" data types (most accurate).
 */
export async function lookupNutrition(
  ingredientName: string,
  apiKey?: string
): Promise<USDANutrient | null> {
  const key = apiKey || process.env.USDA_API_KEY;
  if (!key) return null;

  const cacheKey = ingredientName.toLowerCase().trim();
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  try {
    const params = new URLSearchParams({
      api_key: key,
      query: cacheKey,
      dataType: "SR Legacy,Foundation",
      pageSize: "3",
    });

    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[usda] API error ${res.status} for "${ingredientName}"`);
      cache.set(cacheKey, null);
      return null;
    }

    const data: FDCSearchResult = await res.json();
    const food = data.foods?.[0];

    if (!food) {
      cache.set(cacheKey, null);
      return null;
    }

    const getNutrient = (id: number): number => {
      const n = food.foodNutrients.find((fn) => fn.nutrientId === id);
      return n?.value ?? 0;
    };

    const result: USDANutrient = {
      calories: Math.round(getNutrient(NUTRIENT_IDS.ENERGY)),
      protein: Math.round(getNutrient(NUTRIENT_IDS.PROTEIN)),
      carbs: Math.round(getNutrient(NUTRIENT_IDS.CARBS)),
      fat: Math.round(getNutrient(NUTRIENT_IDS.FAT)),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`[usda] Lookup failed for "${ingredientName}":`, err);
    cache.set(cacheKey, null);
    return null;
  }
}

/**
 * Standard gram weights for common cooking units.
 * Used to convert recipe quantities to grams for USDA per-100g math.
 *
 * These are USDA-sourced averages. For precision-critical ingredients
 * (flour, sugar), the USDA API also returns portion-specific weights
 * which we could use in a future enhancement.
 */
const GRAMS_PER_UNIT: Record<string, number> = {
  // Volume
  "/tsp": 4.9,
  "/tbsp": 14.8,
  "/cup": 237,
  // Weight
  "/oz": 28.35,
  "/lb": 453.6,
  // Count (approximate averages)
  "/each": 100,   // overridden per ingredient below
  "/can": 425,    // 15oz can drained
};

// Per-ingredient gram weights for /each unit
const EACH_GRAMS: Record<string, number> = {
  egg: 50,
  onion: 150,
  garlic: 3,       // per clove
  carrot: 61,
  "bell pepper": 120,
  "red bell pepper": 120,
  lemon: 58,
  zucchini: 196,
  "hamburger bun": 43,
  potato: 213,
  tomato: 123,
  banana: 118,
  apple: 182,
  avocado: 150,
  "sweet potato": 130,
};

/**
 * Convert a recipe quantity + unit to grams.
 */
export function ingredientToGrams(
  name: string,
  quantity: number,
  unit: string
): number {
  const u = unit.startsWith("/") ? unit : `/${unit}`;

  if (u === "/each") {
    const perItem = EACH_GRAMS[name.toLowerCase()] ?? GRAMS_PER_UNIT["/each"];
    return quantity * perItem;
  }

  const gramsPerUnit = GRAMS_PER_UNIT[u];
  if (!gramsPerUnit) return quantity * 100; // fallback: assume 100g per unit

  return quantity * gramsPerUnit;
}

/**
 * Calculate exact macros for a recipe ingredient using USDA data.
 *
 * 1. Look up nutrition per 100g from USDA
 * 2. Convert recipe quantity + unit to grams
 * 3. Scale: (grams / 100) * per_100g_value
 */
export async function calculateIngredientMacros(
  name: string,
  quantity: number,
  unit: string,
  apiKey?: string
): Promise<{ calories: number; protein: number; carbs: number; fat: number; source: "usda" | "fallback" } | null> {
  const per100g = await lookupNutrition(name, apiKey);

  if (!per100g) return null;

  const grams = ingredientToGrams(name, quantity, unit);
  const scale = grams / 100;

  return {
    calories: Math.round(per100g.calories * scale),
    protein: Math.round(per100g.protein * scale),
    carbs: Math.round(per100g.carbs * scale),
    fat: Math.round(per100g.fat * scale),
    source: "usda",
  };
}

/**
 * Clear the in-memory cache (useful between scraper runs).
 */
export function clearUSDACache(): void {
  cache.clear();
}
