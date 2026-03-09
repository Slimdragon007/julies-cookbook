"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";

interface Props {
  ingredients: Ingredient[];
  defaultServings: number | null;
}

export default function IngredientsSection({ ingredients, defaultServings }: Props) {
  const base = defaultServings || 1;
  const [servings, setServings] = useState(base);
  const scale = servings / base;

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function fmt(val: number | null) {
    if (val === null) return "—";
    const scaled = val * scale;
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-warm-dark">Ingredients</h2>
        <div className="flex items-center gap-3 bg-linen rounded-full px-4 py-2">
          <button
            onClick={() => setServings(Math.max(1, servings - 1))}
            className="w-7 h-7 rounded-full bg-white border border-border text-warm-dark font-display text-lg flex items-center justify-center hover:bg-cream transition-colors"
            aria-label="Decrease servings"
          >
            −
          </button>
          <span className="font-body text-sm text-warm-dark min-w-[5rem] text-center">
            {servings} {servings === 1 ? "serving" : "servings"}
          </span>
          <button
            onClick={() => setServings(servings + 1)}
            className="w-7 h-7 rounded-full bg-white border border-border text-warm-dark font-display text-lg flex items-center justify-center hover:bg-cream transition-colors"
            aria-label="Increase servings"
          >
            +
          </button>
        </div>
      </div>

      <ul className="space-y-0 font-body text-sm">
        {ingredients.map((ing) => (
          <li
            key={ing.id}
            className="py-2.5 border-b border-border/50"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-warm-dark">
                {ing.quantity != null && `${fmt(ing.quantity)} `}
                {ing.unit && `${ing.unit} `}
                {ing.name}
              </span>
              {ing.calories != null && (
                <span className="text-warm-light text-xs whitespace-nowrap">
                  {fmt(ing.calories)} cal
                </span>
              )}
            </div>
            {(ing.protein != null || ing.carbs != null || ing.fat != null) && (
              <div className="flex gap-4 mt-1 text-xs text-warm-light/80">
                {ing.protein != null && <span>P: {fmt(ing.protein)}g</span>}
                {ing.carbs != null && <span>C: {fmt(ing.carbs)}g</span>}
                {ing.fat != null && <span>F: {fmt(ing.fat)}g</span>}
              </div>
            )}
          </li>
        ))}
      </ul>

      {ingredients.length > 0 && (
        <div className="mt-4 bg-linen rounded-lg px-5 py-4">
          <h3 className="font-display text-sm text-warm-dark mb-2">
            Total Macros
            {scale !== 1 && (
              <span className="text-warm-light font-body text-xs ml-2">
                (scaled to {servings} {servings === 1 ? "serving" : "servings"})
              </span>
            )}
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="font-display text-lg text-warm-dark">
                {Math.round(totals.calories * scale)}
              </div>
              <div className="text-xs text-warm-light">Calories</div>
            </div>
            <div>
              <div className="font-display text-lg text-warm-dark">
                {(totals.protein * scale).toFixed(1)}
              </div>
              <div className="text-xs text-warm-light">Protein (g)</div>
            </div>
            <div>
              <div className="font-display text-lg text-warm-dark">
                {(totals.carbs * scale).toFixed(1)}
              </div>
              <div className="text-xs text-warm-light">Carbs (g)</div>
            </div>
            <div>
              <div className="font-display text-lg text-warm-dark">
                {(totals.fat * scale).toFixed(1)}
              </div>
              <div className="text-xs text-warm-light">Fat (g)</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
