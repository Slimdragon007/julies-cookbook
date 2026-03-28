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

export default function IngredientsTab({ ingredients, defaultServings, servings, onServingsChange }: Props) {
  const baseServings = defaultServings || 1;
  const scale = servings / baseServings;

  function fmt(val: number | null) {
    return formatQuantity(val, scale);
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  return (
    <div>
      {/* Header with servings scaler */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Ingredients</h2>
          <div className="px-4 py-1.5 bg-sky-50 text-sky-700 text-xs font-bold rounded-full border border-sky-100 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            {ingredients.length} Items
          </div>
        </div>
        <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
          <button
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            className="w-7 h-7 rounded-full bg-white border border-white text-slate-800 text-lg flex items-center justify-center hover:bg-sky-50 transition-colors shadow-sm"
            aria-label="Decrease servings"
          >
            −
          </button>
          <span className="text-sm text-slate-800 font-bold min-w-[5rem] text-center">
            {servings} {servingsLabel}
          </span>
          <button
            onClick={() => onServingsChange(servings + 1)}
            className="w-7 h-7 rounded-full bg-white border border-white text-slate-800 text-lg flex items-center justify-center hover:bg-sky-50 transition-colors shadow-sm"
            aria-label="Increase servings"
          >
            +
          </button>
        </div>
      </div>

      {/* Ingredient list */}
      <div className="grid gap-3">
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            className="group flex items-center gap-4 glass p-4 rounded-[1.5rem] hover:bg-white/60 hover:border-sky-200 transition-all"
          >
            <div className="w-6 h-6 rounded-full border-2 border-sky-100 flex items-center justify-center group-hover:border-sky-300 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-200 group-hover:bg-sky-500 transition-all scale-0 group-hover:scale-100" />
            </div>
            <span className="text-slate-700 font-semibold text-[15px]">
              {ing.quantity != null && (
                <span className="font-bold">{fmt(ing.quantity)} </span>
              )}
              {ing.unit && (
                <span className="text-slate-500">{ing.unit} </span>
              )}
              {ing.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
