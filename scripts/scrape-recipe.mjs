import { v2 as cloudinary } from "cloudinary";
import Airtable from "airtable";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

// --- Config ---
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

// --- Scrape the page ---
async function scrapePage(url) {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  console.log(`Status: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Try to find JSON-LD structured data (most recipe sites have this)
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

  // Get the raw text as fallback
  // Remove scripts, styles, nav, footer to get cleaner text
  $("script, style, nav, footer, header, aside").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 10000);

  // Find the best image
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

  return { jsonLd, bodyText, imageUrl, url, blocked: res.status === 403 };
}

// --- Use Claude to extract structured recipe data ---
async function extractRecipeData(input, sourceUrl) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Extract recipe data from this content. Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
{
  "name": "Recipe Name",
  "preparation": "Full step-by-step instructions as plain text, numbered",
  "servings": number or null,
  "cookTime": number in minutes or null,
  "prepTime": number in minutes or null,
  "cuisineTag": one of ["American", "Mexican", "Italian", "Asian", "Mediterranean", "Middle Eastern", "Indian", "French", "Other"] or null,
  "dietaryTags": array of ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb", "Healthy"] that apply, or empty array,
  "ingredients": [
    {
      "name": "ingredient name (just the food item)",
      "quantity": number or null,
      "unit": one of ["cups", "tbsp", "tsp", "oz", "lbs", "g", "ml", "whole", "cloves", "slices", "pieces", "pinch", "bunch", "can", "package"] or null,
      "estimatedCalories": estimated calories for this amount (number) or null
    }
  ]
}

If you cannot extract a recipe, set name to null.

Source URL: ${sourceUrl}

Content:
${input}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  // Handle both raw JSON and markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

// --- Upload image to Cloudinary ---
async function uploadImage(imageUrl, recipeName) {
  if (!imageUrl) return null;

  const publicId = recipeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  console.log(`Uploading image to Cloudinary...`);
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "julies-cookbook",
      public_id: publicId,
      overwrite: true,
    });
    console.log(`  -> ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`  Image upload failed: ${err.message}`);
    return null;
  }
}

// --- Clean string values (remove smart quotes, trim) ---
function cleanStr(s) {
  if (!s || typeof s !== "string") return s;
  return s
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, "")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "")
    .replace(/^["']+|["']+$/g, "")
    .replace(/"/g, function(m, offset, str) {
      // Remove quotes that wrap the entire value
      if (offset === 0 || offset === str.length - 1) return "";
      return m;
    })
    .trim();
}

// --- Create Airtable records ---
async function createRecipeInAirtable(recipe, cloudinaryUrl, sourceUrl) {
  const ingredientRecordIds = [];

  // Valid Airtable select options for Unit field (exact Airtable values)
  const VALID_UNITS = ["/case", "/sleeve", "/box", "/bag", "/oz", "/each", "/lb", "/slice", "/can", "/cup", "/block"];
  // Map common unit names to Airtable select options
  const UNIT_MAP = {
    cups: "/cup", cup: "/cup",
    oz: "/oz", ounce: "/oz", ounces: "/oz",
    lb: "/lb", lbs: "/lb", pound: "/lb", pounds: "/lb",
    can: "/can", cans: "/can",
    slice: "/slice", slices: "/slice",
    each: "/each", whole: "/each", piece: "/each", pieces: "/each", cloves: "/each", clove: "/each",
    bag: "/bag", bags: "/bag",
    box: "/box", package: "/box",
    block: "/block",
  };

  if (recipe.ingredients?.length) {
    console.log(`Creating ${recipe.ingredients.length} ingredient records...`);
    for (let i = 0; i < recipe.ingredients.length; i += 10) {
      const batch = recipe.ingredients.slice(i, i + 10);
      const records = await base(INGREDIENTS_TABLE).create(
        batch.map((ing) => {
          const rawUnit = cleanStr(ing.unit)?.toLowerCase();
          const validUnit = rawUnit ? (UNIT_MAP[rawUnit] || (VALID_UNITS.includes(rawUnit) ? rawUnit : null)) : null;
          return {
            fields: {
              Name: cleanStr(ing.name),
              "Recipe QTY": ing.quantity,
              ...(validUnit && { Unit: validUnit }),
              Calories: ing.estimatedCalories,
            },
          };
        })
      );
      ingredientRecordIds.push(...records.map((r) => r.id));
    }
  }

  console.log(`Creating recipe record: ${recipe.name}`);
  const fields = {
    "Recipe Name": cleanStr(recipe.name),
    Preparation: cleanStr(recipe.preparation),
    Servings: recipe.servings,
    "Cook Time (Minutes)": recipe.cookTime,
    "Prep Time (Minutes)": recipe.prepTime,
    "Source URL": sourceUrl,
  };

  // Map to valid Airtable select options
  const VALID_CUISINES = ["American", "Moroccan", "Italian", "Asian", "Mediterranean", "Other"];
  const CUISINE_MAP = { "Middle Eastern": "Other", French: "Other", Mexican: "Other", Indian: "Other" };
  if (recipe.cuisineTag) {
    const mapped = CUISINE_MAP[recipe.cuisineTag] || recipe.cuisineTag;
    if (VALID_CUISINES.includes(mapped)) fields["Cuisine Tag"] = mapped;
  }
  const VALID_DIETARY = ["Vegetarian", "Gluten-Free", "Dairy-Free", "High Protein", "Comfort Food"];
  if (recipe.dietaryTags?.length) {
    const validTags = recipe.dietaryTags.filter((t) => VALID_DIETARY.includes(t));
    if (validTags.length) fields["Dietary Tags"] = validTags;
  }
  if (cloudinaryUrl) fields["Image URL"] = cloudinaryUrl;
  if (ingredientRecordIds.length) fields["Ingredients"] = ingredientRecordIds;

  const recipeRecord = await base(RECIPES_TABLE).create(fields);
  return recipeRecord;
}

// --- Main ---
async function main() {
  const input = process.argv[2];
  if (!input) {
    console.log("Usage:");
    console.log("  npm run scrape <recipe-url>          # Scrape from URL");
    console.log("  npm run scrape -- --file recipe.txt   # Extract from text file");
    console.log("  npm run scrape -- --paste             # Paste recipe text interactively");
    console.log("");
    console.log("Examples:");
    console.log("  npm run scrape https://cooking.nytimes.com/recipes/...");
    console.log("  npm run scrape -- --file ~/Desktop/recipe.txt");
    process.exit(1);
  }

  // Validate required env vars
  const required = [
    "AIRTABLE_API_KEY",
    "ANTHROPIC_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  let recipeText = null;
  let sourceUrl = null;
  let imageUrl = null;

  if (input === "--file") {
    // Read recipe from a text file
    const filePath = process.argv[3];
    if (!filePath) {
      console.error("Provide a file path: npm run scrape -- --file recipe.txt");
      process.exit(1);
    }
    console.log(`Reading recipe from file: ${filePath}`);
    recipeText = readFileSync(filePath, "utf-8");
    sourceUrl = "manual entry";
  } else if (input.startsWith("http")) {
    // Try scraping the URL
    sourceUrl = input;
    const scraped = await scrapePage(input);

    if (scraped.jsonLd) {
      console.log("Found JSON-LD structured recipe data");
      recipeText = JSON.stringify(scraped.jsonLd, null, 2);
    } else if (!scraped.blocked && scraped.bodyText.length > 200) {
      console.log("No JSON-LD, using page text");
      recipeText = scraped.bodyText;
    } else {
      console.log("\n⚠️  Site blocked the scraper (403/Cloudflare protection).");
      console.log("Options:");
      console.log("  1. Open the URL in your browser, select all text (Cmd+A), copy it");
      console.log("  2. Paste it into a text file (e.g. ~/Desktop/recipe.txt)");
      console.log(`  3. Run: npm run scrape -- --file ~/Desktop/recipe.txt`);
      console.log(`\nOr provide the URL to Claude Code and ask it to scrape with WebFetch.`);
      process.exit(1);
    }

    imageUrl = scraped.imageUrl;
  } else {
    console.error("Provide a URL or use --file flag");
    process.exit(1);
  }

  try {
    // Extract with Claude
    console.log("Extracting recipe data with Claude...");
    const recipe = await extractRecipeData(recipeText, sourceUrl);

    if (!recipe.name) {
      console.error("Could not extract recipe data from the content.");
      process.exit(1);
    }

    console.log(`\nRecipe: ${recipe.name}`);
    console.log(`  Servings: ${recipe.servings}, Prep: ${recipe.prepTime}m, Cook: ${recipe.cookTime}m`);
    console.log(`  Cuisine: ${recipe.cuisineTag}, Tags: ${recipe.dietaryTags?.join(", ") || "none"}`);
    console.log(`  Ingredients: ${recipe.ingredients?.length || 0}`);

    // Upload image
    const cloudinaryUrl = await uploadImage(imageUrl, recipe.name);

    // Save to Airtable
    const record = await createRecipeInAirtable(recipe, cloudinaryUrl, sourceUrl);
    console.log(`\n✅ Recipe "${recipe.name}" added! Airtable ID: ${record.id}`);
    console.log(`It will appear on julies-cookbook.vercel.app within 60 seconds.`);
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

main();
