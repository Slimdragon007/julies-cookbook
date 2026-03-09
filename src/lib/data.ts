import Airtable from "airtable";
import { Recipe, Ingredient } from "./types";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const RECIPES_TABLE = "tblcDuujfu1rokjSU";
const INGREDIENTS_TABLE = "tblbly81hGxUaEgM2";

function parseIngredient(record: Airtable.Record<Airtable.FieldSet>): Ingredient {
  return {
    id: record.id,
    name: (record.get("Name") as string) || "",
    quantity: (record.get("Recipe QTY") as number) || null,
    unit: (record.get("Unit") as string) || null,
    calories: (record.get("Calories") as number) || null,
    protein: (record.get("Protein_g") as number) || null,
    carbs: (record.get("Carbs_g") as number) || null,
    fat: (record.get("Fat_g") as number) || null,
  };
}

async function fetchIngredientsByIds(ids: string[]): Promise<Ingredient[]> {
  if (!ids.length) return [];

  const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
  const records = await base(INGREDIENTS_TABLE)
    .select({ filterByFormula: formula })
    .all();

  return records.map(parseIngredient);
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
    const ingredients = await fetchIngredientsByIds(ingredientIds);
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
