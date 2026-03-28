import Link from "next/link";
import Image from "next/image";
import { Recipe } from "@/lib/types";
import { Clock, Users, Sparkles } from "lucide-react";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;

  return (
    <Link href={`/recipe/${recipe.slug}`}>
      <div className="group cursor-pointer">
        <div className="relative glass rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_16px_48px_rgba(0,166,244,0.12)] hover:-translate-y-2">
          {/* Image */}
          <div className="relative h-64 overflow-hidden">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-sky-200" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent opacity-60" />

            {/* Time Badge */}
            {totalTime && (
              <div className="absolute top-5 right-5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[12px] font-bold text-slate-800 flex items-center gap-1.5 border border-white shadow-sm">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                {totalTime}m
              </div>
            )}

            {/* Cuisine Tag */}
            {recipe.cuisineTag && (
              <div className="absolute top-5 left-5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[12px] font-bold text-slate-800 border border-white shadow-sm">
                {recipe.cuisineTag}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 pt-5">
            <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-1 group-hover:text-sky-600 transition-colors">
              {recipe.name}
            </h3>

            <div className="flex items-center gap-6">
              {recipe.servings && (
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
              {recipe.caloriesPerServing != null && recipe.caloriesPerServing > 0 && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>{Math.round(recipe.caloriesPerServing)} cal</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
