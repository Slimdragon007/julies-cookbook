export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadFileToCloudinary } from "@/lib/scraper/cloudinary";
import { slugify } from "@/lib/scraper/normalize";
import { logInfo, logError } from "@/lib/logger";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB — comfortable for phone photos
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createSupabaseServer();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Image hosting not configured" },
        { status: 503 },
      );
    }

    const form = await req.formData();
    const recipeId = form.get("recipeId");
    const file = form.get("file");

    if (typeof recipeId !== "string" || !recipeId) {
      return NextResponse.json({ error: "recipeId required" }, { status: 400 });
    }
    // File extends Blob in browsers and edge runtimes; checking Blob covers
    // both. The File constructor isn't always present in edge runtime types.
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `Image too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)`,
        },
        { status: 413 },
      );
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${file.type}` },
        { status: 415 },
      );
    }

    // Verify ownership and fetch the slug for the public_id namespace.
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id, name, slug")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .single();
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const slug =
      (recipe as { slug?: string }).slug ??
      slugify((recipe as { name: string }).name);
    const publicId = `${user.id}/${slug}`;

    const newUrl = await uploadFileToCloudinary(file, publicId, {
      cloudName,
      apiKey,
      apiSecret,
    });
    if (!newUrl) {
      logError("Photo upload — Cloudinary returned no URL", null, {
        route: "/api/recipe/photo",
        userId: user.id,
        recipeId,
      });
      return NextResponse.json({ error: "Upload failed" }, { status: 502 });
    }

    const { error: updateError } = await supabase
      .from("recipes")
      .update({ image_url: newUrl })
      .eq("id", recipeId)
      .eq("user_id", user.id);
    if (updateError) {
      logError("Photo upload — DB update failed", updateError, {
        route: "/api/recipe/photo",
        userId: user.id,
        recipeId,
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    logInfo("Recipe photo replaced", {
      route: "/api/recipe/photo",
      userId: user.id,
      recipeId,
    });
    return NextResponse.json({ success: true, imageUrl: newUrl });
  } catch (err) {
    logError("Recipe photo POST error", err, {
      route: "/api/recipe/photo",
      action: "POST",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
