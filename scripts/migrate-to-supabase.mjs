import Airtable from "airtable";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIG
// ============================================================
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RECIPES_TABLE = "tblcDuujfu1rokjSU";
const INGREDIENTS_TABLE = "tblbly81hGxUaEgM2";

// Airtable field IDs for recipes
const RECIPE_FIELDS = {
  name: "fldyhNhL35q11QyoK",
  preparation: "fldfDoXIFLsVkF0Qa",
  servings: "fldTs1iWVVqc0yLjJ",
  cook_time_minutes: "fldV1QTojQ3vv1e0i",
  prep_time_minutes: "fldP8mhxPeO7bV6ye",
  source_url: "fldiVZzjhDJ9eZm2V",
  cuisine_tag: "fldFHhOKxKsJeo2J4",
  dietary_tags: "fldfdtTCGYcucB3wC",
  julie_rating: "fldjR0fpkAbIPO6Pc",
  image_url: "fldkRg1EKcLPMNOhe",
  manual_calorie_override: "fldP1NHx2BHHPZ6BL",
  total_batch_weight_g: "fldegSfH4a2RALGn5",
};

// Airtable field IDs for ingredients
const ING_FIELDS = {
  name: "fld39u3mmhVCvMG1O",
  quantity: "fldQBvNRyFEKNB9eV",
  unit: "fldhovLVfCHfba1nM",
  category: "fldg5uYGPex1K3uJ9",
  calories: "fldoXpPm8rZwPWxQY",
  protein_g: "fldSWy4Feb88MMqxy",
  carbs_g: "fldp7QNxNMpXzkBIU",
  fat_g: "fldx8AY3eOHavt5r6",
};

// ============================================================
// HELPERS
// ============================================================
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractRecipeIds(fields) {
  const knownFieldIds = new Set(Object.values(ING_FIELDS));
  for (const [key, value] of Object.entries(fields)) {
    if (knownFieldIds.has(key)) continue;
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string" &&
      value[0].startsWith("rec")
    ) {
      return value;
    }
  }
  return [];
}

// ============================================================
// MAIN MIGRATION
// ============================================================
async function main() {
  console.log("Julie's Cookbook -- Airtable → Supabase Migration");
  console.log("==================================================\n");

  // 1. Fetch all recipes from Airtable
  console.log("Fetching recipes from Airtable...");
  const recipeRecords = await base(RECIPES_TABLE)
    .select({ returnFieldsByFieldId: true })
    .all();
  console.log(`  Found ${recipeRecords.length} recipes in Airtable\n`);

  // 2. Fetch all ingredients from Airtable
  console.log("Fetching ingredients from Airtable...");
  const ingredientRecords = await base(INGREDIENTS_TABLE)
    .select({ returnFieldsByFieldId: true })
    .all();
  console.log(`  Found ${ingredientRecords.length} ingredients in Airtable\n`);

  // 3. Group ingredients by Airtable recipe ID
  const ingredientsByRecipe = new Map();
  for (const record of ingredientRecords) {
    const recipeIds = extractRecipeIds(record.fields);
    for (const recipeId of recipeIds) {
      const list = ingredientsByRecipe.get(recipeId) || [];
      list.push(record);
      ingredientsByRecipe.set(recipeId, list);
    }
  }

  // 4. Migrate recipes
  let recipesOk = 0;
  let recipesFailed = 0;
  let ingredientsOk = 0;
  let ingredientsFailed = 0;

  // Map Airtable recipe ID -> Supabase recipe UUID
  const recipeIdMap = new Map();

  for (const record of recipeRecords) {
    const f = record.fields;
    const name = f[RECIPE_FIELDS.name];
    if (!name) {
      console.log(`  SKIP: Recipe ${record.id} has no name`);
      recipesFailed++;
      continue;
    }

    const slug = slugify(name);
    const recipeData = {
      slug,
      name,
      preparation: f[RECIPE_FIELDS.preparation] || null,
      servings: f[RECIPE_FIELDS.servings] ?? null,
      cook_time_minutes: f[RECIPE_FIELDS.cook_time_minutes] ?? null,
      prep_time_minutes: f[RECIPE_FIELDS.prep_time_minutes] ?? null,
      source_url: f[RECIPE_FIELDS.source_url] || null,
      cuisine_tag: f[RECIPE_FIELDS.cuisine_tag] || null,
      dietary_tags: f[RECIPE_FIELDS.dietary_tags] || [],
      julie_rating: f[RECIPE_FIELDS.julie_rating] ?? null,
      image_url: f[RECIPE_FIELDS.image_url] || null,
      manual_calorie_override: f[RECIPE_FIELDS.manual_calorie_override] ?? null,
      total_batch_weight_g: f[RECIPE_FIELDS.total_batch_weight_g] ?? null,
    };

    const { data, error } = await supabase
      .from("recipes")
      .insert(recipeData)
      .select("id")
      .single();

    if (error) {
      console.log(`  FAIL: "${name}" - ${error.message}`);
      recipesFailed++;
      continue;
    }

    recipeIdMap.set(record.id, data.id);
    console.log(`  OK: "${name}" -> ${slug} (${data.id})`);
    recipesOk++;
  }

  console.log(`\nRecipes: ${recipesOk} migrated, ${recipesFailed} failed\n`);

  // 5. Migrate ingredients
  console.log("Migrating ingredients...");
  for (const record of ingredientRecords) {
    const f = record.fields;
    const recipeIds = extractRecipeIds(f);

    if (recipeIds.length === 0) {
      console.log(`  SKIP: Ingredient "${f[ING_FIELDS.name]}" - no recipe link (orphan)`);
      ingredientsFailed++;
      continue;
    }

    const supabaseRecipeId = recipeIdMap.get(recipeIds[0]);
    if (!supabaseRecipeId) {
      console.log(`  SKIP: Ingredient "${f[ING_FIELDS.name]}" - recipe not migrated`);
      ingredientsFailed++;
      continue;
    }

    const ingData = {
      recipe_id: supabaseRecipeId,
      name: f[ING_FIELDS.name] || "",
      quantity: f[ING_FIELDS.quantity] ?? null,
      unit: f[ING_FIELDS.unit] || null,
      category: f[ING_FIELDS.category] || null,
      calories: f[ING_FIELDS.calories] ?? 0,
      protein_g: f[ING_FIELDS.protein_g] ?? 0,
      carbs_g: f[ING_FIELDS.carbs_g] ?? 0,
      fat_g: f[ING_FIELDS.fat_g] ?? 0,
    };

    const { error } = await supabase.from("ingredients").insert(ingData);

    if (error) {
      console.log(`  FAIL: "${f[ING_FIELDS.name]}" - ${error.message}`);
      ingredientsFailed++;
      continue;
    }

    ingredientsOk++;
  }

  // 6. Summary
  console.log("\n==================================================");
  console.log("MIGRATION COMPLETE");
  console.log("==================================================");
  console.log(`Recipes:     ${recipesOk} migrated, ${recipesFailed} failed`);
  console.log(`Ingredients: ${ingredientsOk} migrated, ${ingredientsFailed} skipped/failed`);
}

main().catch((err) => {
  console.error(`\nFATAL: ${err.message}`);
  process.exit(1);
});
