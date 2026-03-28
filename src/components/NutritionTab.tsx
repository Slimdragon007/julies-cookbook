"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import { sumIngredientMacros, portionMacros as calcPortionMacros, perServingMacros } from "@/lib/macros";

interface Props {
  ingredients: Ingredient[];
  scale: number;
  servings: number;
  totalBatchWeightG: number | null;
}

const MACRO_FIELDS = [
  { key: "calories", label: "Calories", color: "text-amber-700", bg: "bg-amber-50" },
  { key: "protein", label: "Protein (g)", color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "carbs", label: "Carbs (g)", color: "text-orange-600", bg: "bg-orange-50" },
  { key: "fat", label: "Fat (g)", color: "text-purple-600", bg: "bg-purple-50" },
] as const;

export default function NutritionTab({ ingredients, scale, servings, totalBatchWeightG }: Props) {
  const [portionG, setPortionG] = useState<string>("");

  const totals = sumIngredientMacros(ingredients);

  function fmt(val: number | null, unit = "") {
    if (val === null) return "\u2014";
    const scaled = val * scale;
    const num = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
    return num + unit;
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  const portionGrams = parseFloat(portionG) || 0;
  const hasBatchWeight = totalBatchWeightG != null && totalBatchWeightG > 0;
  const portionMacros = hasBatchWeight
    ? calcPortionMacros(totals, portionGrams, totalBatchWeightG!)
    : null;

  const perServing = perServingMacros(totals, servings);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Nutritional Facts
      </h2>

      {/* Totals */}
      <div className="glass rounded-[2rem] px-6 py-5 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Total
          {scale !== 1 && (
            <span className="text-slate-400 text-xs ml-2 font-medium">
              (scaled to {servings} {servingsLabel})
            </span>
          )}
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {MACRO_FIELDS.map(({ key, label, color, bg }) => (
            <div key={key} className={`${bg} rounded-2xl p-3 text-center`}>
              <div className={`text-lg font-bold ${color}`}>
                {fmt(totals[key])}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Portion Calculator */}
      <div className="glass rounded-[2rem] px-6 py-5 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Portion Calculator
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-slate-700 font-medium" htmlFor="portion-input">
            How much did you eat?
          </label>
          <input
            id="portion-input"
            type="number"
            inputMode="numeric"
            placeholder="grams"
            value={portionG}
            onChange={(e) => setPortionG(e.target.value)}
            className="w-24 px-3 py-2.5 rounded-xl glass-input text-slate-800 text-base text-center font-bold"
          />
          <span className="text-sm text-slate-400 font-medium">g</span>
        </div>

        {portionGrams > 0 && hasBatchWeight && portionMacros && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {MACRO_FIELDS.map(({ key, label, color, bg }) => (
              <div key={key} className={`${bg} rounded-2xl p-3 text-center`}>
                <div className={`text-lg font-bold ${color}`}>
                  {portionMacros[key]}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {portionGrams > 0 && !hasBatchWeight && (
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-3">
              {MACRO_FIELDS.map(({ key, label, color, bg }) => (
                <div key={key} className={`${bg} rounded-2xl p-3 text-center`}>
                  <div className={`text-lg font-bold ${color}`}>
                    {perServing[key]}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center font-medium">
              Per serving estimate. Weigh the batch for exact tracking.
            </p>
          </div>
        )}

        {!portionGrams && !hasBatchWeight && (
          <p className="text-xs text-slate-400 font-medium">
            Weigh the batch for exact tracking.
          </p>
        )}
      </div>

      {/* Per-ingredient breakdown */}
      <div className="glass rounded-[2rem] px-6 py-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Per Ingredient</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-400 text-xs">
              <th className="py-2.5 pr-4 font-bold">Ingredient</th>
              <th className="py-2.5 px-2 font-bold text-right">Cal</th>
              <th className="py-2.5 px-2 font-bold text-right">Protein</th>
              <th className="py-2.5 px-2 font-bold text-right">Carbs</th>
              <th className="py-2.5 pl-2 font-bold text-right">Fat</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.id} className="border-b border-slate-50">
                <td className="py-3 pr-4 text-slate-700 font-semibold">{ing.name}</td>
                <td className="py-3 px-2 text-right text-slate-500">{fmt(ing.calories)}</td>
                <td className="py-3 px-2 text-right text-slate-500">{fmt(ing.protein, "g")}</td>
                <td className="py-3 px-2 text-right text-slate-500">{fmt(ing.carbs, "g")}</td>
                <td className="py-3 pl-2 text-right text-slate-500">{fmt(ing.fat, "g")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
