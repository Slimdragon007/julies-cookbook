import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const VALID_CUISINES = ["American", "Moroccan", "Italian", "Asian", "Mediterranean", "Other"];
const VALID_DIETARY = ["Vegetarian", "Gluten-Free", "Dairy-Free", "High Protein", "Comfort Food"];
const VALID_COOKING_UNITS = ["/tsp", "/tbsp", "/cup", "/oz", "/lb", "/each", "/can"];
const VALID_CATEGORIES = ["Produce", "Meat", "Fish", "Dairy", "Spice", "Pantry", "Grocery", "Bakery", "Other"];

const UNIT_MAP: Record<string, string> = {
  cups: "/cup", cup: "/cup",
  oz: "/oz", ounce: "/oz", ounces: "/oz",
  lb: "/lb", lbs: "/lb", pound: "/lb", pounds: "/lb",
  can: "/can", cans: "/can",
  each: "/each", whole: "/each", piece: "/each", pieces: "/each",
  cloves: "/each", clove: "/each",
  tbsp: "/tbsp", tablespoon: "/tbsp", tablespoons: "/tbsp",
  tsp: "/tsp", teaspoon: "/tsp", teaspoons: "/tsp",
};

const CUISINE_MAP: Record<string, string> = {
  "Middle Eastern": "Mediterranean",
  French: "Other", Mexican: "Other", Indian: "Other",
  Japanese: "Asian", Chinese: "Asian", Thai: "Asian", Korean: "Asian", Vietnamese: "Asian",
};

const CANONICAL_NAMES: Record<string, string> = {
  "extra-virgin olive oil": "olive oil", "extra virgin olive oil": "olive oil", "evoo": "olive oil",
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

function normalizeName(name: string): string {
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

const CATEGORY_MAP: Record<string, string> = {
  "onion": "Produce", "garlic": "Produce", "carrot": "Produce",
  "bell pepper": "Produce", "red bell pepper": "Produce", "zucchini": "Produce",
  "sweet potato": "Produce", "lemon": "Produce", "blueberry": "Produce",
  "strawberry": "Produce", "collard greens": "Produce", "broccoli": "Produce",
  "green onion": "Produce", "fresh parsley": "Produce", "fresh ginger": "Produce",
  "dried apricot": "Produce", "potato": "Produce", "tomato": "Produce", "russet potato": "Produce",
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
  "lemon juice": "Pantry", "peanut butter": "Pantry", "vanilla extract": "Pantry", "ketchup": "Pantry",
  "all-purpose flour": "Grocery", "white rice": "Grocery", "brown rice": "Grocery",
  "elbow macaroni": "Grocery", "cavatappi pasta": "Grocery", "couscous": "Grocery",
  "lentil": "Grocery", "chickpea": "Grocery", "golden raisin": "Grocery",
  "slivered almond": "Grocery", "diced tomatoes": "Grocery",
  "crushed tomatoes": "Grocery", "tomato sauce": "Grocery",
  "vegetable broth": "Grocery", "chicken broth": "Grocery", "beef broth": "Grocery",
  "water": "Grocery", "extra-firm tofu": "Grocery", "peas": "Grocery",
  "hamburger bun": "Bakery",
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
  "vanilla extract", "ketchup",
];

function assignUnit(name: string, qty: number | null, rawUnit: string | null): string {
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

const MACROS: Record<string, { per: string; cal: number; p: number; c: number; f: number }> = {
  "olive oil": { per: "tbsp", cal: 119, p: 0, c: 0, f: 14 },
  "butter": { per: "tbsp", cal: 102, p: 0, c: 0, f: 12 },
  "ground beef": { per: "lb", cal: 1152, p: 77, c: 0, f: 92 },
  "chicken breast": { per: "lb", cal: 748, p: 139, c: 0, f: 16 },
  "chicken thigh": { per: "lb", cal: 1085, p: 109, c: 0, f: 69 },
  "egg": { per: "each", cal: 72, p: 6, c: 0, f: 5 },
  "all-purpose flour": { per: "cup", cal: 455, p: 13, c: 95, f: 1 },
  "white rice": { per: "cup", cal: 675, p: 13, c: 148, f: 1 },
  "lentil": { per: "cup", cal: 678, p: 50, c: 115, f: 2 },
  "milk": { per: "cup", cal: 149, p: 8, c: 12, f: 8 },
  "cheddar cheese": { per: "cup", cal: 455, p: 28, c: 1, f: 37 },
  "salt": { per: "tsp", cal: 0, p: 0, c: 0, f: 0 },
  "black pepper": { per: "tsp", cal: 6, p: 0, c: 2, f: 0 },
  "soy sauce": { per: "tbsp", cal: 9, p: 1, c: 1, f: 0 },
  "honey": { per: "tbsp", cal: 64, p: 0, c: 17, f: 0 },
  "onion": { per: "each", cal: 44, p: 1, c: 10, f: 0 },
  "garlic": { per: "each", cal: 4, p: 0, c: 1, f: 0 },
  "sugar": { per: "tbsp", cal: 48, p: 0, c: 12, f: 0 },
};

function getUnitMultiplier(recipeUnit: string | null, refUnit: string): number {
  const u = recipeUnit?.replace("/", "") || "";
  if (u === refUnit) return 1;
  if (u === "tsp" && refUnit === "tbsp") return 1 / 3;
  if (u === "tbsp" && refUnit === "tsp") return 3;
  if (u === "cup" && refUnit === "tbsp") return 16;
  if (u === "tbsp" && refUnit === "cup") return 1 / 16;
  return 1;
}

function estimateMacros(name: string, qty: number | null, unit: string) {
  const ref = MACROS[name];
  if (!ref) return null;
  const q = qty ?? 1;
  const multiplier = getUnitMultiplier(unit, ref.per);
  const scale = q * multiplier;
  return { cal: Math.round(ref.cal * scale), p: Math.round(ref.p * scale), c: Math.round(ref.c * scale), f: Math.round(ref.f * scale) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredient = any;

interface NormalizedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  cal: number;
  pro: number;
  carb: number;
  fat: number;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authSupabase = await createSupabaseServer();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url, text: pastedText, sourceUrl: textSourceUrl } = body;

    const isTextMode = typeof pastedText === "string" && pastedText.trim().length > 0;
    const isUrlMode = typeof url === "string" && url.startsWith("http");

    if (!isTextMode && !isUrlMode) {
      return NextResponse.json({ error: "Provide a recipe URL or paste recipe text" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let source: string;
    let imageUrl: string | null = null;
    let finalSourceUrl: string;

    if (isTextMode) {
      // Text-paste mode: skip scraping, go straight to extraction
      source = pastedText.trim().slice(0, 15000);
      finalSourceUrl = textSourceUrl || "manual entry";
    } else {
      // URL mode: scrape the page (with ScrapingBee fallback for Cloudflare)
      finalSourceUrl = url;

      let html: string;
      const directRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      if (directRes.status === 403) {
        // Direct fetch blocked — try ScrapingBee
        const sbKey = process.env.SCRAPINGBEE_API_KEY;
        if (!sbKey) {
          return NextResponse.json({ blocked: true, url }, { status: 422 });
        }

        const sbUrl = `https://app.scrapingbee.com/api/v1?${new URLSearchParams({
          api_key: sbKey,
          url: url,
          render_js: "true",
          premium_proxy: "true",
        })}`;

        const sbRes = await fetch(sbUrl);
        if (!sbRes.ok) {
          return NextResponse.json({ blocked: true, url }, { status: 422 });
        }

        html = await sbRes.text();
      } else {
        html = await directRes.text();
      }
      const $ = cheerio.load(html);

      let jsonLd: Record<string, unknown> | null = null;
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "");
          const items = Array.isArray(data) ? data : data["@graph"] || [data];
          for (const item of items) {
            if (item["@type"] === "Recipe" || (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))) {
              jsonLd = item;
            }
          }
        } catch { /* ignore malformed JSON-LD */ }
      });

      $("script, style, nav, footer, header, aside").remove();
      const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 10000);

      // Extract image URL with multiple fallbacks
      if (jsonLd?.["image"]) {
        const img = jsonLd["image"];
        imageUrl = Array.isArray(img)
          ? (typeof img[0] === "string" ? img[0] : (img[0] as Record<string, string>)?.url)
          : (typeof img === "string" ? img : (img as Record<string, string>)?.url);
      }
      if (!imageUrl) {
        imageUrl = $('meta[property="og:image"]').attr("content") || null;
      }
      if (!imageUrl) {
        imageUrl = $('meta[name="twitter:image"]').attr("content") || null;
      }
      if (!imageUrl) {
        const heroImg = $("article img, .recipe img, .post img, main img").first().attr("src");
        if (heroImg) imageUrl = heroImg;
      }

      source = jsonLd ? JSON.stringify(jsonLd, null, 2) : bodyText;
      if (!jsonLd && bodyText.length < 200) {
        return NextResponse.json({ error: "Could not extract content from URL" }, { status: 422 });
      }
    }

    // Step 2: Extract with Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `You are a recipe data extraction assistant. Extract structured recipe data from web content.
Return ONLY valid JSON with: name, preparation (numbered steps), servings, cookTime, prepTime, cuisineTag (one of ${JSON.stringify(VALID_CUISINES)} or null), dietaryTags (from ${JSON.stringify(VALID_DIETARY)}), ingredients array.
Each ingredient needs: name (lowercase, singular), quantity (number), unit (tsp/tbsp/cup/oz/lb/each/can), category (${VALID_CATEGORIES.join("/")}), calories, protein_g, carbs_g, fat_g (whole numbers, USDA estimates for recipe qty).
If you cannot extract a recipe, return {"name": null}.`,
      messages: [{
        role: "user",
        content: `Extract recipe data from this content. Return ONLY valid JSON.\n\nSource URL: ${finalSourceUrl}\n\nContent:\n${source}`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

    let recipe;
    try {
      recipe = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Claude returned invalid JSON" }, { status: 500 });
    }

    if (!recipe.name) {
      return NextResponse.json({ error: "Could not identify a recipe from that URL" }, { status: 422 });
    }

    // Step 3: Duplicate check (scoped to this user)
    if (finalSourceUrl !== "manual entry") {
      const { data: urlDupes } = await supabase
        .from("recipes")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("source_url", finalSourceUrl)
        .limit(1);
      if (urlDupes && urlDupes.length > 0) {
        return NextResponse.json({ error: `"${urlDupes[0].name}" already exists in your cookbook (same URL)` }, { status: 409 });
      }
    }
    const { data: nameDupes } = await supabase
      .from("recipes")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", recipe.name)
      .limit(1);
    if (nameDupes && nameDupes.length > 0) {
      return NextResponse.json({ error: `"${recipe.name}" already exists in your cookbook` }, { status: 409 });
    }

    // Step 4: Normalize ingredients
    const ingredients: NormalizedIngredient[] = (recipe.ingredients || [])
      .map((ing: RawIngredient) => {
        const name = normalizeName((ing.name || "").replace(/[""'']/g, "").trim());
        const unit = assignUnit(name, ing.quantity, ing.unit);
        let category = CATEGORY_MAP[name] || ing.category || "Other";
        if (!VALID_CATEGORIES.includes(category)) category = "Other";

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

        return {
          name,
          quantity: ing.quantity ?? 1,
          unit,
          category,
          cal: Math.round(cal ?? 0),
          pro: Math.round(pro ?? 0),
          carb: Math.round(carb ?? 0),
          fat: Math.round(fat ?? 0),
        };
      })
      .filter((ing: NormalizedIngredient) => ing.name);

    // Step 5: Map cuisine
    if (recipe.cuisineTag && !VALID_CUISINES.includes(recipe.cuisineTag)) {
      recipe.cuisineTag = CUISINE_MAP[recipe.cuisineTag] || null;
    }
    if (recipe.dietaryTags) {
      recipe.dietaryTags = recipe.dietaryTags.filter((t: string) => VALID_DIETARY.includes(t));
    }

    // Step 6: Upload image to Cloudinary (with retry)
    let cloudinaryUrl: string | null = null;
    let imageWarning: string | null = null;
    if (imageUrl && !process.env.CLOUDINARY_CLOUD_NAME) {
      console.error("[scrape] CLOUDINARY_CLOUD_NAME not set — image upload SKIPPED. Add Cloudinary env vars to Vercel.");
      imageWarning = "Image found but Cloudinary env vars are missing — image not uploaded";
    }
    if (imageUrl && process.env.CLOUDINARY_CLOUD_NAME) {
      const publicId = recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await cloudinary.uploader.upload(imageUrl, {
            folder: "julies-cookbook",
            public_id: publicId,
            overwrite: true,
          });
          cloudinaryUrl = result.secure_url;
          break;
        } catch (imgErr) {
          console.error(`[scrape] Image upload attempt ${attempt + 1} failed:`, imgErr);
        }
      }
      if (!cloudinaryUrl) {
        console.error("[scrape] Image upload failed after 2 attempts for:", imageUrl);
      }
    }

    // Step 7: Create Supabase records
    const slug = slugify(recipe.name);
    const { data: recipeRecord, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        slug,
        name: recipe.name,
        preparation: Array.isArray(recipe.preparation) ? recipe.preparation.join("\n") : recipe.preparation,
        source_url: finalSourceUrl,
        servings: typeof recipe.servings === "number" ? recipe.servings : null,
        cook_time_minutes: typeof recipe.cookTime === "number" ? recipe.cookTime : null,
        prep_time_minutes: typeof recipe.prepTime === "number" ? recipe.prepTime : null,
        cuisine_tag: recipe.cuisineTag || null,
        dietary_tags: recipe.dietaryTags?.length ? recipe.dietaryTags : [],
        image_url: cloudinaryUrl || null,
      })
      .select("id, slug")
      .single();

    if (recipeError) {
      return NextResponse.json({ error: `Failed to save recipe: ${recipeError.message}` }, { status: 500 });
    }

    const recipeId = recipeRecord.id;

    // Create ingredient records
    if (ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from("ingredients")
        .insert(
          ingredients.map((ing) => ({
            recipe_id: recipeId,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
            calories: ing.cal,
            protein_g: ing.pro,
            carbs_g: ing.carb,
            fat_g: ing.fat,
          }))
        );

      if (ingError) {
        console.error("[scrape] Ingredient save error:", ingError);
      }
    }

    return NextResponse.json({
      success: true,
      warning: imageWarning || undefined,
      recipe: {
        id: recipeId,
        slug: recipeRecord.slug,
        name: recipe.name,
        servings: recipe.servings,
        ingredientCount: ingredients.length,
        hasImage: !!cloudinaryUrl,
        cuisineTag: recipe.cuisineTag,
      },
    });
  } catch (err) {
    console.error("[scrape] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
