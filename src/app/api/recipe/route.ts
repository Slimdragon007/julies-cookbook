export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";

// PATCH — update a recipe
export async function PATCH(req: NextRequest) {
  try {
    const authSupabase = await createSupabaseServer();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: "Recipe ID required" }, { status: 400 });

    // Map frontend field names to database columns
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.servings !== undefined) dbUpdates.servings = updates.servings;
    if (updates.prepTime !== undefined) dbUpdates.prep_time_minutes = updates.prepTime;
    if (updates.cookTime !== undefined) dbUpdates.cook_time_minutes = updates.cookTime;
    if (updates.cuisineTag !== undefined) dbUpdates.cuisine_tag = updates.cuisineTag;
    if (updates.dietaryTags !== undefined) dbUpdates.dietary_tags = updates.dietaryTags;

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Verify ownership before updating
    const { data: existing } = await supabase
      .from("recipes").select("id").eq("id", id).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    const { error } = await supabase
      .from("recipes")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logError("Recipe update failed", error, { route: "/api/recipe", userId: user.id, action: "PATCH", recipeId: id });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logInfo("Recipe updated", { route: "/api/recipe", userId: user.id, action: "PATCH", recipeId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    logError("Recipe PATCH error", err, { route: "/api/recipe", action: "PATCH" });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE — delete a recipe and its ingredients
export async function DELETE(req: NextRequest) {
  try {
    const authSupabase = await createSupabaseServer();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Recipe ID required" }, { status: 400 });

    // Verify ownership before deleting
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    // Delete related data first (food_log + ingredients)
    await supabase.from("food_log").delete().eq("recipe_id", id);
    await supabase.from("ingredients").delete().eq("recipe_id", id);

    // Delete recipe
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      logError("Recipe delete failed", error, { route: "/api/recipe", userId: user.id, action: "DELETE", recipeId: id });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logInfo("Recipe deleted", { route: "/api/recipe", userId: user.id, action: "DELETE", recipeId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    logError("Recipe DELETE error", err, { route: "/api/recipe", action: "DELETE" });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
