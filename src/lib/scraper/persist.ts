import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedRecipe } from "./extract";
import { slugify } from "./normalize";

export interface UserScope {
  userId: string;
}

export interface PersistOptions {
  supabase: SupabaseClient;
  userScope?: UserScope;
  sourceUrl: string;
  imageUrl?: string | null;
  forceSkipDupCheck?: boolean;
}

export interface PersistResult {
  recipeId: string;
  slug: string;
  ingredientCount: number;
}

export class DuplicateRecipeError extends Error {
  constructor(
    message: string,
    public existingId: string,
    public existingName: string,
    public dupField: "source_url" | "name",
  ) {
    super(message);
    this.name = "DuplicateRecipeError";
  }
}

async function findDuplicate(
  supabase: SupabaseClient,
  recipeName: string,
  sourceUrl: string,
  userScope: UserScope | undefined,
): Promise<DuplicateRecipeError | null> {
  if (sourceUrl !== "manual entry") {
    let urlQuery = supabase
      .from("recipes")
      .select("id, name")
      .eq("source_url", sourceUrl)
      .limit(1);
    if (userScope) urlQuery = urlQuery.eq("user_id", userScope.userId);
    const { data: urlDupes } = await urlQuery;
    if (urlDupes && urlDupes.length > 0) {
      const dup = urlDupes[0];
      return new DuplicateRecipeError(
        userScope
          ? `"${dup.name}" already exists in your cookbook (same URL)`
          : `Source URL already exists for "${dup.name}" (${dup.id})`,
        dup.id,
        dup.name,
        "source_url",
      );
    }
  }

  let nameQuery = supabase
    .from("recipes")
    .select("id, name")
    .eq("name", recipeName)
    .limit(1);
  if (userScope) nameQuery = nameQuery.eq("user_id", userScope.userId);
  const { data: nameDupes } = await nameQuery;
  if (nameDupes && nameDupes.length > 0) {
    const dup = nameDupes[0];
    return new DuplicateRecipeError(
      userScope
        ? `"${dup.name}" already exists in your cookbook`
        : `"${recipeName}" already exists in Supabase (${dup.id})`,
      dup.id,
      dup.name,
      "name",
    );
  }

  return null;
}

export async function persistRecipe(
  recipe: NormalizedRecipe,
  opts: PersistOptions,
): Promise<PersistResult> {
  const { supabase, userScope, sourceUrl, imageUrl } = opts;

  if (!opts.forceSkipDupCheck) {
    const dup = await findDuplicate(
      supabase,
      recipe.name,
      sourceUrl,
      userScope,
    );
    if (dup) throw dup;
  }

  const slug = slugify(recipe.name);
  const recipeRow: Record<string, unknown> = {
    slug,
    name: recipe.name,
    preparation: recipe.preparation,
    source_url: sourceUrl,
    servings: recipe.servings,
    cook_time_minutes: recipe.cookTime,
    prep_time_minutes: recipe.prepTime,
    cuisine_tag: recipe.cuisineTag,
    dietary_tags: recipe.dietaryTags,
    image_url: imageUrl ?? null,
  };
  if (userScope) recipeRow.user_id = userScope.userId;

  const { data: recipeRecord, error: recipeError } = await supabase
    .from("recipes")
    .insert(recipeRow)
    .select("id, slug")
    .single();

  if (recipeError || !recipeRecord) {
    // 23505 is Postgres' unique_violation — usually means a concurrent insert
    // beat us between the dup check and this insert (TOCTOU). Convert to the
    // typed DuplicateRecipeError so callers can map it to the same 409 they
    // already do for the up-front dup check. Requires a UNIQUE constraint on
    // (user_id, source_url) and/or (user_id, name) for this to fire — see
    // follow-up DB-constraint task.
    if (recipeError && (recipeError as { code?: string }).code === "23505") {
      throw new DuplicateRecipeError(
        `"${recipe.name}" already exists (concurrent write detected)`,
        "",
        recipe.name,
        "name",
      );
    }
    throw new Error(
      `Failed to save recipe: ${recipeError?.message ?? "unknown error"}`,
    );
  }

  const recipeId = recipeRecord.id as string;
  let ingredientCount = 0;

  if (recipe.ingredients.length > 0) {
    const rows = recipe.ingredients.map((ing) => ({
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

    const { error: ingError } = await supabase.from("ingredients").insert(rows);

    if (ingError) {
      // Roll back recipe if ingredient insert fails — keeps the DB consistent.
      // If the rollback itself fails, surface both errors so the operator can
      // reconcile the orphan recipe row manually.
      const { error: rollbackError } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);
      if (rollbackError) {
        throw new Error(
          `Failed to save ingredients: ${ingError.message}; rollback also failed for recipe ${recipeId}: ${rollbackError.message}`,
        );
      }
      throw new Error(`Failed to save ingredients: ${ingError.message}`);
    }
    ingredientCount = rows.length;
  }

  return {
    recipeId,
    slug: recipeRecord.slug as string,
    ingredientCount,
  };
}
