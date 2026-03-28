"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Recipe } from "@/lib/types";
import { Clock, Users, Sparkles } from "lucide-react";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;

  function handleClick() {
    const href = `/recipe/${recipe.slug}`;
    if ("startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <div onClick={handleClick} className="group cursor-pointer">
      <div className="relative glass rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_16px_48px_rgba(196,149,46,0.12)] hover:-translate-y-2">
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              style={{ viewTransitionName: `recipe-img-${recipe.slug}` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-amber-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent opacity-60" />

          {/* Time Badge */}
          {totalTime && (
            <div className="absolute top-5 right-5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[12px] font-bold text-slate-800 flex items-center gap-1.5 border border-white shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
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
          <h3
            className="text-xl font-bold text-slate-800 mb-4 line-clamp-1 group-hover:text-amber-700 transition-colors"
            style={{ viewTransitionName: `recipe-title-${recipe.slug}` }}
          >
            {recipe.name}
          </h3>

          <div className="flex items-center gap-6">
            {recipe.servings && (
              <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                <Users className="w-4 h-4 text-amber-500" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
            {recipe.caloriesPerServing != null && recipe.caloriesPerServing > 0 && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{Math.round(recipe.caloriesPerServing)} cal</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
