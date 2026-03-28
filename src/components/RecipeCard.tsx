import Link from "next/link";
import { Recipe } from "@/lib/types";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;

  return (
    <Link href={`/recipe/${recipe.slug}`}>
      <div className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] cursor-pointer h-full flex flex-col">
        <div className="aspect-[4/3] bg-white/[0.03] relative overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-warm-light/30 text-4xl">
              🍳
            </div>
          )}
          {recipe.cuisineTag && (
            <span className="absolute top-3 left-3 glass text-warm-light text-xs font-body px-2.5 py-1 rounded-full">
              {recipe.cuisineTag}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-display text-lg text-warm-dark leading-snug">
            {recipe.name}
          </h3>
          <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-warm-light">
            {totalTime && (
              <span>{totalTime} min</span>
            )}
            {recipe.servings && (
              <span>{recipe.servings} servings</span>
            )}
            {recipe.caloriesPerServing != null && recipe.caloriesPerServing > 0 && (
              <span className="ml-auto font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded-full">
                {Math.round(recipe.caloriesPerServing)} cal
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
