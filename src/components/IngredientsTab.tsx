"use client";

import { Ingredient } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";
import { Sparkles } from "lucide-react";

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

  return (
    <div>
      {/* Header with servings scaler */}
      {/* flex-wrap + outer gap-3: prevent title pill / servings pill overlap on narrow viewports (TASK-013). */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Ingredients</h2>
          <div className="px-4 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            {ingredients.length} Items
          </div>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-3 py-2">
          {/* Each <button> is 44×44 (iOS HIG / WCAG 2.5.5 minimum tappable size). The visible circle stays 36px via the inner span — the extra 4px ring is invisible hit area. */}
          <button
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            className="w-11 h-11 inline-flex items-center justify-center text-slate-800 text-lg"
            aria-label="Decrease servings"
          >
            <span className="w-9 h-9 rounded-full bg-white border border-white flex items-center justify-center hover:bg-amber-50 active:scale-90 transition-all shadow-sm">
              −
            </span>
          </button>
          <span className="text-sm text-slate-800 font-bold min-w-[5rem] text-center">
            {servings} {servingsLabel}
          </span>
          <button
            onClick={() => onServingsChange(servings + 1)}
            className="w-11 h-11 inline-flex items-center justify-center text-slate-800 text-lg"
            aria-label="Increase servings"
          >
            <span className="w-9 h-9 rounded-full bg-white border border-white flex items-center justify-center hover:bg-amber-50 active:scale-90 transition-all shadow-sm">
              +
            </span>
          </button>
        </div>
      </div>

      {/* Ingredient list */}
      <div className="grid gap-3">
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            className="group flex items-center gap-4 glass p-4 rounded-[1.5rem] hover:bg-white/60 hover:border-amber-200 transition-all"
          >
            <div className="w-6 h-6 rounded-full border-2 border-amber-200 flex items-center justify-center group-hover:border-amber-300 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-200 group-hover:bg-amber-600 transition-all scale-0 group-hover:scale-100" />
            </div>
            <span className="text-slate-700 font-semibold text-base">
              {ing.quantity != null && (
                <span className="font-bold">{fmt(ing.quantity)} </span>
              )}
              {ing.unit && <span className="text-slate-500">{ing.unit} </span>}
              {ing.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
