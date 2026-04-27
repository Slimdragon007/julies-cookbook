import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cuisine } from "./contracts";
import { uploadToCloudinary, type CloudinaryEnv } from "./cloudinary";
import {
  extractRawRecipe,
  normalizeIngredients,
  normalizeRecipeShape,
} from "./extract";
import { slugify } from "./normalize";
import {
  fetchPageWithFallback,
  findPexelsFallbackImage,
  getDomain,
  parseRecipeHtml,
} from "./parse";
import { persistRecipe, type UserScope } from "./persist";

export { DuplicateRecipeError } from "./persist";

export type ScrapeInput =
  | { kind: "url"; url: string }
  | { kind: "text"; text: string; sourceUrl?: string };

export interface ScrapeContext {
  method: "direct" | "scrapingbee" | "text-paste";
  contentFormat: "json-ld" | "body-text" | "user-pasted";
  fetchAttempts: number;
  errors: string[];
  circuitBreakerTripped: boolean;
  contentLengthChars: number;
  hadImage: boolean;
  domain: string | null;
}

export interface ScrapeOptions {
  supabase: SupabaseClient;
  anthropic: Anthropic;
  cloudinary?: CloudinaryEnv | null;
  userScope?: UserScope;
  scrapingBeeKey?: string;
  pexelsKey?: string;
  usdaApiKey?: string;
  forceSkipDupCheck?: boolean;
}

export interface ScrapeResult {
  recipeId: string;
  slug: string;
  name: string;
  ingredientCount: number;
  imageUrl: string | null;
  servings: number | null;
  cuisineTag: Cuisine | null;
  ctx: ScrapeContext;
}

export class BlockedSiteError extends Error {
  constructor(
    public url: string,
    public reason: string,
    public ctx: ScrapeContext,
  ) {
    super(`Blocked: ${url} (${reason})`);
    this.name = "BlockedSiteError";
  }
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

function buildContextBrief(ctx: ScrapeContext): string {
  const lines: string[] = [];
  lines.push(`Acquisition method: ${ctx.method}`);
  lines.push(`Content format: ${ctx.contentFormat}`);
  if (ctx.fetchAttempts > 1) {
    lines.push(
      `Fetch attempts: ${ctx.fetchAttempts} (retried due to failures)`,
    );
  }
  if (ctx.circuitBreakerTripped) {
    lines.push(
      "Circuit breaker was tripped — this domain has recently blocked direct requests",
    );
  }
  if (ctx.errors.length > 0) {
    lines.push(`Issues encountered: ${ctx.errors.join("; ")}`);
  }
  lines.push(`Content length: ${ctx.contentLengthChars} chars`);

  if (ctx.method === "scrapingbee") {
    lines.push(
      "NOTE: Content was fetched via proxy (ScrapingBee) because the site blocked direct access. The HTML may include rendered JavaScript content.",
    );
  }
  if (ctx.method === "text-paste") {
    lines.push(
      "NOTE: This is user-pasted text, likely copied from a recipe website or a physical cookbook. Be thorough but lenient — extract the recipe even if formatting is messy or incomplete.",
    );
  }
  if (ctx.contentFormat === "body-text") {
    lines.push(
      "NOTE: No structured JSON-LD recipe data was found. Focus on identifying the core recipe structure (title, ingredients list, instructions).",
    );
  }
  return lines.join("\n");
}

export async function scrapeRecipe(
  input: ScrapeInput,
  opts: ScrapeOptions,
): Promise<ScrapeResult> {
  const ctx: ScrapeContext = {
    method: "direct",
    contentFormat: "body-text",
    fetchAttempts: 0,
    errors: [],
    circuitBreakerTripped: false,
    contentLengthChars: 0,
    hadImage: false,
    domain: null,
  };

  let source: string;
  let imageUrl: string | null = null;
  let sourceUrl: string;

  if (input.kind === "text") {
    source = input.text.trim().slice(0, 15000);
    sourceUrl = input.sourceUrl ?? "manual entry";
    ctx.method = "text-paste";
    ctx.contentFormat = "user-pasted";
    ctx.contentLengthChars = source.length;
  } else {
    sourceUrl = input.url;
    ctx.domain = getDomain(input.url);
    const fetchResult = await fetchPageWithFallback(input.url, {
      scrapingBeeKey: opts.scrapingBeeKey,
    });
    ctx.fetchAttempts = fetchResult.fetchAttempts;
    ctx.circuitBreakerTripped = fetchResult.circuitBreakerTripped;
    ctx.errors.push(...fetchResult.errors);
    if (fetchResult.method === "scrapingbee") ctx.method = "scrapingbee";
    if (fetchResult.method === "blocked" || !fetchResult.html) {
      throw new BlockedSiteError(
        input.url,
        fetchResult.errors.join("; ") || "Blocked",
        ctx,
      );
    }

    const parsed = parseRecipeHtml(fetchResult.html);
    imageUrl = parsed.imageUrl;
    ctx.hadImage = !!imageUrl;
    ctx.contentFormat = parsed.jsonLd ? "json-ld" : "body-text";
    source = parsed.jsonLd
      ? JSON.stringify(parsed.jsonLd, null, 2)
      : parsed.bodyText;
    ctx.contentLengthChars = source.length;

    if (!parsed.jsonLd && parsed.bodyText.length < 200) {
      throw new ExtractionError("Could not extract content from URL");
    }
  }

  // Anthropic extraction
  let raw;
  try {
    raw = await extractRawRecipe(source, sourceUrl, opts.anthropic, {
      contextBrief: buildContextBrief(ctx),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ExtractionError(
        "AI extraction timed out — try pasting the recipe text instead",
      );
    }
    if (err instanceof SyntaxError) {
      throw new ExtractionError("Claude returned invalid JSON");
    }
    throw err;
  }

  if (!raw.name) {
    throw new ExtractionError("Could not identify a recipe from that URL");
  }

  // Ingredient normalization (parallel USDA → Claude → fallback)
  const ingredients = await normalizeIngredients(raw.ingredients, {
    usdaApiKey: opts.usdaApiKey,
  });
  const recipe = normalizeRecipeShape(raw, ingredients);

  // Pexels fallback if no image was scraped
  if (!imageUrl && opts.pexelsKey) {
    const pexelsImg = await findPexelsFallbackImage(
      recipe.name,
      opts.pexelsKey,
    );
    if (pexelsImg) {
      imageUrl = pexelsImg;
      ctx.errors.push(
        "Image sourced from Pexels (no image found on recipe page)",
      );
    }
  }

  // Cloudinary upload (only if env provided AND we have an image).
  // Namespace public_id by user when scoped, so two users with the same recipe
  // name don't overwrite each other's assets in the shared bucket.
  let finalImageUrl: string | null = null;
  if (imageUrl && opts.cloudinary) {
    const slug = slugify(recipe.name);
    const publicId = opts.userScope ? `${opts.userScope.userId}/${slug}` : slug;
    finalImageUrl = await uploadToCloudinary(
      imageUrl,
      publicId,
      opts.cloudinary,
    );
  }

  // Persist
  const result = await persistRecipe(recipe, {
    supabase: opts.supabase,
    userScope: opts.userScope,
    sourceUrl,
    imageUrl: finalImageUrl,
    forceSkipDupCheck: opts.forceSkipDupCheck,
  });

  return {
    recipeId: result.recipeId,
    slug: result.slug,
    name: recipe.name,
    ingredientCount: result.ingredientCount,
    imageUrl: finalImageUrl,
    servings: recipe.servings,
    cuisineTag: recipe.cuisineTag,
    ctx,
  };
}
