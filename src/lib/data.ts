import Airtable from "airtable";
import { Recipe, Ingredient } from "./types";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const RECIPES_TABLE = "tblcDuujfu1rokjSU";
const INGREDIENTS_TABLE = "tblbly81hGxUaEgM2";

// Ingredient field IDs (stable even if field names change in Airtable)
const ING_FIELDS = {
  name: "fld39u3mmhVCvMG1O",
  quantity: "fldQBvNRyFEKNB9eV",
  unit: "fldhovLVfCHfba1nM",
  category: "fldg5uYGPex1K3uJ9",
  calories: "fldoXpPm8rZwPWxQY",
  protein: "fldSWy4Feb88MMqxy",
  carbs: "fldp7QNxNMpXzkBIU",
  fat: "fldx8AY3eOHavt5r6",
} as const;

function parseIngredient(fields: Record<string, unknown>, id: string): Ingredient {
  return {
    id,
    name: (fields[ING_FIELDS.name] as string) || "",
    quantity: (fields[ING_FIELDS.quantity] as number) ?? null,
    unit: (fields[ING_FIELDS.unit] as string) ?? null,
    category: (fields[ING_FIELDS.category] as string) ?? null,
    calories: (fields[ING_FIELDS.calories] as number) ?? null,
    protein: (fields[ING_FIELDS.protein] as number) ?? null,
    carbs: (fields[ING_FIELDS.carbs] as number) ?? null,
    fat: (fields[ING_FIELDS.fat] as number) ?? null,
  };
}

/**
 * Extract the recipe record IDs that an ingredient is linked to.
 * The Ingredients table has a linked record field pointing to Recipes
 * (shown as "Recipe Names..." in Airtable). We auto-detect this field
 * by scanning for arrays of record IDs.
 */
function extractRecipeIds(fields: Record<string, unknown>): string[] {
  for (const [key, value] of Object.entries(fields)) {
    // Skip known ingredient fields
    if ((Object.values(ING_FIELDS) as string[]).includes(key)) continue;

    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string" &&
      (value[0] as string).startsWith("rec")
    ) {
      return value as string[];
    }
  }
  return [];
}

/**
 * Fetch all ingredients and group them by recipe record ID.
 * The link goes Ingredients → Recipes (not Recipes → Ingredients).
 */
async function fetchAllIngredientsByRecipe(): Promise<Map<string, Ingredient[]>> {
  const records = await base(INGREDIENTS_TABLE)
    .select({ returnFieldsByFieldId: true })
    .all();

  const byRecipe = new Map<string, Ingredient[]>();

  for (const record of records) {
    const ingredient = parseIngredient(record.fields, record.id);
    const recipeIds = extractRecipeIds(record.fields);

    for (const recipeId of recipeIds) {
      const list = byRecipe.get(recipeId) || [];
      list.push(ingredient);
      byRecipe.set(recipeId, list);
    }
  }

  return byRecipe;
}

/**
 * Fetch ingredients for a single recipe by querying the Ingredients table.
 */
async function fetchIngredientsForRecipe(recipeId: string): Promise<Ingredient[]> {
  // Fetch all ingredients that link to this recipe
  // We use returnFieldsByFieldId and then filter client-side
  const records = await base(INGREDIENTS_TABLE)
    .select({ returnFieldsByFieldId: true })
    .all();

  const ingredients: Ingredient[] = [];
  for (const record of records) {
    const recipeIds = extractRecipeIds(record.fields);
    if (recipeIds.includes(recipeId)) {
      ingredients.push(parseIngredient(record.fields, record.id));
    }
  }

  return ingredients;
}

function parseRecipe(
  record: Airtable.Record<Airtable.FieldSet>,
  ingredients: Ingredient[] = []
): Recipe {
  return {
    id: record.id,
    name: (record.get("Recipe Name") as string) || "",
    imageUrl: (record.get("Image URL") as string) || null,
    preparation: (record.get("Preparation") as string) || "",
    servings: (record.get("Servings") as number) || null,
    cookTime: (record.get("Cook Time (Minutes)") as number) || null,
    prepTime: (record.get("Prep Time (Minutes)") as number) || null,
    sourceUrl: (record.get("Source URL") as string) || null,
    cuisineTag: (record.get("Cuisine Tag") as string) || null,
    dietaryTags: (record.get("Dietary Tags") as string[]) || [],
    julieRating: (record.get("Julie Rating") as number) || null,
    caloriesPerServing: (record.get("Calories Per Serving") as number) || null,
    totalCalories: (record.get("Total Calories") as number) || null,
    ingredients,
  };
}

export async function getAllRecipes(includeIngredients = false): Promise<Recipe[]> {
  const records = await base(RECIPES_TABLE).select().all();

  if (!includeIngredients) {
    return records.map((record) => parseRecipe(record));
  }

  // Fetch all ingredients in one batch and group by recipe
  const ingredientsByRecipe = await fetchAllIngredientsByRecipe();

  return records.map((record) => {
    const ingredients = ingredientsByRecipe.get(record.id) || [];
    return parseRecipe(record, ingredients);
  });
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const record = await base(RECIPES_TABLE).find(id);

    let ingredients: Ingredient[] = [];
    try {
      ingredients = await fetchIngredientsForRecipe(id);
    } catch (err) {
      console.error(`[data] Failed to fetch ingredients for recipe ${id}:`, err);
    }

    return parseRecipe(record, ingredients);
  } catch {
    return null;
  }
}

export async function getAllRecipeIds(): Promise<string[]> {
  const records = await base(RECIPES_TABLE)
    .select({ fields: ["Recipe Name"] })
    .all();
  return records.map((r) => r.id);
}

export async function getRecipeContext(): Promise<string> {
  const recipes = await getAllRecipes(true);
  return recipes
    .map((r) => {
      const totals = r.ingredients.reduce(
        (acc, ing) => ({
          cal: acc.cal + (ing.calories || 0),
          protein: acc.protein + (ing.protein || 0),
          carbs: acc.carbs + (ing.carbs || 0),
          fat: acc.fat + (ing.fat || 0),
        }),
        { cal: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const servings = r.servings || 1;
      const perServing = {
        cal: Math.round(r.caloriesPerServing ?? totals.cal / servings),
        protein: Math.round(totals.protein / servings),
        carbs: Math.round(totals.carbs / servings),
        fat: Math.round(totals.fat / servings),
      };

      const totalTime = (r.prepTime || 0) + (r.cookTime || 0);

      let line = `## ${r.name}`;
      if (r.cuisineTag) line += `\nCuisine: ${r.cuisineTag}`;
      if (r.dietaryTags.length) line += `\nDietary: ${r.dietaryTags.join(", ")}`;
      line += `\nServings: ${servings}`;
      if (r.prepTime) line += `\nPrep: ${r.prepTime} min`;
      if (r.cookTime) line += `\nCook: ${r.cookTime} min`;
      if (totalTime) line += `\nTotal time: ${totalTime} min`;
      line += `\nPer serving: ${perServing.cal} cal, ${perServing.protein}g protein, ${perServing.carbs}g carbs, ${perServing.fat}g fat`;
      line += `\nTotal recipe: ${Math.round(totals.cal)} cal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat`;

      if (r.ingredients.length > 0) {
        line += `\nIngredients: ${r.ingredients.map((i) => {
          return `${i.quantity ?? ""} ${i.unit ?? ""} ${i.name}`.trim();
        }).join(", ")}`;
      }

      return line;
    })
    .join("\n\n");
}
