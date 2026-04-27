export const runtime = "edge";

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  BlockedSiteError,
  DuplicateRecipeError,
  ExtractionError,
  scrapeRecipe,
  type ScrapeInput,
} from "@/lib/scraper/core";

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createSupabaseServer();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url, text: pastedText, sourceUrl: textSourceUrl } = body;

    const isTextMode =
      typeof pastedText === "string" && pastedText.trim().length > 0;
    const isUrlMode = typeof url === "string" && url.startsWith("http");

    if (!isTextMode && !isUrlMode) {
      return NextResponse.json(
        { error: "Provide a recipe URL or paste recipe text" },
        { status: 400 },
      );
    }

    const input: ScrapeInput = isTextMode
      ? { kind: "text", text: pastedText, sourceUrl: textSourceUrl }
      : { kind: "url", url };

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

    const result = await scrapeRecipe(input, {
      supabase,
      anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
      cloudinary: cloudinaryEnv,
      userScope: { userId: user.id },
      scrapingBeeKey: process.env.SCRAPINGBEE_API_KEY,
      pexelsKey: process.env.PEXELS_API_KEY,
      usdaApiKey: process.env.USDA_API_KEY,
    });

    return NextResponse.json({
      success: true,
      recipe: {
        id: result.recipeId,
        slug: result.slug,
        name: result.name,
        servings: result.servings,
        ingredientCount: result.ingredientCount,
        hasImage: !!result.imageUrl,
        cuisineTag: result.cuisineTag,
      },
    });
  } catch (err) {
    if (err instanceof BlockedSiteError) {
      return NextResponse.json(
        { blocked: true, url: err.url, reason: err.reason },
        { status: 422 },
      );
    }
    if (err instanceof DuplicateRecipeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ExtractionError) {
      const status = err.message.includes("timed out") ? 504 : 422;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("[scrape] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
