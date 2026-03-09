#!/usr/bin/env node
// One-shot script: Find and delete any "fried rice" recipe, then clean orphans.
// Usage: node --env-file=.env.local scripts/delete-fried-rice.mjs

import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const RECIPES_TABLE = "tblcDuujfu1rokjSU";
const INGREDIENTS_TABLE = "tblbly81hGxUaEgM2";

// Step 1: Find fried rice recipes
console.log("Searching for fried rice recipes...");
const recipes = await base(RECIPES_TABLE)
  .select({
    filterByFormula: 'FIND("fried rice", LOWER({Recipe Name})) > 0',
    fields: ["Recipe Name", "Ingredients"],
  })
  .all();

if (recipes.length === 0) {
  console.log("No fried rice recipes found. Already deleted?");
  process.exit(0);
}

for (const recipe of recipes) {
  const name = recipe.get("Recipe Name");
  const linkedIngredients = recipe.get("Ingredients") || [];
  console.log(`Found: "${name}" (${recipe.id})`);
  console.log(`  Linked ingredients: ${linkedIngredients.length}`);

  // Step 2: Delete linked ingredients first
  if (linkedIngredients.length > 0) {
    console.log("  Deleting linked ingredients...");
    // Airtable batch delete supports up to 10 at a time
    for (let i = 0; i < linkedIngredients.length; i += 10) {
      const batch = linkedIngredients.slice(i, i + 10);
      await base(INGREDIENTS_TABLE).destroy(batch);
      console.log(`  Deleted ingredient batch: ${batch.length} records`);
    }
  }

  // Step 3: Delete the recipe
  await base(RECIPES_TABLE).destroy(recipe.id);
  console.log(`  Deleted recipe: "${name}"`);
}

// Step 4: Run orphan cleanup inline
console.log("\nCleaning orphan ingredients (empty names)...");
const allIngredients = await base(INGREDIENTS_TABLE)
  .select({ fields: ["Name"] })
  .all();

const orphans = allIngredients.filter(
  (r) => !r.get("Name") || r.get("Name").trim() === ""
);

if (orphans.length === 0) {
  console.log("No orphan ingredients found.");
} else {
  console.log(`Found ${orphans.length} orphan ingredients. Deleting...`);
  for (let i = 0; i < orphans.length; i += 10) {
    const batch = orphans.slice(i, i + 10).map((r) => r.id);
    await base(INGREDIENTS_TABLE).destroy(batch);
  }
  console.log(`Deleted ${orphans.length} orphan ingredients.`);
}

console.log("\nDone! Fried rice removed and orphans cleaned.");
