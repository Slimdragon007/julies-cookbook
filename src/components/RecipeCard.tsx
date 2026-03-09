import Link from "next/link";
import { Recipe } from "@/lib/types";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div className="bg-white rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        <div className="aspect-[4/3] bg-linen relative overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-warm-light text-4xl">
              🍳
            </div>
          )}
          {recipe.cuisineTag && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-warm text-xs font-body px-2.5 py-1 rounded-full">
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
            {recipe.caloriesPerServing && (
              <span className="ml-auto font-semibold text-warm">
                {Math.round(recipe.caloriesPerServing)} cal/serving
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
