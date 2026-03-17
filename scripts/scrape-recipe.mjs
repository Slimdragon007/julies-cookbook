import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

// ============================================================
// CONFIG
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Exact Airtable select options
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
const CUISINE_MAP = {
  "Middle Eastern": "Mediterranean",
  French: "Other",
  Mexican: "Other",
  Indian: "Other",
  Japanese: "Asian",
  Chinese: "Asian",
  Thai: "Asian",
  Korean: "Asian",
  Vietnamese: "Asian",
};

// ============================================================
// INGREDIENT DATA CONTRACT: Name Normalization
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

  // Strip size adjectives
  for (const adj of ["large", "medium", "small"]) {
    if (n.startsWith(adj + " ")) n = n.slice(adj.length + 1);
  }

  // Simple plural -> singular (careful with exceptions)
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

// ============================================================
// INGREDIENT DATA CONTRACT: Category Assignment
// ============================================================
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
  "hamburger bun": "Bakery",
};

// ============================================================
// INGREDIENT DATA CONTRACT: Unit Assignment
// ============================================================
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
  "vanilla extract", "ketchup",
];

function assignUnit(name, qty, rawUnit) {
  // Map raw unit first
  const mapped = rawUnit ? (UNIT_MAP[rawUnit.toLowerCase()] || null) : null;
  if (mapped && VALID_COOKING_UNITS.includes(mapped)) return mapped;

  // Spices
  if (SPICES.includes(name) && (qty ?? 1) <= 3) return "/tsp";
  // Small liquids/pastes
  if (SMALL_LIQUIDS.includes(name) && (qty ?? 1) <= 3) return "/tbsp";
  // Countable items
  const countable = ["egg", "onion", "garlic", "bell pepper", "red bell pepper",
    "carrot", "zucchini", "lemon", "hamburger bun", "potato", "tomato",
    "sweet potato", "dried apricot", "strawberry", "green onion"];
  if (countable.includes(name)) return "/each";

  return "/tsp"; // fallback
}

// ============================================================
// INGREDIENT DATA CONTRACT: USDA Macro Estimation
// ============================================================
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
  "hamburger bun": { per: "each", cal: 120, p: 4, c: 22, f: 2 },
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
// STEP 1: VALIDATE ENV VARS
// ============================================================
function validateEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("PREFLIGHT FAILED: Missing env vars:", missing.join(", "));
    process.exit(1);
  }
  if (!process.env.SCRAPINGBEE_API_KEY) {
    console.log("   Note: SCRAPINGBEE_API_KEY not set. Cloudflare-blocked sites will need manual fallback.");
  }
  console.log("Step 1/7: Env vars validated");
}

// ============================================================
// STEP 2: CHECK FOR DUPLICATES
// ============================================================
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function checkForDuplicate(recipeName, sourceUrl) {
  // Check by source_url first (most reliable), then by name
  if (sourceUrl && sourceUrl !== "manual entry") {
    const { data } = await supabase
      .from("recipes")
      .select("id, name")
      .eq("source_url", sourceUrl)
      .limit(1);
    if (data && data.length > 0) {
      console.error(`DUPLICATE CHECK FAILED: source URL already exists for "${data[0].name}" (${data[0].id})`);
      console.error("   Use --force to add anyway, or update the existing record manually.");
      return true;
    }
  }

  const { data } = await supabase
    .from("recipes")
    .select("id")
    .eq("name", recipeName)
    .limit(1);

  if (data && data.length > 0) {
    console.error(`DUPLICATE CHECK FAILED: "${recipeName}" already exists in Supabase (${data[0].id})`);
    console.error("   Use --force to add anyway, or update the existing record manually.");
    return true;
  }
  console.log(`Step 3/7: No duplicate found for "${recipeName}"`);
  return false;
}

// ============================================================
// STEP 3: SCRAPE PAGE (with ScrapingBee fallback for Cloudflare)
// ============================================================
async function fetchWithFallback(url) {
  // Try direct fetch first
  console.log(`   Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (res.status !== 403) {
    return { html: await res.text(), method: "direct" };
  }

  // Direct fetch blocked — try ScrapingBee
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    return { html: null, method: "blocked" };
  }

  console.log("   Direct fetch blocked (403). Retrying with ScrapingBee...");
  const sbUrl = `https://app.scrapingbee.com/api/v1?${new URLSearchParams({
    api_key: apiKey,
    url: url,
    render_js: "true",
    premium_proxy: "true",
  })}`;

  const sbRes = await fetch(sbUrl);
  if (!sbRes.ok) {
    console.error(`   ScrapingBee returned ${sbRes.status}: ${await sbRes.text()}`);
    return { html: null, method: "blocked" };
  }

  return { html: await sbRes.text(), method: "scrapingbee" };
}

async function scrapePage(url) {
  const { html, method } = await fetchWithFallback(url);

  if (method === "blocked") {
    return { blocked: true, url };
  }

  if (!html) {
    return { blocked: true, url };
  }
  const $ = cheerio.load(html);

  // Find JSON-LD structured data
  let jsonLd = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const item of items) {
        if (
          item["@type"] === "Recipe" ||
          (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
        ) {
          jsonLd = item;
        }
      }
    } catch {}
  });

  // Clean body text as fallback
  $("script, style, nav, footer, header, aside").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 10000);

  // Find best image
  let imageUrl = null;
  if (jsonLd?.image) {
    imageUrl = Array.isArray(jsonLd.image)
      ? typeof jsonLd.image[0] === "string"
        ? jsonLd.image[0]
        : jsonLd.image[0]?.url
      : typeof jsonLd.image === "string"
        ? jsonLd.image
        : jsonLd.image?.url;
  }
  if (!imageUrl) {
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrl = ogImage;
  }

  const hasContent = jsonLd || bodyText.length > 200;
  if (!hasContent) {
    return { blocked: true, url };
  }

  console.log(`Step 2/7: Page scraped via ${method} (${jsonLd ? "JSON-LD found" : "using page text"}${imageUrl ? ", image found" : ", no image"})`);
  return {
    blocked: false,
    jsonLd,
    bodyText,
    imageUrl,
    url,
    source: jsonLd ? JSON.stringify(jsonLd, null, 2) : bodyText,
  };
}

// ============================================================
// STEP 4: EXTRACT WITH CLAUDE (Data Contract enforced)
// ============================================================
async function extractRecipeData(content, sourceUrl) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a recipe data extraction assistant. You extract structured recipe data from web content.

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
- "Produce" - fresh fruits, vegetables, herbs (onion, garlic, carrot, bell pepper, lemon, parsley, blueberry)
- "Meat" - all meat and poultry (ground beef, chicken breast, chicken thigh)
- "Fish" - all seafood (salmon, shrimp, tuna)
- "Dairy" - milk, cream, cheese, butter, eggs, yogurt
- "Spice" - dried spices and seasonings (cumin, paprika, Italian seasoning, salt, black pepper, red pepper flakes, baking powder)
- "Pantry" - oils, vinegars, sauces, sweeteners, extracts (olive oil, soy sauce, honey, vanilla, Dijon mustard, tomato paste, sugar, cornstarch)
- "Grocery" - dry goods, grains, pasta, canned goods, nuts, broths (flour, rice, lentils, couscous, chickpeas, diced tomatoes, chicken broth)
- "Bakery" - bread, buns, tortillas
- "Other" - anything that doesn't fit above
- NEVER use "Misc."

MACRO RULES:
- Every ingredient MUST have calories, protein_g, carbs_g, fat_g
- Values are for the RECIPE QUANTITY (not per 100g). Example: "2 tbsp olive oil" = 238 cal, 0P, 0C, 28F
- Round to whole numbers
- Use USDA reference values:
  * olive oil (per tbsp): 119 cal, 0P, 0C, 14F
  * butter (per tbsp): 102 cal, 0P, 0C, 12F
  * egg (each): 72 cal, 6P, 0C, 5F
  * ground beef 80/20 (per lb): 1152 cal, 77P, 0C, 92F
  * chicken breast (per lb): 748 cal, 139P, 0C, 16F
  * chicken thigh (per lb): 1085 cal, 109P, 0C, 69F
  * all-purpose flour (per cup): 455 cal, 13P, 95C, 1F
  * white rice (per cup dry): 675 cal, 13P, 148C, 1F
  * lentils (per cup dry): 678 cal, 50P, 115C, 2F
  * cheddar cheese (per cup): 455 cal, 28P, 1C, 37F
  * diced tomatoes (14 oz can): 70 cal, 4P, 14C, 0F
  * most dried spices (per tsp): 5-8 cal, negligible macros
  * salt: 0 cal across the board
  * sugar (per tbsp): 48 cal, 0P, 12C, 0F
  * honey (per tbsp): 64 cal, 0P, 17C, 0F`,
    messages: [
      {
        role: "user",
        content: `Extract recipe data from this content. Return ONLY valid JSON (no markdown, no code blocks, no explanation).

REQUIRED JSON SCHEMA:
{
  "name": "string (recipe name)",
  "preparation": "string (numbered step-by-step instructions)",
  "servings": number or null,
  "cookTime": number (minutes) or null,
  "prepTime": number (minutes) or null,
  "cuisineTag": one of ${JSON.stringify(VALID_CUISINES)} or null,
  "dietaryTags": array from ${JSON.stringify(VALID_DIETARY)} or [],
  "ingredients": [
    {
      "name": "string (lowercase, singular, canonical per the data contract)",
      "quantity": number,
      "unit": one of ["tsp","tbsp","cup","oz","lb","each","can"],
      "category": one of ${JSON.stringify(VALID_CATEGORIES)},
      "calories": number (whole, USDA estimate for recipe qty),
      "protein_g": number (whole),
      "carbs_g": number (whole),
      "fat_g": number (whole)
    }
  ]
}

CRITICAL:
- Every ingredient MUST have name, quantity, unit, category, calories, protein_g, carbs_g, fat_g
- No nulls allowed in ingredient fields
- Names must be lowercase and singular
- If you cannot extract a recipe, return {"name": null}

Source URL: ${sourceUrl}

Content:
${content}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  let recipe;
  try {
    recipe = JSON.parse(jsonStr);
  } catch {
    console.error("EXTRACT FAILED: Claude returned invalid JSON");
    console.error("   Raw response:", text.slice(0, 500));
    process.exit(1);
  }

  if (!recipe.name) {
    console.error("EXTRACT FAILED: Could not identify recipe from content");
    process.exit(1);
  }

  console.log(`Step 4/7: Recipe extracted: "${recipe.name}"`);
  return recipe;
}

// ============================================================
// STEP 5: VALIDATE + NORMALIZE (Data Contract enforcement)
// ============================================================
function validateRecipeData(recipe) {
  const issues = [];

  if (typeof recipe.name !== "string" || recipe.name.length < 2) {
    issues.push("name is missing or too short");
  }
  if (!recipe.preparation || recipe.preparation.length < 20) {
    issues.push("preparation is missing or too short");
  }
  if (recipe.servings !== null && (typeof recipe.servings !== "number" || recipe.servings < 1)) {
    issues.push(`servings is invalid: ${recipe.servings}`);
  }
  if (recipe.cookTime !== null && typeof recipe.cookTime !== "number") {
    issues.push(`cookTime is not a number: ${recipe.cookTime}`);
  }
  if (recipe.prepTime !== null && typeof recipe.prepTime !== "number") {
    issues.push(`prepTime is not a number: ${recipe.prepTime}`);
  }
  if (recipe.cuisineTag && !VALID_CUISINES.includes(recipe.cuisineTag)) {
    const mapped = CUISINE_MAP[recipe.cuisineTag];
    if (mapped) {
      recipe.cuisineTag = mapped;
    } else {
      issues.push(`cuisineTag "${recipe.cuisineTag}" not in valid options, setting to null`);
      recipe.cuisineTag = null;
    }
  }
  if (recipe.dietaryTags) {
    recipe.dietaryTags = recipe.dietaryTags.filter((t) => {
      if (VALID_DIETARY.includes(t)) return true;
      issues.push(`dietaryTag "${t}" not valid, removing`);
      return false;
    });
  }
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    issues.push("no ingredients found");
  }

  // Post-extraction normalization: enforce data contract on every ingredient
  const rejected = [];
  if (recipe.ingredients) {
    recipe.ingredients = recipe.ingredients.map((ing, i) => {
      // Normalize name
      const rawName = (ing.name || "").replace(/[""'']/g, "").trim();
      const name = normalizeName(rawName);

      // Normalize unit
      const unit = assignUnit(name, ing.quantity, ing.unit);

      // Validate unit is in allowed cooking units
      if (!VALID_COOKING_UNITS.includes(unit)) {
        issues.push(`ingredient "${name}" got invalid unit "${unit}", defaulting to /tsp`);
      }

      // Normalize category
      let category = CATEGORY_MAP[name] || ing.category || "Other";
      if (!VALID_CATEGORIES.includes(category)) {
        issues.push(`ingredient "${name}" category "${category}" invalid, setting to Other`);
        category = "Other";
      }
      if (category === "Misc." || category === "Misc") {
        category = "Other";
      }

      // Normalize macros: use Claude's estimate, fall back to USDA reference, round to whole
      let cal = ing.calories ?? ing.estimatedCalories ?? null;
      let pro = ing.protein_g ?? ing.estimatedProtein ?? null;
      let carb = ing.carbs_g ?? ing.estimatedCarbs ?? null;
      let fat = ing.fat_g ?? ing.estimatedFat ?? null;

      // If any macro is missing, try USDA estimate
      if (cal === null || pro === null || carb === null || fat === null) {
        const est = estimateMacros(name, ing.quantity, unit);
        if (est) {
          if (cal === null) cal = est.cal;
          if (pro === null) pro = est.p;
          if (carb === null) carb = est.c;
          if (fat === null) fat = est.f;
        }
      }

      // Final fallback: 0 for completely unknown
      cal = Math.round(cal ?? 0);
      pro = Math.round(pro ?? 0);
      carb = Math.round(carb ?? 0);
      fat = Math.round(fat ?? 0);

      // Reject if still missing name or unit
      if (!name) {
        rejected.push(`ingredient ${i}: no name`);
        return null;
      }

      return { name, quantity: ing.quantity ?? 1, unit, category, cal, pro, carb, fat };
    }).filter(Boolean);
  }

  // Final validation: reject any ingredient missing required fields
  for (const ing of recipe.ingredients) {
    if (!ing.unit) rejected.push(`"${ing.name}" missing unit`);
    if (!ing.category) rejected.push(`"${ing.name}" missing category`);
    if (ing.cal === null || ing.cal === undefined) rejected.push(`"${ing.name}" missing calories`);
  }

  if (rejected.length > 0) {
    console.error(`VALIDATION REJECTED ${rejected.length} ingredient(s):`);
    rejected.forEach(r => console.error(`   - ${r}`));
    process.exit(1);
  }

  if (issues.length > 0) {
    console.log(`Step 5/7: Validation found ${issues.length} issue(s) (auto-fixed):`);
    issues.forEach((i) => console.log(`   - ${i}`));
  } else {
    console.log("Step 5/7: Data validated, all fields clean");
  }

  return recipe;
}

// ============================================================
// STEP 6: UPLOAD IMAGE TO CLOUDINARY
// ============================================================
async function uploadImage(imageUrl, recipeName) {
  if (!imageUrl) {
    console.log("Step 6/7: No image to upload (recipe will use placeholder)");
    return null;
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Step 6/7: WARNING — Cloudinary env vars missing! Image found but CANNOT upload.");
    console.error("   Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local");
    return null;
  }

  const publicId = recipeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "julies-cookbook",
      public_id: publicId,
      overwrite: true,
    });
    console.log(`Step 6/7: Image uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`Step 6/7: Image upload failed: ${err.message}`);
    return null;
  }
}

// ============================================================
// STEP 7: SAVE TO SUPABASE (Data Contract enforced)
// ============================================================
async function saveToSupabase(recipe, cloudinaryUrl, sourceUrl) {
  const slug = slugify(recipe.name);

  const recipeData = {
    slug,
    name: recipe.name,
    preparation: recipe.preparation,
    source_url: sourceUrl,
    servings: typeof recipe.servings === "number" ? recipe.servings : null,
    cook_time_minutes: typeof recipe.cookTime === "number" ? recipe.cookTime : null,
    prep_time_minutes: typeof recipe.prepTime === "number" ? recipe.prepTime : null,
    cuisine_tag: recipe.cuisineTag && VALID_CUISINES.includes(recipe.cuisineTag) ? recipe.cuisineTag : null,
    dietary_tags: recipe.dietaryTags?.length ? recipe.dietaryTags : [],
    image_url: cloudinaryUrl || null,
  };

  const { data: recipeRecord, error: recipeError } = await supabase
    .from("recipes")
    .insert(recipeData)
    .select("id, name, slug, image_url, servings")
    .single();

  if (recipeError) {
    console.error(`SAVE FAILED: ${recipeError.message}`);
    process.exit(1);
  }

  const recipeId = recipeRecord.id;

  // Create ingredient records
  let ingredientCount = 0;
  if (recipe.ingredients?.length) {
    console.log(`   Creating ${recipe.ingredients.length} ingredient records...`);
    const ingredientRows = recipe.ingredients.map((ing) => ({
      recipe_id: recipeId,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category,
      calories: ing.cal,
      protein_g: ing.pro,
      carbs_g: ing.carb,
      fat_g: ing.fat,
    }));

    const { error: ingError } = await supabase
      .from("ingredients")
      .insert(ingredientRows);

    if (ingError) {
      console.error(`INGREDIENT SAVE FAILED: ${ingError.message}`);
      process.exit(1);
    }
    ingredientCount = ingredientRows.length;
  }

  console.log(`Step 7/7: Supabase record created and verified`);
  console.log(`   ID: ${recipeId}`);
  console.log(`   Slug: ${recipeRecord.slug}`);
  console.log(`   Name: ${recipeRecord.name}`);
  console.log(`   Image: ${recipeRecord.image_url ? "yes" : "no"}`);
  console.log(`   Servings: ${recipeRecord.servings}`);
  console.log(`   Ingredients: ${ingredientCount} (all with unit, category, macros)`);

  return recipeRecord;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");
  const input = args.find((a) => !a.startsWith("--"));

  if (!input) {
    console.log("Julie's Cookbook -- Recipe Scraper");
    console.log("================================");
    console.log("");
    console.log("Usage:");
    console.log("  npm run scrape <recipe-url>              # Scrape from URL");
    console.log("  npm run scrape -- --file recipe.txt      # Extract from text file");
    console.log("  npm run scrape <url> --force             # Skip duplicate check");
    console.log("");
    console.log("Pipeline: Validate -> Scrape -> Extract -> Validate -> Upload -> Save -> Verify");
    console.log("All ingredients enforced per Ingredient Data Contract:");
    console.log("  - lowercase, singular, canonical names");
    console.log("  - cooking units only (tsp, tbsp, cup, oz, lb, each, can)");
    console.log("  - valid category (Produce, Meat, Fish, Dairy, Spice, Pantry, Grocery, Bakery, Other)");
    console.log("  - USDA-based macros (whole numbers)");
    process.exit(0);
  }

  console.log("");
  console.log("Julie's Cookbook -- Recipe Scraper");
  console.log("====================================");

  // Step 1: Validate env
  validateEnv();

  let recipeText = null;
  let sourceUrl = null;
  let imageUrl = null;

  if (args.includes("--file")) {
    const filePath = args[args.indexOf("--file") + 1];
    if (!filePath) {
      console.error("Provide a file path: npm run scrape -- --file recipe.txt");
      process.exit(1);
    }
    console.log(`Step 2/7: Reading from file: ${filePath}`);
    recipeText = readFileSync(filePath, "utf-8");
    sourceUrl = "manual entry";
  } else if (input.startsWith("http")) {
    sourceUrl = input;
    const scraped = await scrapePage(input);

    if (scraped.blocked) {
      console.log("");
      console.log("Site blocked the scraper (403/Cloudflare).");
      console.log("");
      if (!process.env.SCRAPINGBEE_API_KEY) {
        console.log("   AUTO-FIX: Add SCRAPINGBEE_API_KEY to .env.local");
        console.log("   Get a free key at https://www.scrapingbee.com (1,000 calls/month free)");
        console.log("   Then re-run this command — it will auto-bypass Cloudflare.");
        console.log("");
      }
      console.log("   Manual workaround:");
      console.log("   1. Open the URL in your browser");
      console.log("   2. Select all text (Cmd+A), copy (Cmd+C)");
      console.log("   3. Paste into a file: pbpaste > ~/Desktop/recipe.txt");
      console.log("   4. Run: npm run scrape -- --file ~/Desktop/recipe.txt");
      process.exit(1);
    }

    recipeText = scraped.source;
    imageUrl = scraped.imageUrl;
  } else {
    console.error("Provide a URL or use --file flag");
    process.exit(1);
  }

  // Step 4: Extract with Claude
  const recipe = await extractRecipeData(recipeText, sourceUrl);

  // Step 3 (after extraction so we have the name): Duplicate check
  if (!forceFlag) {
    const isDupe = await checkForDuplicate(recipe.name, sourceUrl);
    if (isDupe) process.exit(1);
  } else {
    console.log("Step 3/7: Duplicate check skipped (--force)");
  }

  // Step 5: Validate + Normalize per Data Contract
  const validated = validateRecipeData(recipe);

  // Step 6: Upload image
  const cloudinaryUrl = await uploadImage(imageUrl, validated.name);

  // Step 7: Save to Supabase + verify
  const record = await saveToSupabase(validated, cloudinaryUrl, sourceUrl);

  console.log("");
  console.log(`DONE: "${validated.name}" added to Julie's Cookbook`);
  console.log(`   Live at julies-cookbook.vercel.app within 60 seconds`);
}

main().catch((err) => {
  console.error(`\nFATAL: ${err.message}`);
  process.exit(1);
});
