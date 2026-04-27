// Recipe scraper CLI — thin wrapper around src/lib/scraper/core.ts.
// Both this CLI and src/app/api/scrape/route.ts call scrapeRecipe() so there
// is exactly one path through the scraper logic. See ADR-002.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  BlockedSiteError,
  DuplicateRecipeError,
  ExtractionError,
  scrapeRecipe,
  type ScrapeInput,
} from "@/lib/scraper/core";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("PREFLIGHT FAILED: Missing env vars:", missing.join(", "));
    process.exit(1);
  }
  if (!process.env.SCRAPINGBEE_API_KEY) {
    console.log(
      "   Note: SCRAPINGBEE_API_KEY not set. Cloudflare-blocked sites will need manual fallback.",
    );
  }
}

function printUsage(): void {
  console.log("Julie's Cookbook -- Recipe Scraper");
  console.log("================================");
  console.log("");
  console.log("Usage:");
  console.log("  npm run scrape <recipe-url>              # Scrape from URL");
  console.log(
    "  npm run scrape -- --file recipe.txt      # Extract from text file",
  );
  console.log(
    "  npm run scrape <url> --force             # Skip duplicate check",
  );
  console.log("");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");
  const fileFlag = args.includes("--file");
  const positional = args.find((a) => !a.startsWith("--"));

  if (!positional && !fileFlag) {
    printUsage();
    process.exit(0);
  }

  validateEnv();

  let input: ScrapeInput;
  if (fileFlag) {
    const filePath = args[args.indexOf("--file") + 1];
    if (!filePath) {
      console.error("Provide a file path: npm run scrape -- --file recipe.txt");
      process.exit(1);
    }
    console.log(`Reading recipe from file: ${filePath}`);
    input = {
      kind: "text",
      text: readFileSync(filePath, "utf-8"),
      sourceUrl: "manual entry",
    };
  } else if (positional?.startsWith("http")) {
    input = { kind: "url", url: positional };
  } else {
    console.error("Provide a URL or use --file flag");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const cloudinaryEnv =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
      ? {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY,
          apiSecret: process.env.CLOUDINARY_API_SECRET,
        }
      : null;

  if (!cloudinaryEnv) {
    console.warn(
      "   Note: Cloudinary env vars missing — image upload will be skipped.",
    );
  }

  try {
    const result = await scrapeRecipe(input, {
      supabase,
      anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
      cloudinary: cloudinaryEnv,
      // No userScope — CLI writes as service role with no user_id column.
      scrapingBeeKey: process.env.SCRAPINGBEE_API_KEY,
      pexelsKey: process.env.PEXELS_API_KEY,
      usdaApiKey: process.env.USDA_API_KEY,
      forceSkipDupCheck: forceFlag,
    });

    console.log("");
    console.log(`DONE: "${result.name}" added to Julie's Cookbook`);
    console.log(`   ID: ${result.recipeId}`);
    console.log(`   Slug: ${result.slug}`);
    console.log(`   Image: ${result.imageUrl ? "yes" : "no"}`);
    console.log(`   Servings: ${result.servings ?? "?"}`);
    console.log(`   Ingredients: ${result.ingredientCount}`);
    console.log(`   Method: ${result.ctx.method}`);
    if (result.ctx.errors.length) {
      console.log(`   Notes: ${result.ctx.errors.join("; ")}`);
    }
  } catch (err) {
    if (err instanceof BlockedSiteError) {
      console.error("");
      console.error(`Blocked: ${err.url}`);
      console.error(`   Reason: ${err.reason}`);
      if (!process.env.SCRAPINGBEE_API_KEY) {
        console.error("");
        console.error("   AUTO-FIX: Add SCRAPINGBEE_API_KEY to .env.local");
        console.error(
          "   Get a free key at https://www.scrapingbee.com (1,000 calls/month free)",
        );
      }
      console.error("");
      console.error("   Manual workaround:");
      console.error("   1. Open the URL in your browser");
      console.error("   2. Select all text (Cmd+A), copy (Cmd+C)");
      console.error("   3. Paste into a file: pbpaste > ~/Desktop/recipe.txt");
      console.error("   4. Run: npm run scrape -- --file ~/Desktop/recipe.txt");
      process.exit(1);
    }
    if (err instanceof DuplicateRecipeError) {
      console.error(`DUPLICATE CHECK FAILED: ${err.message}`);
      console.error(
        "   Use --force to add anyway, or update the existing record manually.",
      );
      process.exit(1);
    }
    if (err instanceof ExtractionError) {
      console.error(`EXTRACTION FAILED: ${err.message}`);
      process.exit(1);
    }
    console.error(
      `\nFATAL: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

main();
