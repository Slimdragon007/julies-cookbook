import { supabase } from "./supabase/admin";
import { Recipe, Ingredient } from "./types";

interface SupabaseRecipe {
  id: string;
  slug: string;
  name: string;
  preparation: string | null;
  servings: number | null;
  cook_time_minutes: number | null;
  prep_time_minutes: number | null;
  source_url: string | null;
  cuisine_tag: string | null;
  dietary_tags: string[] | null;
  julie_rating: number | null;
  image_url: string | null;
  manual_calorie_override: number | null;
  total_batch_weight_g: number | null;
}

interface SupabaseIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

function mapIngredient(row: SupabaseIngredient): Ingredient {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
  };
}

function mapRecipe(row: SupabaseRecipe, ingredients: Ingredient[] = []): Recipe {
  const totals = ingredients.reduce(
    (acc, ing) => ({
      cal: acc.cal + (ing.calories ?? 0),
      protein: acc.protein + (ing.protein ?? 0),
      carbs: acc.carbs + (ing.carbs ?? 0),
      fat: acc.fat + (ing.fat ?? 0),
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const servings = row.servings || 1;
  const totalCalories = row.manual_calorie_override ?? totals.cal;
  const caloriesPerServing = Math.round(totalCalories / servings);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.image_url,
    preparation: row.preparation || "",
    servings: row.servings,
    cookTime: row.cook_time_minutes,
    prepTime: row.prep_time_minutes,
    sourceUrl: row.source_url,
    cuisineTag: row.cuisine_tag,
    dietaryTags: row.dietary_tags || [],
    julieRating: row.julie_rating,
    caloriesPerServing,
    totalCalories,
    manualCalorieOverride: row.manual_calorie_override,
    totalBatchWeightG: row.total_batch_weight_g,
    ingredients,
  };
}

export async function getAllRecipes(includeIngredients = false, userId?: string): Promise<Recipe[]> {
  if (!userId) return [];

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) throw new Error(`Failed to fetch recipes: ${error.message}`);
  if (!recipes) return [];

  if (!includeIngredients) {
    return recipes.map((r: SupabaseRecipe) => mapRecipe(r));
  }

  const recipeIds = recipes.map((r: SupabaseRecipe) => r.id);
  const { data: allIngredients, error: ingError } = await supabase
    .from("ingredients")
    .select("*")
    .in("recipe_id", recipeIds);

  if (ingError) throw new Error(`Failed to fetch ingredients: ${ingError.message}`);

  const ingredientsByRecipe = new Map<string, Ingredient[]>();
  for (const row of allIngredients || []) {
    const ing = mapIngredient(row as SupabaseIngredient);
    const list = ingredientsByRecipe.get(row.recipe_id) || [];
    list.push(ing);
    ingredientsByRecipe.set(row.recipe_id, list);
  }

  return recipes.map((r: SupabaseRecipe) => {
    const ingredients = ingredientsByRecipe.get(r.id) || [];
    return mapRecipe(r, ingredients);
  });
}

export async function getRecipeById(idOrSlug: string, userId?: string): Promise<Recipe | null> {
  if (!userId) return null;

  // Try by slug first, then by UUID
  let { data: recipe, error } = await supabase
    .from("recipes").select("*").eq("slug", idOrSlug).eq("user_id", userId).single();

  if (error || !recipe) {
    // Fallback: try by UUID (for backwards compat)
    const result = await supabase
      .from("recipes").select("*").eq("id", idOrSlug).eq("user_id", userId).single();
    recipe = result.data;
    error = result.error;
  }

  if (error || !recipe) return null;

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("recipe_id", recipe.id);

  const mappedIngredients = (ingredients || []).map((row: SupabaseIngredient) =>
    mapIngredient(row)
  );

  return mapRecipe(recipe as SupabaseRecipe, mappedIngredients);
}

export async function getAllRecipeIds(userId?: string): Promise<string[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select("slug")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to fetch recipe slugs: ${error.message}`);
  return (data || []).map((r: { slug: string }) => r.slug);
}

// Cache recipe context per user for 5 minutes
const contextCache = new Map<string, { context: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getRecipeContext(userId: string): Promise<string> {
  const now = Date.now();
  const cached = contextCache.get(userId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.context;
  }

  // Evict stale entries to prevent unbounded growth
  if (contextCache.size > 50) {
    contextCache.forEach((val, key) => {
      if (now - val.timestamp >= CACHE_TTL_MS) contextCache.delete(key);
    });
  }

  const recipes = await getAllRecipes(true, userId);
  const context = recipes
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

  contextCache.set(userId, { context, timestamp: Date.now() });
  return context;
}
