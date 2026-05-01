"use client";

import { Ingredient } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  ingredients: Ingredient[];
  defaultServings: number | null;
  servings: number;
  onServingsChange: (s: number) => void;
}

export default function IngredientsTab({
  ingredients,
  defaultServings,
  servings,
  onServingsChange,
}: Props) {
  const baseServings = defaultServings || 1;
  const scale = servings / baseServings;

  function fmt(val: number | null) {
    return formatQuantity(val, scale);
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  // Group by category. Ingredients with no category fall into "Other".
  const grouped = ingredients.reduce<Record<string, Ingredient[]>>(
    (acc, ing) => {
      const cat = ing.category?.trim() || "Other";
      (acc[cat] ||= []).push(ing);
      return acc;
    },
    {},
  );
  const categories = Object.keys(grouped);
  const showHeadings = categories.length > 1 || categories[0] !== "Other";

  return (
    <div>
      {/* ServingsScaler — spec §6. Sits above the list. */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-8 px-5 py-4 bg-cream border-y border-linen-dim -mx-6 sm:-mx-10 lg:mx-0 lg:rounded">
        <span className="font-serif text-sm text-ink-soft">Scale recipe</span>
        <div className="flex items-center gap-2.5">
          <Button
            variant="icon"
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            disabled={servings <= 1}
            aria-label="Decrease servings"
          >
            <span className="w-8 h-8 rounded-full bg-brown text-cream flex items-center justify-center transition-transform duration-150 hover:bg-brown-deep hover:scale-105">
              <Minus size={16} />
            </span>
          </Button>
          <span className="font-sans text-base font-semibold text-ink min-w-[80px] text-center transition-opacity duration-200 tabular-nums">
            {servings} {servingsLabel}
          </span>
          <Button
            variant="icon"
            onClick={() => onServingsChange(servings + 1)}
            aria-label="Increase servings"
          >
            <span className="w-8 h-8 rounded-full bg-brown text-cream flex items-center justify-center transition-transform duration-150 hover:bg-brown-deep hover:scale-105">
              <Plus size={16} />
            </span>
          </Button>
        </div>
      </div>

      {/* IngredientList — spec §7. Grouped sections, linen-dim row dividers. */}
      <div>
        {categories.map((category) => (
          <section key={category} className="mb-6">
            {showHeadings && (
              <h4 className="font-sans text-xs font-semibold tracking-[0.06em] uppercase text-brown mb-2.5">
                {category}
              </h4>
            )}
            {grouped[category].map((ing) => (
              <div
                key={ing.id}
                className="flex justify-between gap-4 py-2.5 border-b border-linen-dim last:border-b-0"
              >
                <span className="font-serif text-base text-ink">
                  {ing.name}
                </span>
                <span className="font-sans text-sm font-medium text-ink-soft tabular-nums whitespace-nowrap">
                  {ing.quantity != null && <>{fmt(ing.quantity)} </>}
                  {ing.unit}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
