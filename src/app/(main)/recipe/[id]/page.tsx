export const runtime = "edge";

import type { Metadata } from "next";
import { getRecipeById } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import RecipeTabs from "@/components/RecipeTabs";
import RecipeActions from "@/components/RecipeActions";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sumIngredientMacros, perServingMacros } from "@/lib/macros";
import { ChevronLeft, Sparkles } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recipe = await getRecipeById(id, user?.id);
  return {
    title: recipe
      ? `${recipe.name} — Julie's Cookbook`
      : "Recipe — Julie's Cookbook",
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recipe = await getRecipeById(id, user?.id);

  if (!recipe) notFound();

  const perServingCalories =
    recipe.servings && recipe.servings > 0
      ? perServingMacros(
          sumIngredientMacros(recipe.ingredients),
          recipe.servings,
        ).calories
      : null;

  // StatRow values — spec §5. Label / value / optional unit.
  const stats: { label: string; value: string; unit?: string }[] = [
    {
      label: "Prep",
      value: recipe.prepTime ? String(recipe.prepTime) : "—",
      unit: recipe.prepTime ? "min" : undefined,
    },
    {
      label: "Cook",
      value: recipe.cookTime ? String(recipe.cookTime) : "—",
      unit: recipe.cookTime ? "min" : undefined,
    },
    {
      label: "Serves",
      value: recipe.servings ? String(recipe.servings) : "—",
    },
    {
      label: "Calories",
      value: perServingCalories != null ? String(perServingCalories) : "—",
      unit: perServingCalories != null ? "/ serving" : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-cream selection:bg-brown-glass selection:text-ink">
      <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:min-h-screen">
        {/* Image section */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:h-screen lg:sticky lg:top-0 w-full overflow-hidden">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
              style={{ viewTransitionName: `recipe-img-${recipe.slug}` }}
            />
          ) : (
            <div className="w-full h-full bg-linen flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-brown/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />

          {/* Top bar — back button. 44×44 hit area on the outer Link
              (matches ADR-005), 36px visual circle on the inner span. */}
          <div className="absolute top-0 left-0 w-full p-6 pt-12 lg:pt-8 z-20">
            <Link
              href="/"
              aria-label="Back to gallery"
              className="w-11 h-11 inline-flex items-center justify-center"
            >
              <span className="w-9 h-9 rounded-full bg-cream/30 backdrop-blur-md text-cream border border-cream/40 flex items-center justify-center hover:bg-cream/50 active:scale-95 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </span>
            </Link>
          </div>

          {/* Title overlay (mobile) */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 lg:hidden">
            {recipe.cuisineTag && (
              <span className="inline-block px-3 py-1 bg-brown/90 backdrop-blur-sm text-cream font-sans text-[10px] font-semibold uppercase tracking-[0.12em] rounded-pill mb-3">
                {recipe.cuisineTag}
              </span>
            )}
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream leading-tight drop-shadow-[0_2px_8px_rgba(42,37,32,0.5)] line-clamp-2 break-words">
              {recipe.name}
            </h1>
          </div>
        </div>

        {/* Content section */}
        <div className="relative -mt-8 lg:mt-0 bg-cream rounded-t-[2.5rem] lg:rounded-none px-6 sm:px-10 pt-12 lg:pt-12 lg:pl-16 lg:pr-12 pb-32 lg:pb-12 lg:overflow-y-auto lg:max-h-screen border-t lg:border-t-0 lg:border-l border-linen-dim">
          {/* Mobile drag indicator */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-9 h-1 bg-ink-mute/40 rounded-pill" />
          </div>

          {/* Title (desktop) */}
          <div className="hidden lg:block mb-8">
            {recipe.cuisineTag && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linen text-ink-soft font-sans text-[11px] font-semibold uppercase tracking-[0.1em] rounded-pill mb-3">
                {recipe.cuisineTag}
              </span>
            )}
            <h1 className="font-display text-4xl xl:text-5xl font-semibold text-ink leading-tight break-words">
              {recipe.name}
            </h1>
          </div>

          {/* StatRow — spec §5. 4-col grid, divider lines via gap-px on linen-dim bg. */}
          <div className="grid grid-cols-4 gap-px bg-linen-dim border-y border-linen-dim mb-8 -mx-6 sm:-mx-10 lg:mx-0 lg:rounded lg:overflow-hidden">
            {stats.map((s) => (
              <div key={s.label} className="bg-cream py-3.5 px-2 text-center">
                <div className="font-sans text-[10px] tracking-[0.08em] uppercase text-ink-mute font-semibold mb-1">
                  {s.label}
                </div>
                <div className="font-sans text-base font-semibold text-ink tabular-nums">
                  {s.value}
                  {s.unit && (
                    <span className="text-[11px] text-ink-mute font-medium ml-0.5">
                      {s.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tags + Rating */}
          {(recipe.dietaryTags.length > 0 || recipe.julieRating) && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {recipe.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 bg-linen text-ink-soft font-sans text-[13px] font-medium rounded-pill"
                >
                  {tag}
                </span>
              ))}
              {recipe.julieRating && (
                <span
                  className="ml-auto text-gold text-sm tracking-[0.1em]"
                  aria-label={`Julie rated this ${recipe.julieRating} of 5 stars`}
                >
                  {"★".repeat(recipe.julieRating)}
                  <span className="text-linen-dim">
                    {"★".repeat(5 - recipe.julieRating)}
                  </span>
                </span>
              )}
            </div>
          )}

          <RecipeActions
            recipe={{
              id: recipe.id,
              name: recipe.name,
              servings: recipe.servings,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              cuisineTag: recipe.cuisineTag,
            }}
          />

          <RecipeTabs
            ingredients={recipe.ingredients}
            preparation={recipe.preparation}
            defaultServings={recipe.servings}
            totalBatchWeightG={recipe.totalBatchWeightG}
          />

          {recipe.sourceUrl && (
            <div className="mt-10 text-center">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif italic text-sm text-brown hover:text-brown-deep underline-offset-4 hover:underline"
              >
                Original recipe source
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
