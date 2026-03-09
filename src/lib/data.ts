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

export async function getAllRecipes(includeIngredients = false): Promise<Recipe[]> {
  const records = await base(RECIPES_TABLE).select().all();

  if (!includeIngredients) {
    return records.map((record) => parseRecipe(record));
  }

  // Collect all ingredient IDs across all recipes, fetch in one batch
  const idsByRecipe = new Map<string, string[]>();
  const allIngIds = new Set<string>();

  for (const record of records) {
    const ids = (record.get("Ingredients") as string[]) || [];
    idsByRecipe.set(record.id, ids);
    ids.forEach((id) => allIngIds.add(id));
  }

  const allIngredients = await fetchIngredientsByIds(Array.from(allIngIds));
  const ingMap = new Map(allIngredients.map((ing) => [ing.id, ing]));

  return records.map((record) => {
    const ids = idsByRecipe.get(record.id) || [];
    const ingredients = ids
      .map((id) => ingMap.get(id))
      .filter((ing): ing is Ingredient => ing !== undefined);
    return parseRecipe(record, ingredients);
  });
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
  const recipes = await getAllRecipes(true);
  return recipes
    .map((r) => {
      let line = `- ${r.name}`;
      if (r.cuisineTag) line += ` (${r.cuisineTag})`;
      if (r.servings) line += `, ${r.servings} servings`;
      if (r.caloriesPerServing) line += `, ${Math.round(r.caloriesPerServing)} cal/serving`;
      if (r.totalCalories) line += `, ${Math.round(r.totalCalories)} cal total`;
      if (r.dietaryTags.length) line += `, ${r.dietaryTags.join("/")}`;
      if (r.cookTime) line += `, ${r.cookTime} min cook`;

      if (r.ingredients.length > 0) {
        const totals = r.ingredients.reduce(
          (acc, ing) => ({
            cal: acc.cal + (ing.calories || 0),
            protein: acc.protein + (ing.protein || 0),
            carbs: acc.carbs + (ing.carbs || 0),
            fat: acc.fat + (ing.fat || 0),
          }),
          { cal: 0, protein: 0, carbs: 0, fat: 0 }
        );
        line += `\n  Macros: ${Math.round(totals.cal)} cal, ${totals.protein.toFixed(1)}g protein, ${totals.carbs.toFixed(1)}g carbs, ${totals.fat.toFixed(1)}g fat`;
        line += `\n  Ingredients: ${r.ingredients.map((i) => `${i.quantity ?? ""} ${i.unit ?? ""} ${i.name} (${i.calories ?? "?"} cal)`.trim()).join(", ")}`;
      }

      return line;
    })
    .join("\n");
}
