import { getRecipeById, getAllRecipeIds } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  const ids = await getAllRecipeIds();
  return ids.map((id) => ({ id }));
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

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

      {recipe.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-8 aspect-[16/9]">
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

      <div className="flex flex-wrap gap-4 text-sm text-warm-light mb-6 font-body">
        {recipe.prepTime && <span>Prep: {recipe.prepTime} min</span>}
        {recipe.cookTime && <span>Cook: {recipe.cookTime} min</span>}
        {totalTime && <span>Total: {totalTime} min</span>}
        {recipe.servings && <span>Servings: {recipe.servings}</span>}
      </div>

      {recipe.caloriesPerServing && (
        <div className="bg-linen rounded-lg px-5 py-4 mb-8 inline-block">
          <span className="text-warm-dark font-display text-2xl">
            {Math.round(recipe.caloriesPerServing)}
          </span>
          <span className="text-warm-light text-sm ml-2">calories per serving</span>
        </div>
      )}

      {recipe.cuisineTag && (
        <span className="inline-block bg-white border border-border text-warm text-xs px-3 py-1 rounded-full mb-6 ml-3">
          {recipe.cuisineTag}
        </span>
      )}

      {recipe.dietaryTags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {recipe.dietaryTags.map((tag) => (
            <span
              key={tag}
              className="bg-white border border-border text-warm text-xs px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-xl text-warm-dark mb-4">
            Ingredients
          </h2>
          <ul className="space-y-2 font-body text-sm">
            {recipe.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-baseline gap-2 py-1 border-b border-border/50"
              >
                <span className="text-warm-dark">
                  {ing.quantity && `${ing.quantity} `}
                  {ing.unit && `${ing.unit} `}
                  {ing.name}
                </span>
                {ing.calories && (
                  <span className="text-warm-light text-xs ml-auto">
                    {ing.calories} cal
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.preparation && (
        <section className="mb-8">
          <h2 className="font-display text-xl text-warm-dark mb-4">
            Preparation
          </h2>
          <div className="font-body text-sm leading-relaxed text-warm-dark/80 whitespace-pre-line">
            {recipe.preparation}
          </div>
        </section>
      )}

      {recipe.julieRating && (
        <div className="mt-8 text-center text-warm-light text-sm">
          Julie&apos;s Rating:{" "}
          {"★".repeat(recipe.julieRating)}
          {"☆".repeat(5 - recipe.julieRating)}
        </div>
      )}

      {recipe.sourceUrl && (
        <div className="mt-4 text-center">
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
