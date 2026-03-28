import { getRecipeById } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecipeTabs from "@/components/RecipeTabs";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipe = await getRecipeById(id, user?.id);

  if (!recipe) notFound();

  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="text-warm hover:text-warm-dark text-sm font-body inline-flex items-center gap-1 mb-6"
      >
        &larr; Back to recipes
      </Link>

      {/* Hero image: 4:3 mobile, 16:9 desktop */}
      {recipe.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-8 aspect-[4/3] md:aspect-[16/9]">
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <h1 className="font-display text-3xl md:text-4xl text-warm-dark mb-4">
        {recipe.name}
      </h1>

      {/* Compact stats row with calorie badge */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-warm-light mb-4 font-body">
        {recipe.prepTime && <span>Prep: {recipe.prepTime} min</span>}
        {recipe.cookTime && <span>Cook: {recipe.cookTime} min</span>}
        {totalTime && <span>Total: {totalTime} min</span>}
        {recipe.servings && <span>Servings: {recipe.servings}</span>}
        {recipe.caloriesPerServing && (
          <span className="bg-linen rounded-full px-3 py-1 text-warm-dark font-display text-sm">
            {Math.round(recipe.caloriesPerServing)} cal/serving
          </span>
        )}
      </div>

      {/* Tags + Rating row */}
      {(recipe.cuisineTag || recipe.dietaryTags.length > 0 || recipe.julieRating) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {recipe.cuisineTag && (
            <span className="bg-white border border-border text-warm text-xs px-3 py-1 rounded-full">
              {recipe.cuisineTag}
            </span>
          )}
          {recipe.dietaryTags.map((tag) => (
            <span
              key={tag}
              className="bg-white border border-border text-warm text-xs px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {recipe.julieRating && (
            <span className="ml-auto text-warm-light text-sm">
              {"★".repeat(recipe.julieRating)}
              {"☆".repeat(5 - recipe.julieRating)}
            </span>
          )}
        </div>
      )}

      {/* Tabbed content */}
      <RecipeTabs
        ingredients={recipe.ingredients}
        preparation={recipe.preparation}
        defaultServings={recipe.servings}
        totalBatchWeightG={recipe.totalBatchWeightG}
      />

      {/* Source link */}
      {recipe.sourceUrl && (
        <div className="mt-8 text-center">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-warm hover:text-warm-dark text-xs font-body underline"
          >
            Original recipe source
          </a>
        </div>
      )}
    </div>
  );
}
