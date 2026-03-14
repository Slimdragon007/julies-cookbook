import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Audit 1: Supabase Recipes + Cloudinary Images ---
console.log("AUDIT 1: SUPABASE RECIPES + CLOUDINARY IMAGES");
console.log("==============================================");

const { data: recipes, error: recipeError } = await supabase
  .from("recipes")
  .select("id, slug, name, image_url, servings, source_url");

if (recipeError) {
  console.error(`FAIL: Could not fetch recipes: ${recipeError.message}`);
  process.exit(1);
}

let imgPass = 0;
let imgFail = 0;

for (const r of recipes) {
  if (!r.image_url) {
    console.log(`  FAIL ${r.name} — no URL`);
    imgFail++;
    continue;
  }
  try {
    const res = await fetch(r.image_url, { method: "HEAD" });
    if (res.ok) {
      console.log(`  OK ${r.name} — ${res.status}`);
      imgPass++;
    } else {
      console.log(`  FAIL ${r.name} — HTTP ${res.status}`);
      imgFail++;
    }
  } catch (e) {
    console.log(`  FAIL ${r.name} — ${e.message}`);
    imgFail++;
  }
}

console.log(`\n  Result: ${imgPass} pass, ${imgFail} fail\n`);

// --- Audit 2: Live Site ---
console.log("AUDIT 2: LIVE SITE (Vercel)");
console.log("===========================");

const siteRes = await fetch("https://julies-cookbook.vercel.app");
console.log(`  Homepage: ${siteRes.status} ${siteRes.statusText}`);
const siteHtml = await siteRes.text();
const recipeCount = (siteHtml.match(/\/recipe\//g) || []).length;
console.log(`  Recipe links found in HTML: ${recipeCount}`);

// Check a recipe detail page using slug
if (recipes.length > 0) {
  const firstSlug = recipes[0].slug;
  const detailRes = await fetch(`https://julies-cookbook.vercel.app/recipe/${firstSlug}`);
  console.log(`  Detail page (${recipes[0].name}): ${detailRes.status} ${detailRes.statusText}`);
}

console.log("");

// --- Audit 3: Chat API ---
console.log("AUDIT 3: CHAT API");
console.log("=================");

const chatRes = await fetch("https://julies-cookbook.vercel.app/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What recipes do you have?",
    history: [],
  }),
});

const chatData = await chatRes.json();
console.log(`  Status: ${chatRes.status}`);
if (chatData.response) {
  console.log(`  Response: "${chatData.response.slice(0, 150)}..."`);
  console.log(`  OK Chat API working`);
} else {
  console.log(`  FAIL Chat API error: ${JSON.stringify(chatData)}`);
}

console.log("");

// --- Audit 4: Ingredients Table ---
console.log("AUDIT 4: INGREDIENTS TABLE");
console.log("==========================");

const { data: ingredients, error: ingError } = await supabase
  .from("ingredients")
  .select("id, recipe_id, name, calories");

if (ingError) {
  console.error(`FAIL: Could not fetch ingredients: ${ingError.message}`);
  process.exit(1);
}

const recipeIds = new Set(recipes.map((r) => r.id));
const withCal = ingredients.filter((r) => r.calories && r.calories > 0);
const orphans = ingredients.filter((r) => !recipeIds.has(r.recipe_id));
console.log(`  Total ingredients: ${ingredients.length}`);
console.log(`  With calories: ${withCal.length}`);
console.log(`  Orphan records: ${orphans.length}`);

// Group by recipe for per-recipe counts
const byRecipe = new Map();
for (const ing of ingredients) {
  const list = byRecipe.get(ing.recipe_id) || [];
  list.push(ing);
  byRecipe.set(ing.recipe_id, list);
}

const recipesWithoutIngredients = recipes.filter((r) => !byRecipe.has(r.id));
if (recipesWithoutIngredients.length > 0) {
  console.log(`  Recipes without ingredients: ${recipesWithoutIngredients.length}`);
  for (const r of recipesWithoutIngredients) {
    console.log(`    - ${r.name}`);
  }
}

// --- Audit 5: Food Log ---
console.log("\nAUDIT 5: FOOD LOG");
console.log("=================");

const { count: logCount } = await supabase
  .from("food_log")
  .select("id", { count: "exact", head: true });

console.log(`  Food log entries: ${logCount || 0}`);

console.log("");

// --- Summary ---
console.log("==================");
console.log("FULL AUDIT SUMMARY");
console.log("==================");
console.log(`  Recipes:      ${recipes.length} (all with images: ${imgFail === 0 ? "YES" : "NO"})`);
console.log(`  Images:       ${imgPass}/${recipes.length} accessible on CDN`);
console.log(`  Live site:    ${siteRes.status === 200 ? "OK" : "FAIL"} (${siteRes.status})`);
console.log(`  Ingredients:  ${ingredients.length} records, ${orphans.length} orphans`);
console.log(`  Food log:     ${logCount || 0} entries`);
console.log(`  Data source:  Supabase`);
