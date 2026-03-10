/**
 * rescrape-all.mjs
 *
 * Re-scrapes all recipes from their Source URLs, deletes old ingredient records,
 * and creates fresh ones linked to the existing recipe records.
 * Does NOT create new recipe records or re-upload images.
 *
 * Usage: node --env-file=.env.local scripts/rescrape-all.mjs
 */

import Airtable from "airtable";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// CONFIG
// ============================================================
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RECIPES_TABLE = "tblcDuujfu1rokjSU";
const INGREDIENTS_TABLE = "tblbly81hGxUaEgM2";

const VALID_CUISINES = ["American", "Moroccan", "Italian", "Asian", "Mediterranean", "Other"];
const VALID_DIETARY = ["Vegetarian", "Gluten-Free", "Dairy-Free", "High Protein", "Comfort Food"];
const VALID_COOKING_UNITS = ["/tsp", "/tbsp", "/cup", "/oz", "/lb", "/each", "/can"];
const VALID_CATEGORIES = ["Produce", "Meat", "Fish", "Dairy", "Spice", "Pantry", "Grocery", "Bakery", "Other"];

const UNIT_MAP = {
  cups: "/cup", cup: "/cup",
  oz: "/oz", ounce: "/oz", ounces: "/oz",
  lb: "/lb", lbs: "/lb", pound: "/lb", pounds: "/lb",
  can: "/can", cans: "/can",
  each: "/each", whole: "/each", piece: "/each", pieces: "/each",
  cloves: "/each", clove: "/each",
  tbsp: "/tbsp", tablespoon: "/tbsp", tablespoons: "/tbsp",
  tsp: "/tsp", teaspoon: "/tsp", teaspoons: "/tsp",
};

// ============================================================
// INGREDIENT DATA CONTRACT (copied from scrape-recipe.mjs)
// ============================================================
const CANONICAL_NAMES = {
  "extra-virgin olive oil": "olive oil",
  "extra virgin olive oil": "olive oil",
  "evoo": "olive oil",
  "large eggs": "egg", "large egg": "egg", "eggs": "egg",
  "carrots": "carrot", "onions": "onion", "potatoes": "potato",
  "sweet potatoes": "sweet potato", "bell peppers": "bell pepper",
  "red bell peppers": "red bell pepper", "strawberries": "strawberry",
  "blueberries": "blueberry", "lentils": "lentil", "chickpeas": "chickpea",
  "tomatoes": "tomato", "green onions": "green onion",
  "cloves garlic": "garlic", "garlic cloves": "garlic",
  "chicken breasts": "chicken breast", "chicken thighs": "chicken thigh",
  "hamburger buns": "hamburger bun", "dried apricots": "dried apricot",
  "golden raisins": "golden raisin", "slivered almonds": "slivered almond",
};

const KEEP_WITH_ADJECTIVE = [
  "sweet potato", "fresh parsley", "fresh ginger", "dried apricot",
  "dried thyme", "red bell pepper", "red pepper flakes", "red wine vinegar",
  "brown sugar", "brown rice", "sharp cheddar", "colby jack cheese",
  "diced tomatoes", "crushed tomatoes",
];

function normalizeName(name) {
  let n = name.toLowerCase().trim();
  if (CANONICAL_NAMES[n]) return CANONICAL_NAMES[n];
  if (KEEP_WITH_ADJECTIVE.includes(n)) return n;
  for (const adj of ["large", "medium", "small"]) {
    if (n.startsWith(adj + " ")) n = n.slice(adj.length + 1);
  }
  const noStrip = ["peas", "collard greens", "diced tomatoes", "crushed tomatoes",
    "red pepper flakes", "golden raisins", "slivered almonds"];
  if (!noStrip.includes(n) && n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("us")) {
    const singular = n.endsWith("ies") ? n.slice(0, -3) + "y"
      : n.endsWith("es") ? n.slice(0, -2)
      : n.slice(0, -1);
    if (singular.length > 2) n = singular;
  }
  if (CANONICAL_NAMES[n]) return CANONICAL_NAMES[n];
  return n;
}

const CATEGORY_MAP = {
  "onion": "Produce", "garlic": "Produce", "carrot": "Produce",
  "bell pepper": "Produce", "red bell pepper": "Produce", "zucchini": "Produce",
  "sweet potato": "Produce", "lemon": "Produce", "blueberry": "Produce",
  "strawberry": "Produce", "collard greens": "Produce", "broccoli": "Produce",
  "green onion": "Produce", "fresh parsley": "Produce", "fresh ginger": "Produce",
  "dried apricot": "Produce", "potato": "Produce", "tomato": "Produce",
  "russet potato": "Produce",
  "ground beef": "Meat", "chicken breast": "Meat", "chicken thigh": "Meat",
  "egg": "Dairy", "butter": "Dairy", "milk": "Dairy", "heavy cream": "Dairy",
  "evaporated milk": "Dairy", "feta cheese": "Dairy", "cheddar cheese": "Dairy",
  "sharp cheddar": "Dairy", "colby jack cheese": "Dairy", "vanilla ice cream": "Dairy",
  "parmesan cheese": "Dairy",
  "salt": "Spice", "black pepper": "Spice", "cumin": "Spice", "paprika": "Spice",
  "italian seasoning": "Spice", "dried thyme": "Spice", "curry powder": "Spice",
  "red pepper flakes": "Spice", "sea salt": "Spice", "montreal steak seasoning": "Spice",
  "baking powder": "Spice",
  "olive oil": "Pantry", "soy sauce": "Pantry", "honey": "Pantry",
  "maple syrup": "Pantry", "vinegar": "Pantry", "red wine vinegar": "Pantry",
  "rice vinegar": "Pantry", "tomato paste": "Pantry", "dijon mustard": "Pantry",
  "bbq sauce": "Pantry", "tamari": "Pantry", "chili garlic sauce": "Pantry",
  "toasted sesame oil": "Pantry", "cornstarch": "Pantry", "brown sugar": "Pantry",
  "sugar": "Pantry", "icing sugar": "Pantry", "chocolate sauce": "Pantry",
  "lemon juice": "Pantry", "peanut butter": "Pantry", "vanilla extract": "Pantry",
  "ketchup": "Pantry",
  "all-purpose flour": "Grocery", "white rice": "Grocery", "brown rice": "Grocery",
  "elbow macaroni": "Grocery", "cavatappi pasta": "Grocery", "couscous": "Grocery",
  "lentil": "Grocery", "chickpea": "Grocery", "golden raisin": "Grocery",
  "slivered almond": "Grocery", "diced tomatoes": "Grocery",
  "crushed tomatoes": "Grocery", "tomato sauce": "Grocery",
  "vegetable broth": "Grocery", "chicken broth": "Grocery", "beef broth": "Grocery",
  "water": "Grocery", "extra-firm tofu": "Grocery", "peas": "Grocery",
  "spaghetti": "Grocery", "hamburger bun": "Bakery",
};

const SPICES = [
  "salt", "black pepper", "cumin", "paprika", "italian seasoning",
  "dried thyme", "curry powder", "red pepper flakes", "baking powder",
  "sea salt", "montreal steak seasoning",
];
const SMALL_LIQUIDS = [
  "olive oil", "soy sauce", "honey", "maple syrup", "vinegar",
  "red wine vinegar", "rice vinegar", "tomato paste", "dijon mustard",
  "lemon juice", "cornstarch", "brown sugar", "sugar", "fresh ginger",
  "bbq sauce", "tamari", "chili garlic sauce", "toasted sesame oil",
  "vanilla extract", "ketchup", "chocolate sauce", "icing sugar",
];

function assignUnit(name, qty, rawUnit) {
  const mapped = rawUnit ? (UNIT_MAP[rawUnit.toLowerCase()] || null) : null;
  if (mapped && VALID_COOKING_UNITS.includes(mapped)) return mapped;
  if (SPICES.includes(name) && (qty ?? 1) <= 3) return "/tsp";
  if (SMALL_LIQUIDS.includes(name) && (qty ?? 1) <= 3) return "/tbsp";
  const countable = ["egg", "onion", "garlic", "bell pepper", "red bell pepper",
    "carrot", "zucchini", "lemon", "hamburger bun", "potato", "tomato",
    "sweet potato", "dried apricot", "strawberry", "green onion"];
  if (countable.includes(name)) return "/each";
  return "/tsp";
}

const MACROS = {
  "olive oil": { per: "tbsp", cal: 119, p: 0, c: 0, f: 14 },
  "butter": { per: "tbsp", cal: 102, p: 0, c: 0, f: 12 },
  "toasted sesame oil": { per: "tbsp", cal: 120, p: 0, c: 0, f: 14 },
  "ground beef": { per: "lb", cal: 1152, p: 77, c: 0, f: 92 },
  "chicken breast": { per: "lb", cal: 748, p: 139, c: 0, f: 16 },
  "chicken thigh": { per: "lb", cal: 1085, p: 109, c: 0, f: 69 },
  "egg": { per: "each", cal: 72, p: 6, c: 0, f: 5 },
  "all-purpose flour": { per: "cup", cal: 455, p: 13, c: 95, f: 1 },
  "white rice": { per: "cup", cal: 675, p: 13, c: 148, f: 1 },
  "brown rice": { per: "cup", cal: 685, p: 14, c: 143, f: 5 },
  "elbow macaroni": { per: "cup", cal: 389, p: 13, c: 78, f: 2 },
  "couscous": { per: "cup", cal: 650, p: 22, c: 134, f: 1 },
  "lentil": { per: "cup", cal: 678, p: 50, c: 115, f: 2 },
  "milk": { per: "cup", cal: 149, p: 8, c: 12, f: 8 },
  "heavy cream": { per: "cup", cal: 821, p: 5, c: 7, f: 88 },
  "cheddar cheese": { per: "cup", cal: 455, p: 28, c: 1, f: 37 },
  "feta cheese": { per: "cup", cal: 396, p: 22, c: 6, f: 32 },
  "parmesan cheese": { per: "cup", cal: 431, p: 38, c: 4, f: 29 },
  "diced tomatoes": { per: "14oz", cal: 70, p: 4, c: 14, f: 0 },
  "crushed tomatoes": { per: "28oz", cal: 140, p: 7, c: 28, f: 0 },
  "tomato sauce": { per: "8oz", cal: 60, p: 2, c: 12, f: 0 },
  "chickpea": { per: "can", cal: 360, p: 19, c: 58, f: 6 },
  "salt": { per: "tsp", cal: 0, p: 0, c: 0, f: 0 },
  "black pepper": { per: "tsp", cal: 6, p: 0, c: 2, f: 0 },
  "cumin": { per: "tsp", cal: 8, p: 0, c: 1, f: 0 },
  "paprika": { per: "tsp", cal: 6, p: 0, c: 1, f: 0 },
  "italian seasoning": { per: "tsp", cal: 5, p: 0, c: 1, f: 0 },
  "dried thyme": { per: "tsp", cal: 5, p: 0, c: 1, f: 0 },
  "curry powder": { per: "tsp", cal: 7, p: 0, c: 1, f: 0 },
  "red pepper flakes": { per: "tsp", cal: 6, p: 0, c: 1, f: 0 },
  "baking powder": { per: "tsp", cal: 2, p: 0, c: 1, f: 0 },
  "soy sauce": { per: "tbsp", cal: 9, p: 1, c: 1, f: 0 },
  "honey": { per: "tbsp", cal: 64, p: 0, c: 17, f: 0 },
  "maple syrup": { per: "tbsp", cal: 52, p: 0, c: 13, f: 0 },
  "vinegar": { per: "tbsp", cal: 3, p: 0, c: 0, f: 0 },
  "red wine vinegar": { per: "tbsp", cal: 3, p: 0, c: 0, f: 0 },
  "rice vinegar": { per: "tbsp", cal: 3, p: 0, c: 0, f: 0 },
  "tomato paste": { per: "tbsp", cal: 13, p: 1, c: 3, f: 0 },
  "dijon mustard": { per: "tbsp", cal: 15, p: 1, c: 1, f: 1 },
  "lemon juice": { per: "tbsp", cal: 4, p: 0, c: 1, f: 0 },
  "cornstarch": { per: "tbsp", cal: 30, p: 0, c: 7, f: 0 },
  "brown sugar": { per: "tbsp", cal: 52, p: 0, c: 13, f: 0 },
  "sugar": { per: "tbsp", cal: 48, p: 0, c: 12, f: 0 },
  "vanilla extract": { per: "tsp", cal: 12, p: 0, c: 1, f: 0 },
  "onion": { per: "each", cal: 44, p: 1, c: 10, f: 0 },
  "garlic": { per: "each", cal: 4, p: 0, c: 1, f: 0 },
  "carrot": { per: "each", cal: 25, p: 1, c: 6, f: 0 },
  "bell pepper": { per: "each", cal: 30, p: 1, c: 7, f: 0 },
  "red bell pepper": { per: "each", cal: 30, p: 1, c: 7, f: 0 },
  "zucchini": { per: "each", cal: 33, p: 2, c: 6, f: 1 },
  "sweet potato": { per: "lb", cal: 390, p: 7, c: 90, f: 1 },
  "lemon": { per: "each", cal: 17, p: 1, c: 5, f: 0 },
  "blueberry": { per: "cup", cal: 84, p: 1, c: 21, f: 0 },
  "strawberry": { per: "each", cal: 4, p: 0, c: 1, f: 0 },
  "broccoli": { per: "cup", cal: 31, p: 3, c: 6, f: 0 },
  "water": { per: "cup", cal: 0, p: 0, c: 0, f: 0 },
  "vegetable broth": { per: "cup", cal: 12, p: 1, c: 2, f: 0 },
  "chicken broth": { per: "cup", cal: 15, p: 3, c: 1, f: 0 },
  "beef broth": { per: "cup", cal: 17, p: 3, c: 1, f: 0 },
  "hamburger bun": { per: "each", cal: 120, p: 4, c: 22, f: 2 },
  "bbq sauce": { per: "tbsp", cal: 29, p: 0, c: 7, f: 0 },
  "evaporated milk": { per: "cup", cal: 338, p: 17, c: 25, f: 19 },
  "sharp cheddar": { per: "cup", cal: 455, p: 28, c: 1, f: 37 },
  "colby jack cheese": { per: "cup", cal: 445, p: 27, c: 1, f: 36 },
  "cavatappi pasta": { per: "lb", cal: 1600, p: 56, c: 320, f: 7 },
  "spaghetti": { per: "oz", cal: 105, p: 4, c: 21, f: 0.5 },
  "collard greens": { per: "cup", cal: 11, p: 1, c: 2, f: 0 },
  "icing sugar": { per: "tbsp", cal: 30, p: 0, c: 8, f: 0 },
  "chocolate sauce": { per: "tbsp", cal: 50, p: 0, c: 12, f: 1 },
  "vanilla ice cream": { per: "cup", cal: 273, p: 5, c: 31, f: 15 },
  "montreal steak seasoning": { per: "tsp", cal: 5, p: 0, c: 1, f: 0 },
  "sea salt": { per: "tsp", cal: 0, p: 0, c: 0, f: 0 },
  "russet potato": { per: "lb", cal: 350, p: 9, c: 79, f: 0 },
  "dried apricot": { per: "cup", cal: 313, p: 4, c: 81, f: 1 },
  "golden raisin": { per: "cup", cal: 438, p: 3, c: 115, f: 1 },
  "slivered almond": { per: "cup", cal: 530, p: 20, c: 18, f: 46 },
  "fresh ginger": { per: "tbsp", cal: 5, p: 0, c: 1, f: 0 },
  "fresh parsley": { per: "tbsp", cal: 1, p: 0, c: 0, f: 0 },
};

function getUnitMultiplier(recipeUnit, refUnit) {
  const u = recipeUnit?.replace("/", "") || "";
  const r = refUnit || "";
  if (u === r) return 1;
  if (u === "tsp" && r === "tbsp") return 1 / 3;
  if (u === "tbsp" && r === "tsp") return 3;
  if (u === "cup" && r === "tbsp") return 16;
  if (u === "tbsp" && r === "cup") return 1 / 16;
  if (u === "cup" && r === "tsp") return 48;
  if (u === "tsp" && r === "cup") return 1 / 48;
  if (u === "oz" && r === "14oz") return 1 / 14;
  if (u === "oz" && r === "28oz") return 1 / 28;
  if (u === "oz" && r === "8oz") return 1 / 8;
  return 1;
}

function estimateMacros(name, qty, unit) {
  const ref = MACROS[name];
  if (!ref) return null;
  const q = qty ?? 1;
  const multiplier = getUnitMultiplier(unit, ref.per);
  const scale = q * multiplier;
  return {
    cal: Math.round(ref.cal * scale),
    p: Math.round(ref.p * scale),
    c: Math.round(ref.c * scale),
    f: Math.round(ref.f * scale),
  };
}

// ============================================================
// ING FIELD IDS
// ============================================================
const ING_FIELDS = {
  name: "fld39u3mmhVCvMG1O",
  quantity: "fldQBvNRyFEKNB9eV",
  unit: "fldhovLVfCHfba1nM",
  recipesLink: "fldwub0ugkvMTHX2P",
  category: "fldg5uYGPex1K3uJ9",
  calories: "fldoXpPm8rZwPWxQY",
  protein: "fldSWy4Feb88MMqxy",
  carbs: "fldp7QNxNMpXzkBIU",
  fat: "fldx8AY3eOHavt5r6",
};

// ============================================================
// SCRAPE PAGE
// ============================================================
async function scrapePage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (res.status === 403) return { blocked: true, url };

  const html = await res.text();
  const $ = cheerio.load(html);

  let jsonLd = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const item of items) {
        if (item["@type"] === "Recipe" || (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))) {
          jsonLd = item;
        }
      }
    } catch {}
  });

  $("script, style, nav, footer, header, aside").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 10000);

  const hasContent = jsonLd || bodyText.length > 200;
  if (!hasContent) return { blocked: true, url };

  return {
    blocked: false,
    jsonLd,
    source: jsonLd ? JSON.stringify(jsonLd, null, 2) : bodyText,
    url,
  };
}

// ============================================================
// EXTRACT WITH CLAUDE
// ============================================================
async function extractIngredients(content, sourceUrl, recipeName) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a recipe data extraction assistant. Extract ONLY the ingredient list from this recipe.

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
- "Produce" - fresh fruits, vegetables, herbs
- "Meat" - all meat and poultry
- "Fish" - all seafood
- "Dairy" - milk, cream, cheese, butter, eggs, yogurt
- "Spice" - dried spices and seasonings (salt, pepper, cumin, paprika, baking powder)
- "Pantry" - oils, vinegars, sauces, sweeteners, extracts, sugar, cornstarch
- "Grocery" - dry goods, grains, pasta, canned goods, nuts, broths
- "Bakery" - bread, buns, tortillas
- "Other" - anything that doesn't fit above

MACRO RULES:
- Every ingredient MUST have calories, protein_g, carbs_g, fat_g
- Values are for the RECIPE QUANTITY (not per 100g)
- Round to whole numbers
- Use USDA reference values`,
    messages: [
      {
        role: "user",
        content: `Extract the ingredient list from this recipe: "${recipeName}"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "ingredients": [
    {
      "name": "string (lowercase, singular, canonical)",
      "quantity": number,
      "unit": one of ["tsp","tbsp","cup","oz","lb","each","can"],
      "category": one of ["Produce","Meat","Fish","Dairy","Spice","Pantry","Grocery","Bakery","Other"],
      "calories": number (whole, USDA estimate for recipe qty),
      "protein_g": number (whole),
      "carbs_g": number (whole),
      "fat_g": number (whole)
    }
  ]
}

Source URL: ${sourceUrl}

Content:
${content}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error(`   EXTRACT FAILED: Claude returned invalid JSON for "${recipeName}"`);
    console.error(`   Raw: ${text.slice(0, 300)}`);
    return null;
  }
}

// ============================================================
// NORMALIZE INGREDIENTS
// ============================================================
function normalizeIngredients(ingredients) {
  return ingredients.map((ing) => {
    const rawName = (ing.name || "").replace(/[""'']/g, "").trim();
    const name = normalizeName(rawName);
    const unit = assignUnit(name, ing.quantity, ing.unit);
    let category = CATEGORY_MAP[name] || ing.category || "Other";
    if (!VALID_CATEGORIES.includes(category)) category = "Other";
    if (category === "Misc." || category === "Misc") category = "Other";

    let cal = ing.calories ?? null;
    let pro = ing.protein_g ?? null;
    let carb = ing.carbs_g ?? null;
    let fat = ing.fat_g ?? null;

    if (cal === null || pro === null || carb === null || fat === null) {
      const est = estimateMacros(name, ing.quantity, unit);
      if (est) {
        if (cal === null) cal = est.cal;
        if (pro === null) pro = est.p;
        if (carb === null) carb = est.c;
        if (fat === null) fat = est.f;
      }
    }

    // Always override with USDA reference if we have it
    const est = estimateMacros(name, ing.quantity, unit);
    if (est) {
      cal = est.cal;
      pro = est.p;
      carb = est.c;
      fat = est.f;
    }

    cal = Math.round(cal ?? 0);
    pro = Math.round(pro ?? 0);
    carb = Math.round(carb ?? 0);
    fat = Math.round(fat ?? 0);

    if (!name) return null;

    return { name, quantity: ing.quantity ?? 1, unit, category, cal, pro, carb, fat };
  }).filter(Boolean);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("");
  console.log("Julie's Cookbook — Re-scrape All Recipes");
  console.log("========================================");
  console.log("");

  // Validate env
  const required = ["AIRTABLE_API_KEY", "ANTHROPIC_API_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    process.exit(1);
  }

  // Step 1: Fetch all recipes
  console.log("Step 1: Fetching all recipes from Airtable...");
  const recipes = await base(RECIPES_TABLE)
    .select({ fields: ["Recipe Name", "Source URL"] })
    .all();

  const withUrls = recipes.filter((r) => {
    const url = r.get("Source URL");
    return url && url.startsWith("http");
  });

  console.log(`   Found ${recipes.length} recipes, ${withUrls.length} with Source URLs`);
  console.log("");

  // Step 2: Fetch all ingredients (to know which to delete per recipe)
  console.log("Step 2: Fetching all ingredient records...");
  const allIngredients = await base(INGREDIENTS_TABLE)
    .select({ fields: ["Name", "Recipes"] })
    .all();
  console.log(`   Found ${allIngredients.length} total ingredient records`);
  console.log("");

  // Build map: recipeId -> ingredient record IDs
  const ingredientsByRecipe = {};
  for (const ing of allIngredients) {
    const linked = ing.get("Recipes") || [];
    for (const recId of linked) {
      if (!ingredientsByRecipe[recId]) ingredientsByRecipe[recId] = [];
      ingredientsByRecipe[recId].push(ing.id);
    }
  }

  let totalDeleted = 0;
  let totalCreated = 0;
  let succeeded = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < withUrls.length; i++) {
    const rec = withUrls[i];
    const name = rec.get("Recipe Name");
    const url = rec.get("Source URL");
    const recipeId = rec.id;

    console.log(`[${i + 1}/${withUrls.length}] ${name}`);
    console.log(`   URL: ${url}`);

    // Delete old ingredients
    const oldIngIds = ingredientsByRecipe[recipeId] || [];
    if (oldIngIds.length > 0) {
      for (let j = 0; j < oldIngIds.length; j += 10) {
        await base(INGREDIENTS_TABLE).destroy(oldIngIds.slice(j, j + 10));
      }
      console.log(`   Deleted ${oldIngIds.length} old ingredient records`);
      totalDeleted += oldIngIds.length;
    }

    // Scrape page
    let scraped;
    try {
      scraped = await scrapePage(url);
    } catch (err) {
      console.log(`   SCRAPE FAILED: ${err.message}`);
      failures.push({ name, error: `scrape: ${err.message}` });
      failed++;
      continue;
    }

    if (scraped.blocked) {
      console.log(`   BLOCKED (403) — skipping`);
      failures.push({ name, error: "blocked (403)" });
      failed++;
      continue;
    }

    // Extract with Claude
    const extracted = await extractIngredients(scraped.source, url, name);
    if (!extracted?.ingredients?.length) {
      console.log(`   EXTRACT FAILED — no ingredients returned`);
      failures.push({ name, error: "no ingredients extracted" });
      failed++;
      continue;
    }

    // Normalize
    const ingredients = normalizeIngredients(extracted.ingredients);
    console.log(`   Extracted & normalized ${ingredients.length} ingredients`);

    // Create new ingredient records
    for (let j = 0; j < ingredients.length; j += 10) {
      const batch = ingredients.slice(j, j + 10);
      await base(INGREDIENTS_TABLE).create(
        batch.map((ing) => ({
          fields: {
            [ING_FIELDS.name]: ing.name,
            [ING_FIELDS.quantity]: ing.quantity,
            [ING_FIELDS.unit]: ing.unit,
            [ING_FIELDS.recipesLink]: [recipeId],
            [ING_FIELDS.category]: ing.category,
            [ING_FIELDS.calories]: ing.cal,
            [ING_FIELDS.protein]: ing.pro,
            [ING_FIELDS.carbs]: ing.carb,
            [ING_FIELDS.fat]: ing.fat,
          },
        })),
        { typecast: true }
      );
    }

    totalCreated += ingredients.length;
    succeeded++;
    console.log(`   Created ${ingredients.length} new ingredient records (linked to ${recipeId})`);
    console.log("");

    // Rate limit: small delay between recipes
    if (i < withUrls.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("========================================");
  console.log("SUMMARY");
  console.log(`   Recipes processed: ${succeeded}/${withUrls.length}`);
  console.log(`   Old ingredients deleted: ${totalDeleted}`);
  console.log(`   New ingredients created: ${totalCreated}`);
  if (failures.length > 0) {
    console.log(`   FAILURES (${failures.length}):`);
    for (const f of failures) {
      console.log(`     - ${f.name}: ${f.error}`);
    }
  }
  console.log("");
  console.log("Next steps:");
  console.log("  node --env-file=.env.local scripts/clean-orphans.mjs");
  console.log("  node --env-file=.env.local scripts/verify-db.mjs");
  console.log("  node --env-file=.env.local scripts/audit.mjs");
}

main().catch((err) => {
  console.error(`\nFATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
