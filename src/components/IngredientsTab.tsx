"use client";

import { Ingredient } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";

interface Props {
  ingredients: Ingredient[];
  defaultServings: number | null;
  servings: number;
  onServingsChange: (s: number) => void;
}

export default function IngredientsTab({ ingredients, defaultServings, servings, onServingsChange }: Props) {
  const baseServings = defaultServings || 1;
  const scale = servings / baseServings;

  function fmt(val: number | null) {
    return formatQuantity(val, scale);
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  return (
    <div>
      {/* Servings scaler */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl text-warm-dark">Ingredients</h2>
        <div className="flex items-center gap-3 bg-linen rounded-full px-4 py-2">
          <button
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            className="w-7 h-7 rounded-full bg-white border border-border text-warm-dark font-display text-lg flex items-center justify-center hover:bg-cream transition-colors"
            aria-label="Decrease servings"
          >
            −
          </button>
          <span className="font-body text-sm text-warm-dark min-w-[5rem] text-center">
            {servings} {servingsLabel}
          </span>
          <button
            onClick={() => onServingsChange(servings + 1)}
            className="w-7 h-7 rounded-full bg-white border border-border text-warm-dark font-display text-lg flex items-center justify-center hover:bg-cream transition-colors"
            aria-label="Increase servings"
          >
            +
          </button>
        </div>
      </div>

      {/* Ingredient list */}
      <ul className="space-y-0 font-body">
        {ingredients.map((ing) => (
          <li
            key={ing.id}
            className="flex items-baseline gap-2 py-2.5 border-b border-border/50"
          >
            <span className="text-warm-dark text-base">
              {ing.quantity != null && (
                <span className="font-display">{fmt(ing.quantity)} </span>
              )}
              {ing.unit && (
                <span className="text-warm-light">{ing.unit} </span>
              )}
              {ing.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
