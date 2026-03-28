/**
 * One-time import: Airtable → Supabase (with user_id)
 *
 * Usage: node scripts/import-from-airtable.mjs <user_id>
 * Example: node scripts/import-from-airtable.mjs 5cd8b249-b4b2-4013-8f60-1e92d011816c
 *
 * Reads from .env.local for credentials.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: node scripts/import-from-airtable.mjs <user_id>");
  process.exit(1);
}

const AIRTABLE_API_KEY = env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = env.AIRTABLE_BASE_ID;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchAirtable(table, offset) {
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`);
  if (offset) url.searchParams.set("offset", offset);
  url.searchParams.set("pageSize", "100");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${table} error ${res.status}: ${text}`);
  }

  return res.json();
}

async function fetchAllRecords(table) {
  const records = [];
  let offset;

  do {
    const data = await fetchAirtable(table, offset);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

async function main() {
  console.log(`Importing recipes for user ${userId}...`);
  console.log(`Airtable base: ${AIRTABLE_BASE_ID}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // Fetch recipes from Airtable
  console.log("Fetching recipes from Airtable...");
  const recipeRecords = await fetchAllRecords("Recipes");
  console.log(`Found ${recipeRecords.length} recipes\n`);

  // Fetch ingredients from Airtable
  console.log("Fetching ingredients from Airtable...");
  const ingredientRecords = await fetchAllRecords("Ingredients");
  console.log(`Found ${ingredientRecords.length} ingredients\n`);

  // Build ingredient map by Airtable recipe ID
  const ingredientsByAirtableRecipeId = new Map();
  for (const rec of ingredientRecords) {
    const f = rec.fields;
    const recipeIds = f["Recipes"] || f["Recipe"] || [];
    for (const recipeId of recipeIds) {
      if (!ingredientsByAirtableRecipeId.has(recipeId)) {
        ingredientsByAirtableRecipeId.set(recipeId, []);
      }
      ingredientsByAirtableRecipeId.get(recipeId).push({
        name: f["Name"] || "",
        quantity: f["Recipe QTY"] ?? f["Quantity"] ?? null,
        unit: f["Unit"] || null,
        category: f["Category"] || "Other",
        calories: f["Calories"] ?? null,
        protein_g: f["Protein_g"] ?? f["Protein (g)"] ?? null,
        carbs_g: f["Carbs_g"] ?? f["Carbs (g)"] ?? null,
        fat_g: f["Fat_g"] ?? f["Fat (g)"] ?? null,
      });
    }
  }

  let imported = 0;
  let skipped = 0;
  let ingredientCount = 0;

  for (const rec of recipeRecords) {
    const f = rec.fields;
    const name = f["Recipe Name"] || f["Name"];
    if (!name) {
      console.log(`  Skipping record with no name: ${rec.id}`);
      skipped++;
      continue;
    }

    const slug = slugify(name);

    // Check for existing
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  Skipping "${name}" (already exists)`);
      skipped++;
      continue;
    }

    // Insert recipe
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        slug,
        name,
        preparation: f["Preparation"] || f["Instructions"] || null,
        source_url: f["Source URL"] || f["URL"] || null,
        servings: f["Servings"] ?? null,
        cook_time_minutes: f["Cook Time (Minutes)"] ?? f["Cook Time"] ?? null,
        prep_time_minutes: f["Prep Time (Minutes)"] ?? f["Prep Time"] ?? null,
        cuisine_tag: f["Cuisine"] || f["Cuisine Tag"] || null,
        dietary_tags: f["Dietary Tags"] || f["Tags"] || [],
        image_url: f["Image URL"] || (f["Image"] && f["Image"][0]?.url) || null,
        julie_rating: f["Julie Rating"] ?? f["Rating"] ?? null,
        manual_calorie_override: f["Manual Calorie Override"] ?? null,
        total_batch_weight_g: f["Total Batch Weight (g)"] ?? null,
      })
      .select("id")
      .single();

    if (recipeError) {
      console.error(`  ERROR importing "${name}": ${recipeError.message}`);
      continue;
    }

    // Insert ingredients
    const ingredients = ingredientsByAirtableRecipeId.get(rec.id) || [];
    if (ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from("ingredients")
        .insert(
          ingredients.map((ing) => ({
            recipe_id: recipeData.id,
            name: ing.name.toLowerCase().trim(),
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
            calories: ing.calories ? Math.round(ing.calories) : null,
            protein_g: ing.protein_g ? Math.round(ing.protein_g) : null,
            carbs_g: ing.carbs_g ? Math.round(ing.carbs_g) : null,
            fat_g: ing.fat_g ? Math.round(ing.fat_g) : null,
          }))
        );

      if (ingError) {
        console.error(`  WARNING: ingredients for "${name}" failed: ${ingError.message}`);
      } else {
        ingredientCount += ingredients.length;
      }
    }

    imported++;
    console.log(`  ✓ ${name} (${ingredients.length} ingredients)`);
  }

  console.log(`\nDone! Imported ${imported} recipes, ${ingredientCount} ingredients. Skipped ${skipped}.`);

  // Verify
  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  console.log(`Supabase now has ${count} recipes for user ${userId}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
