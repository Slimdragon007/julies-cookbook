"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Recipe } from "@/lib/types";
import { Clock, Flame, UtensilsCrossed } from "lucide-react";
import { SerifIt } from "@/components/ui/SerifIt";
import { Mono } from "@/components/ui/Mono";

interface RecipeCardProps {
  recipe: Recipe;
  /** Number of times this recipe has been logged. Omitted = don't render the
   *  "cooked Nx" eyebrow row. Computed by parent via `getCookedCounts`. */
  cookedCount?: number;
}

// RecipeCard renders two layouts conditioned on viewport (Tailwind responsive
// utilities, no JS branch):
//
// - **Mobile (< md):** horizontal row — 92×92 square thumbnail on the left,
//   metadata column on the right. Matches prototype MLibrary recipe rows
//   (mobile.jsx lines 178-203).
// - **Desktop (md+):** portrait card — full-width 4:3 / 16:11 image on top
//   with title + meta below. This is the existing Hearth-era / TASK-018 card.
//
// Both layouts share the same click target (the whole button) and the same
// content props; only the visual arrangement differs. Maintaining both as
// duplicate JSX trees is intentional — keeps Tailwind utilities cohesive per
// breakpoint and avoids prop-driven conditionals fighting mobile-first.

export default function RecipeCard({ recipe, cookedCount }: RecipeCardProps) {
  const router = useRouter();
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || null;
  const calories =
    recipe.caloriesPerServing != null && recipe.caloriesPerServing > 0
      ? Math.round(recipe.caloriesPerServing)
      : null;
  const proteinPerServing = (() => {
    const totalProtein = recipe.ingredients?.reduce(
      (sum, ing) => sum + (ing.protein ?? 0),
      0,
    );
    const servings = recipe.servings || 1;
    if (!totalProtein) return null;
    return Math.round(totalProtein / servings);
  })();

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
      className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper md:bg-card md:border md:border-rule md:rounded md:shadow-lift-sm md:overflow-hidden md:transition-all md:duration-200 md:ease-hearth md:hover:-translate-y-0.5 md:hover:shadow-lift md:flex md:flex-col rounded-[18px] p-2.5 md:p-0 flex gap-3.5 md:gap-0 items-stretch md:items-stretch"
      aria-label={`Open ${recipe.name}`}
    >
      {/* MOBILE thumbnail (1:1, 92×92). DESKTOP image (4:3 / 16:11, full width). */}
      <div className="relative aspect-square w-[92px] h-[92px] flex-shrink-0 overflow-hidden bg-rule/40 rounded-[14px] md:rounded-none md:w-full md:h-auto md:aspect-[4/3] lg:aspect-[16/11]">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 92px, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            style={{ viewTransitionName: `recipe-img-${recipe.slug}` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rule/30 to-card flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-accent/30" />
          </div>
        )}
      </div>

      {/* MOBILE meta column (right of thumbnail). DESKTOP body (below image). */}
      <div className="flex-1 min-w-0 flex flex-col justify-between pt-0.5 md:pt-0 md:p-3.5 md:pb-4">
        <div>
          {cookedCount !== undefined && cookedCount > 0 && (
            <div className="text-[11px] uppercase tracking-[0.06em] font-semibold text-ink-mute mb-1 md:hidden">
              cooked <Mono>{cookedCount}</Mono>×
            </div>
          )}
          <h3
            className="font-display text-[17px] md:text-[18px] text-ink leading-tight md:mb-2 line-clamp-2 tracking-[-0.01em]"
            style={{ viewTransitionName: `recipe-title-${recipe.slug}` }}
          >
            <SerifIt>{recipe.name}</SerifIt>
          </h3>
        </div>

        {/* Meta row — bullets between items on mobile; on desktop drop bullets
            since the visual hierarchy already separates time and kcal. */}
        <div className="flex items-center gap-2 md:gap-2.5 font-mono tabular-nums text-xs text-ink-soft md:text-ink-mute font-medium">
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock size={11} aria-hidden /> <Mono>{totalTime}</Mono>m
            </span>
          )}
          {calories != null && (
            <>
              <span aria-hidden className="text-ink-mute md:hidden">
                ·
              </span>
              <span className="flex items-center gap-1">
                <Flame size={11} aria-hidden /> <Mono>{calories}</Mono>
              </span>
            </>
          )}
          {proteinPerServing != null && (
            <>
              <span aria-hidden className="text-ink-mute md:hidden">
                ·
              </span>
              <span className="md:hidden">
                <Mono>{proteinPerServing}</Mono>g P
              </span>
            </>
          )}
        </div>

        {recipe.julieRating && (
          <div
            className="text-accent text-[11px] mt-1.5 tracking-wider md:block hidden"
            aria-label={`Julie rated this ${recipe.julieRating} of 5 stars`}
          >
            {"★".repeat(recipe.julieRating)}
            <span className="text-rule">
              {"★".repeat(5 - recipe.julieRating)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
