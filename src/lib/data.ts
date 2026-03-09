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
    calories: (fields[ING_FIELDS.calories] as number) ?? null,
    protein: (fields[ING_FIELDS.protein] as number) ?? null,
    carbs: (fields[ING_FIELDS.carbs] as number) ?? null,
    fat: (fields[ING_FIELDS.fat] as number) ?? null,
  };
}

async function fetchIngredientsByIds(ids: string[]): Promise<Ingredient[]> {
  if (!ids.length) return [];

  const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const records = await base(INGREDIENTS_TABLE)
    .select({
      filterByFormula: formula,
      returnFieldsByFieldId: true,
    })
    .all();

  return records.map((r) => parseIngredient(r.fields, r.id));
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

export async function getAllRecipes(): Promise<Recipe[]> {
  const records = await base(RECIPES_TABLE).select().all();
  return records.map((record) => parseRecipe(record));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const record = await base(RECIPES_TABLE).find(id);
    const ingredientIds = (record.get("Ingredients") as string[]) || [];

    let ingredients: Ingredient[] = [];
    try {
      ingredients = await fetchIngredientsByIds(ingredientIds);
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
  const recipes = await getAllRecipes();
  return recipes
    .map(
      (r) =>
        `- ${r.name}${r.cuisineTag ? ` (${r.cuisineTag})` : ""}${r.caloriesPerServing ? `, ${Math.round(r.caloriesPerServing)} cal/serving` : ""}${r.servings ? `, ${r.servings} servings` : ""}${r.dietaryTags.length ? `, ${r.dietaryTags.join("/")}` : ""}${r.cookTime ? `, ${r.cookTime} min cook` : ""}`
    )
    .join("\n");
}
