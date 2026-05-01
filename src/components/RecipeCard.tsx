"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Recipe } from "@/lib/types";
import { Clock, Flame, UtensilsCrossed } from "lucide-react";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;
  const calories =
    recipe.caloriesPerServing != null && recipe.caloriesPerServing > 0
      ? Math.round(recipe.caloriesPerServing)
      : null;

  function handleClick() {
    const href = `/recipe/${recipe.slug}`;
    if ("startViewTransition" in document) {
      (
        document as unknown as { startViewTransition: (cb: () => void) => void }
      ).startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col text-left bg-linen rounded shadow-lift-sm overflow-hidden transition-all duration-200 ease-hearth hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brown focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      aria-label={`Open ${recipe.name}`}
    >
      {/* Image — spec §4: 4:3 mobile, 16:11 desktop. */}
      <div className="relative aspect-[4/3] md:aspect-[16/11] overflow-hidden bg-linen-dim">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            style={{ viewTransitionName: `recipe-img-${recipe.slug}` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-linen-dim to-linen flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-brown/30" />
          </div>
        )}
      </div>

      {/* Body — title (Playfair) + meta row (Lora) + stars (gold). */}
      <div className="p-3.5 pb-4">
        <h3
          className="font-display font-semibold text-[15px] text-ink leading-tight mb-2 line-clamp-2"
          style={{ viewTransitionName: `recipe-title-${recipe.slug}` }}
        >
          {recipe.name}
        </h3>
        <div className="flex items-center gap-2.5 font-sans text-xs text-ink-mute font-medium">
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock size={11} aria-hidden /> {totalTime}m
            </span>
          )}
          {calories != null && (
            <span className="flex items-center gap-1">
              <Flame size={11} aria-hidden /> {calories}
            </span>
          )}
        </div>
        {recipe.julieRating && (
          <div
            className="text-gold text-[11px] mt-1.5 tracking-wider"
            aria-label={`Julie rated this ${recipe.julieRating} of 5 stars`}
          >
            {"★".repeat(recipe.julieRating)}
            <span className="text-linen-dim">
              {"★".repeat(5 - recipe.julieRating)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
