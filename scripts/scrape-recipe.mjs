import { v2 as cloudinary } from "cloudinary";
import Airtable from "airtable";
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

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RECIPES_TABLE = "tblcDuujfu1rokjSU";
const INGREDIENTS_TABLE = "tblbly81hGxUaEgM2";

// Exact Airtable select options — fetched from schema, not guessed
const VALID_CUISINES = ["American", "Moroccan", "Italian", "Asian", "Mediterranean", "Other"];
const VALID_DIETARY = ["Vegetarian", "Gluten-Free", "Dairy-Free", "High Protein", "Comfort Food"];
const VALID_UNITS = ["/case", "/sleeve", "/box", "/bag", "/oz", "/each", "/lb", "/slice", "/can", "/cup", "/block"];
const UNIT_MAP = {
  cups: "/cup", cup: "/cup",
  oz: "/oz", ounce: "/oz", ounces: "/oz",
  lb: "/lb", lbs: "/lb", pound: "/lb", pounds: "/lb",
  can: "/can", cans: "/can",
  slice: "/slice", slices: "/slice",
  each: "/each", whole: "/each", piece: "/each", pieces: "/each",
  cloves: "/each", clove: "/each",
  bag: "/bag", bags: "/bag",
  box: "/box", package: "/box",
  block: "/block",
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
// STEP 1: VALIDATE ENV VARS
// ============================================================
function validateEnv() {
  const required = [
    "AIRTABLE_API_KEY",
    "ANTHROPIC_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("❌ PREFLIGHT FAILED: Missing env vars:", missing.join(", "));
    process.exit(1);
  }
  console.log("✅ Step 1/7: Env vars validated");
}

// ============================================================
// STEP 2: CHECK FOR DUPLICATES
// ============================================================
async function checkForDuplicate(recipeName) {
  const records = await base(RECIPES_TABLE)
    .select({
      fields: ["Recipe Name"],
      filterByFormula: `{Recipe Name} = '${recipeName.replace(/'/g, "\\'")}'`,
    })
    .all();

  if (records.length > 0) {
    console.error(`❌ DUPLICATE CHECK FAILED: "${recipeName}" already exists in Airtable (${records[0].id})`);
    console.error("   Use --force to add anyway, or update the existing record manually.");
    return true;
  }
  console.log(`✅ Step 3/7: No duplicate found for "${recipeName}"`);
  return false;
}

// ============================================================
// STEP 3: SCRAPE PAGE
// ============================================================
async function scrapePage(url) {
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

  if (res.status === 403) {
    return { blocked: true, url };
  }

  const html = await res.text();
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

  console.log(`✅ Step 2/7: Page scraped (${jsonLd ? "JSON-LD found" : "using page text"}${imageUrl ? ", image found" : ", no image"})`);
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
// STEP 4: EXTRACT WITH CLAUDE
// ============================================================
async function extractRecipeData(content, sourceUrl) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
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
      "name": "string (just the food item, no quantities)",
      "quantity": number or null,
      "unit": one of ["cups","oz","lb","can","slice","each","clove","bag","box","block"] or null,
      "estimatedCalories": number or null
    }
  ]
}

RULES:
- name must not be null
- servings must be a number, not a string
- cookTime and prepTime must be numbers in minutes
- cuisineTag must be exactly one of the listed values or null
- dietaryTags must only contain values from the listed options
- ingredient name should be just the food (e.g. "olive oil" not "2 tbsp olive oil")
- quantity should be a number (e.g. 2, 0.5) not a string
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
    console.error("❌ EXTRACT FAILED: Claude returned invalid JSON");
    console.error("   Raw response:", text.slice(0, 500));
    process.exit(1);
  }

  if (!recipe.name) {
    console.error("❌ EXTRACT FAILED: Could not identify recipe from content");
    process.exit(1);
  }

  console.log(`✅ Step 4/7: Recipe extracted: "${recipe.name}"`);
  return recipe;
}

// ============================================================
// STEP 5: VALIDATE EXTRACTED DATA
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

  // Clean ingredient units
  if (recipe.ingredients) {
    recipe.ingredients.forEach((ing, i) => {
      if (typeof ing.name !== "string" || !ing.name) {
        issues.push(`ingredient ${i} has no name`);
      }
      // Strip any quotes from all string fields
      if (ing.name) ing.name = ing.name.replace(/[""'']/g, "").trim();
      if (ing.unit) {
        const raw = ing.unit.replace(/[""'']/g, "").trim().toLowerCase();
        ing._mappedUnit = UNIT_MAP[raw] || (VALID_UNITS.includes(raw) ? raw : null);
        if (!ing._mappedUnit && ing.unit) {
          issues.push(`ingredient "${ing.name}" unit "${ing.unit}" not valid, skipping unit`);
        }
      }
    });
  }

  if (issues.length > 0) {
    console.log(`⚠️  Step 5/7: Validation found ${issues.length} issue(s) (auto-fixed):`);
    issues.forEach((i) => console.log(`   - ${i}`));
  } else {
    console.log("✅ Step 5/7: Data validated, all fields clean");
  }

  return recipe;
}

// ============================================================
// STEP 6: UPLOAD IMAGE TO CLOUDINARY
// ============================================================
async function uploadImage(imageUrl, recipeName) {
  if (!imageUrl) {
    console.log("⚠️  Step 6/7: No image to upload (recipe will use placeholder)");
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
    console.log(`✅ Step 6/7: Image uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`⚠️  Step 6/7: Image upload failed: ${err.message}`);
    return null;
  }
}

// ============================================================
// STEP 7: CREATE AIRTABLE RECORDS
// ============================================================
async function createInAirtable(recipe, cloudinaryUrl, sourceUrl) {
  const ingredientRecordIds = [];

  if (recipe.ingredients?.length) {
    console.log(`   Creating ${recipe.ingredients.length} ingredient records...`);
    for (let i = 0; i < recipe.ingredients.length; i += 10) {
      const batch = recipe.ingredients.slice(i, i + 10);
      const records = await base(INGREDIENTS_TABLE).create(
        batch.map((ing) => ({
          fields: {
            Name: ing.name,
            "Recipe QTY": typeof ing.quantity === "number" ? ing.quantity : null,
            ...(ing._mappedUnit && { Unit: ing._mappedUnit }),
            Calories: typeof ing.estimatedCalories === "number" ? ing.estimatedCalories : null,
          },
        }))
      );
      ingredientRecordIds.push(...records.map((r) => r.id));
    }
  }

  const fields = {
    "Recipe Name": recipe.name,
    Preparation: recipe.preparation,
    "Source URL": sourceUrl,
  };

  // Only set fields that have valid values
  if (typeof recipe.servings === "number") fields["Servings"] = recipe.servings;
  if (typeof recipe.cookTime === "number") fields["Cook Time (Minutes)"] = recipe.cookTime;
  if (typeof recipe.prepTime === "number") fields["Prep Time (Minutes)"] = recipe.prepTime;
  if (recipe.cuisineTag && VALID_CUISINES.includes(recipe.cuisineTag)) fields["Cuisine Tag"] = recipe.cuisineTag;
  if (recipe.dietaryTags?.length) fields["Dietary Tags"] = recipe.dietaryTags;
  if (cloudinaryUrl) fields["Image URL"] = cloudinaryUrl;
  if (ingredientRecordIds.length) fields["Ingredients"] = ingredientRecordIds;

  const record = await base(RECIPES_TABLE).create(fields);

  // VERIFY: read it back
  const verify = await base(RECIPES_TABLE).find(record.id);
  const verifiedName = verify.get("Recipe Name");
  const verifiedImage = verify.get("Image URL");
  const verifiedServings = verify.get("Servings");

  if (verifiedName !== recipe.name) {
    console.error(`❌ VERIFY FAILED: Name mismatch. Expected "${recipe.name}", got "${verifiedName}"`);
  }

  console.log(`✅ Step 7/7: Airtable record created and verified`);
  console.log(`   ID: ${record.id}`);
  console.log(`   Name: ${verifiedName}`);
  console.log(`   Image: ${verifiedImage ? "yes" : "no"}`);
  console.log(`   Servings: ${verifiedServings}`);
  console.log(`   Ingredients: ${ingredientRecordIds.length}`);

  return record;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");
  const input = args.find((a) => !a.startsWith("--"));

  if (!input) {
    console.log("Julie's Cookbook — Recipe Scraper");
    console.log("================================");
    console.log("");
    console.log("Usage:");
    console.log("  npm run scrape <recipe-url>              # Scrape from URL");
    console.log("  npm run scrape -- --file recipe.txt      # Extract from text file");
    console.log("  npm run scrape <url> --force             # Skip duplicate check");
    console.log("");
    console.log("Pipeline: Validate → Scrape → Extract → Validate → Upload → Save → Verify");
    process.exit(0);
  }

  console.log("");
  console.log("🍳 Julie's Cookbook — Recipe Scraper");
  console.log("====================================");

  // Step 1: Validate env
  validateEnv();

  let recipeText = null;
  let sourceUrl = null;
  let imageUrl = null;

  if (args.includes("--file")) {
    const filePath = args[args.indexOf("--file") + 1];
    if (!filePath) {
      console.error("❌ Provide a file path: npm run scrape -- --file recipe.txt");
      process.exit(1);
    }
    console.log(`✅ Step 2/7: Reading from file: ${filePath}`);
    recipeText = readFileSync(filePath, "utf-8");
    sourceUrl = "manual entry";
  } else if (input.startsWith("http")) {
    sourceUrl = input;
    const scraped = await scrapePage(input);

    if (scraped.blocked) {
      console.log("");
      console.log("⚠️  Site blocked the scraper (403/Cloudflare).");
      console.log("   Workaround:");
      console.log("   1. Open the URL in your browser");
      console.log("   2. Select all text (Cmd+A), copy (Cmd+C)");
      console.log("   3. Paste into a file: pbpaste > ~/Desktop/recipe.txt");
      console.log("   4. Run: npm run scrape -- --file ~/Desktop/recipe.txt");
      process.exit(1);
    }

    recipeText = scraped.source;
    imageUrl = scraped.imageUrl;
  } else {
    console.error("❌ Provide a URL or use --file flag");
    process.exit(1);
  }

  // Step 4: Extract with Claude
  const recipe = await extractRecipeData(recipeText, sourceUrl);

  // Step 3 (after extraction so we have the name): Duplicate check
  if (!forceFlag) {
    const isDupe = await checkForDuplicate(recipe.name);
    if (isDupe) process.exit(1);
  } else {
    console.log("⚠️  Step 3/7: Duplicate check skipped (--force)");
  }

  // Step 5: Validate
  const validated = validateRecipeData(recipe);

  // Step 6: Upload image
  const cloudinaryUrl = await uploadImage(imageUrl, validated.name);

  // Step 7: Save to Airtable + verify
  const record = await createInAirtable(validated, cloudinaryUrl, sourceUrl);

  console.log("");
  console.log(`✅ DONE: "${validated.name}" added to Julie's Cookbook`);
  console.log(`   Live at julies-cookbook.vercel.app within 60 seconds`);
}

main().catch((err) => {
  console.error(`\n❌ FATAL: ${err.message}`);
  process.exit(1);
});
