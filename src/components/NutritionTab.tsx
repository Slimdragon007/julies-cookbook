"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import { sumIngredientMacros, portionMacros as calcPortionMacros, perServingMacros } from "@/lib/macros";
import { PORTION_UNITS, toGrams, type PortionUnit } from "@/lib/unit-conversions";

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
  const [portionAmount, setPortionAmount] = useState<string>("");
  const [portionUnit, setPortionUnit] = useState<PortionUnit>("servings");

  const totals = sumIngredientMacros(ingredients);

  function fmt(val: number | null, unit = "") {
    if (val === null) return "\u2014";
    const scaled = val * scale;
    const num = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
    return num + unit;
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  const amount = parseFloat(portionAmount) || 0;
  const hasBatchWeight = totalBatchWeightG != null && totalBatchWeightG > 0;

  // Convert the user's chosen unit to grams (or null if using servings without batch weight)
  const portionGrams = amount > 0
    ? toGrams(amount, portionUnit, { totalBatchWeightG, servings })
    : 0;

  // If unit is "servings" and we have no batch weight, use per-serving math directly
  const useServingsFallback = portionUnit === "servings" && !hasBatchWeight && amount > 0;

  const portionMacros = portionGrams && portionGrams > 0 && hasBatchWeight
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
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-sm text-slate-700 font-medium" htmlFor="portion-input">
            How much did you eat?
          </label>
          <input
            id="portion-input"
            type="number"
            inputMode="decimal"
            step="0.25"
            placeholder={portionUnit === "servings" ? "1" : "0"}
            value={portionAmount}
            onChange={(e) => setPortionAmount(e.target.value)}
            className="w-20 px-3 py-2.5 rounded-xl glass-input text-slate-800 text-base text-center font-bold"
          />
          <select
            value={portionUnit}
            onChange={(e) => setPortionUnit(e.target.value as PortionUnit)}
            className="px-3 py-2.5 rounded-xl glass-input text-slate-800 text-base font-bold"
          >
            {PORTION_UNITS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Exact macros via batch weight (any unit that converts to grams) */}
        {amount > 0 && portionMacros && (
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

        {/* Servings-based fallback (no batch weight) */}
        {useServingsFallback && (
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-3">
              {MACRO_FIELDS.map(({ key, label, color, bg }) => {
                const scaled = Math.round(perServing[key] * amount);
                return (
                  <div key={key} className={`${bg} rounded-2xl p-3 text-center`}>
                    <div className={`text-lg font-bold ${color}`}>
                      {scaled}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center font-medium">
              Per serving estimate. Set batch weight for exact tracking.
            </p>
          </div>
        )}

        {/* Non-servings unit without batch weight */}
        {amount > 0 && !portionMacros && !useServingsFallback && (
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
              Set batch weight for exact {portionUnit} tracking. Showing per-serving estimate.
            </p>
          </div>
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
