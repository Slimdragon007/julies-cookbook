import type Anthropic from "@anthropic-ai/sdk";
import { calculateIngredientMacros } from "@/lib/usda";
import {
  VALID_CATEGORIES,
  VALID_CUISINES,
  VALID_DIETARY,
  type Cuisine,
  type Dietary,
} from "./contracts";
import { estimateMacros } from "./macros";
import {
  assignUnit,
  mapCategory,
  mapCuisine,
  normalizeName,
} from "./normalize";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawIngredient = any;

export interface RawRecipe {
  name: string | null;
  preparation?: string | string[];
  servings?: number | null;
  cookTime?: number | null;
  prepTime?: number | null;
  cuisineTag?: string | null;
  dietaryTags?: string[];
  ingredients?: RawIngredient[];
}

export interface NormalizedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  cal: number;
  pro: number;
  carb: number;
  fat: number;
}

export interface NormalizedRecipe {
  name: string;
  preparation: string;
  servings: number | null;
  cookTime: number | null;
  prepTime: number | null;
  cuisineTag: Cuisine | null;
  dietaryTags: Dietary[];
  ingredients: NormalizedIngredient[];
}

const SYSTEM_PROMPT = `You are a recipe data extraction assistant. You extract structured recipe data from web content.

INGREDIENT DATA CONTRACT - You MUST follow these rules exactly:

NAME RULES:
- All lowercase, always ("olive oil" not "Olive Oil")
- Canonical names, no brand modifiers ("olive oil" not "extra-virgin olive oil")
- Singular form for countable items ("egg" not "eggs", "carrot" not "carrots")
- No size adjectives unless they change the ingredient ("sweet potato" stays, "large egg" becomes "egg")
- Garlic is always measured in cloves: name = "garlic", unit = "each"

UNIT RULES (return one of these exact strings):
- "tsp" - small dry/liquid under 1 tbsp (spices, salt, vanilla extract)
- "tbsp" - medium measures 1-3 tbsp (olive oil small amounts, soy sauce, honey, butter)
- "cup" - volume 0.25 cup and up (flour, broth, milk, shredded cheese)
- "oz" - weight for canned goods (diced tomatoes 14oz, tomato sauce 8oz)
- "lb" - weight for meat, large produce (ground beef, chicken breast)
- "each" - countable whole items (egg, onion, bell pepper, garlic clove)
- "can" - canned goods when "1 can" is clearer (chickpeas, coconut milk)

CONVERSION RULES:
- "3 tablespoons" -> qty: 3, unit: "tbsp"
- "1 teaspoon" -> qty: 1, unit: "tsp"
- "1/2 cup" -> qty: 0.5, unit: "cup"
- "1 (14 oz) can diced tomatoes" -> qty: 14, unit: "oz", name: "diced tomatoes"
- "1 can chickpeas" -> qty: 1, unit: "can"
- "2 pounds ground beef" -> qty: 2, unit: "lb"
- "3 cloves garlic" -> qty: 3, unit: "each", name: "garlic"
- "1 medium onion" -> qty: 1, unit: "each", name: "onion" (drop "medium")
- "salt and pepper to taste" -> two ingredients: salt qty:1 unit:"tsp" AND black pepper qty:0.5 unit:"tsp"
- "pinch of" -> qty: 0.125, unit: "tsp"

CATEGORY RULES (return one of these exact strings):
- "Produce" - fresh fruits, vegetables, herbs (onion, garlic, carrot, bell pepper, lemon, parsley, blueberry)
- "Meat" - all meat and poultry (ground beef, chicken breast, chicken thigh)
- "Fish" - all seafood (salmon, shrimp, tuna)
- "Dairy" - milk, cream, cheese, butter, eggs, yogurt
- "Spice" - dried spices and seasonings (cumin, paprika, Italian seasoning, salt, black pepper, red pepper flakes, baking powder)
- "Pantry" - oils, vinegars, sauces, sweeteners, extracts (olive oil, soy sauce, honey, vanilla, Dijon mustard, tomato paste, sugar, cornstarch)
- "Grocery" - dry goods, grains, pasta, canned goods, nuts, broths (flour, rice, lentils, couscous, chickpeas, diced tomatoes, chicken broth)
- "Bakery" - bread, buns, tortillas
- "Other" - anything that doesn't fit above
- NEVER use "Misc."

MACRO RULES:
- Every ingredient MUST have calories, protein_g, carbs_g, fat_g
- Values are for the RECIPE QUANTITY (not per 100g). Example: "2 tbsp olive oil" = 238 cal, 0P, 0C, 28F
- Round to whole numbers
- Use USDA reference values:
  * olive oil (per tbsp): 119 cal, 0P, 0C, 14F
  * butter (per tbsp): 102 cal, 0P, 0C, 12F
  * egg (each): 72 cal, 6P, 0C, 5F
  * ground beef 80/20 (per lb): 1152 cal, 77P, 0C, 92F
  * chicken breast (per lb): 748 cal, 139P, 0C, 16F
  * chicken thigh (per lb): 1085 cal, 109P, 0C, 69F
  * all-purpose flour (per cup): 455 cal, 13P, 95C, 1F
  * white rice (per cup dry): 675 cal, 13P, 148C, 1F
  * lentils (per cup dry): 678 cal, 50P, 115C, 2F
  * cheddar cheese (per cup): 455 cal, 28P, 1C, 37F
  * diced tomatoes (14 oz can): 70 cal, 4P, 14C, 0F
  * most dried spices (per tsp): 5-8 cal, negligible macros
  * salt: 0 cal across the board
  * sugar (per tbsp): 48 cal, 0P, 12C, 0F
  * honey (per tbsp): 64 cal, 0P, 17C, 0F`;

function buildUserPrompt(content: string, sourceUrl: string): string {
  return `Extract recipe data from this content. Return ONLY valid JSON (no markdown, no code blocks, no explanation).

REQUIRED JSON SCHEMA:
{
  "name": "string (recipe name)",
  "preparation": "string (numbered step-by-step instructions)",
  "servings": number or null,
  "cookTime": number (minutes) or null,
  "prepTime": number (minutes) or null,
  "cuisineTag": one of ${JSON.stringify(VALID_CUISINES)} or null,
  "dietaryTags": array from ${JSON.stringify(VALID_DIETARY)} or [],
  "ingredients": [
    {
      "name": "string (lowercase, singular, canonical per the data contract)",
      "quantity": number,
      "unit": one of ["tsp","tbsp","cup","oz","lb","each","can"],
      "category": one of ${JSON.stringify(VALID_CATEGORIES)},
      "calories": number (whole, USDA estimate for recipe qty),
      "protein_g": number (whole),
      "carbs_g": number (whole),
      "fat_g": number (whole)
    }
  ]
}

CRITICAL:
- Every ingredient MUST have name, quantity, unit, category, calories, protein_g, carbs_g, fat_g
- No nulls allowed in ingredient fields
- Names must be lowercase and singular
- If you cannot extract a recipe, return {"name": null}

Source URL: ${sourceUrl}

Content:
${content}`;
}

export async function extractRawRecipe(
  content: string,
  sourceUrl: string,
  anthropic: Anthropic,
  opts: { contextBrief?: string; timeoutMs?: number } = {},
): Promise<RawRecipe> {
  const timeoutMs = opts.timeoutMs ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const system = opts.contextBrief
    ? `${SYSTEM_PROMPT}\n\nACQUISITION CONTEXT (how this content was obtained):\n${opts.contextBrief}`
    : SYSTEM_PROMPT;

  try {
    const response = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(content, sourceUrl),
          },
        ],
      },
      { signal: controller.signal },
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(jsonStr) as RawRecipe;
  } finally {
    clearTimeout(timer);
  }
}

export async function normalizeIngredients(
  raw: RawIngredient[] | undefined | null,
  opts: { usdaApiKey?: string } = {},
): Promise<NormalizedIngredient[]> {
  if (!raw?.length) return [];

  const prepared = raw
    .map((ing) => {
      const name = normalizeName(
        (ing.name || "").replace(/[""'']/g, "").trim(),
      );
      const unit = assignUnit(name, ing.quantity ?? null, ing.unit ?? null);
      const category = mapCategory(name, ing.category);
      return { name, quantity: ing.quantity ?? 1, unit, category, ing };
    })
    .filter((r) => r.name);

  return Promise.all(
    prepared.map(async ({ name, quantity, unit, category, ing }) => {
      const usda = await calculateIngredientMacros(
        name,
        quantity,
        unit,
        opts.usdaApiKey,
      );
      if (usda) {
        return {
          name,
          quantity,
          unit,
          category,
          cal: usda.calories,
          pro: usda.protein,
          carb: usda.carbs,
          fat: usda.fat,
        };
      }

      let cal = ing.calories ?? null;
      let pro = ing.protein_g ?? null;
      let carb = ing.carbs_g ?? null;
      let fat = ing.fat_g ?? null;

      if (cal === null || pro === null || carb === null || fat === null) {
        const est = estimateMacros(name, quantity, unit);
        if (est) {
          if (cal === null) cal = est.cal;
          if (pro === null) pro = est.p;
          if (carb === null) carb = est.c;
          if (fat === null) fat = est.f;
        }
      }

      return {
        name,
        quantity,
        unit,
        category,
        cal: Math.round(cal ?? 0),
        pro: Math.round(pro ?? 0),
        carb: Math.round(carb ?? 0),
        fat: Math.round(fat ?? 0),
      };
    }),
  );
}

export function normalizeRecipeShape(
  raw: RawRecipe,
  ingredients: NormalizedIngredient[],
): NormalizedRecipe {
  if (!raw.name) {
    throw new Error("Could not identify a recipe from the source content");
  }

  const dietaryTags = (raw.dietaryTags ?? []).filter((t): t is Dietary =>
    (VALID_DIETARY as readonly string[]).includes(t),
  );

  const preparation = Array.isArray(raw.preparation)
    ? raw.preparation.join("\n")
    : (raw.preparation ?? "");

  return {
    name: raw.name,
    preparation,
    servings: typeof raw.servings === "number" ? raw.servings : null,
    cookTime: typeof raw.cookTime === "number" ? raw.cookTime : null,
    prepTime: typeof raw.prepTime === "number" ? raw.prepTime : null,
    cuisineTag: mapCuisine(raw.cuisineTag),
    dietaryTags,
    ingredients,
  };
}
