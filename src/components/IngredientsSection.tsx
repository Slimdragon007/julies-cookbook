"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";

interface Props {
  ingredients: Ingredient[];
  defaultServings: number | null;
  preparation: string;
}

const MACRO_FIELDS = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
] as const;

export default function IngredientsSection({ ingredients, defaultServings, preparation }: Props) {
  const baseServings = defaultServings || 1;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

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

  const servingsLabel = servings === 1 ? "serving" : "servings";

  return (
    <>
      {/* ── Section 1: Ingredients ── */}
      {ingredients.length > 0 && (
        <section className="mb-10">
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
                {servings} {servingsLabel}
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
                className="flex items-baseline gap-2 py-2 border-b border-border/50"
              >
                <span className="text-warm-dark">
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
        </section>
      )}

      {/* ── Section 2: Preparation ── */}
      {preparation && (
        <section className="mb-10">
          <h2 className="font-display text-xl text-warm-dark mb-4">
            Preparation
          </h2>
          <div className="font-body text-sm leading-relaxed text-warm-dark/80 whitespace-pre-line">
            {preparation}
          </div>
        </section>
      )}

      {/* ── Section 3: Nutritional Facts ── */}
      {ingredients.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl text-warm-dark mb-4">
            Nutritional Facts
          </h2>

          {/* Totals summary */}
          <div className="bg-linen rounded-lg px-5 py-4 mb-5">
            <h3 className="font-display text-sm text-warm-dark mb-3">
              Total
              {scale !== 1 && (
                <span className="text-warm-light font-body text-xs ml-2">
                  (scaled to {servings} {servingsLabel})
                </span>
              )}
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {MACRO_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <div className="font-display text-lg text-warm-dark">
                    {fmt(totals[key])}
                  </div>
                  <div className="text-xs text-warm-light">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-ingredient breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-border text-left text-warm-light text-xs">
                  <th className="py-2 pr-4 font-normal">Ingredient</th>
                  <th className="py-2 px-2 font-normal text-right">Cal</th>
                  <th className="py-2 px-2 font-normal text-right">Protein</th>
                  <th className="py-2 px-2 font-normal text-right">Carbs</th>
                  <th className="py-2 pl-2 font-normal text-right">Fat</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="border-b border-border/30">
                    <td className="py-2 pr-4 text-warm-dark">{ing.name}</td>
                    <td className="py-2 px-2 text-right text-warm-light">
                      {fmt(ing.calories)}
                    </td>
                    <td className="py-2 px-2 text-right text-warm-light">
                      {fmt(ing.protein)}g
                    </td>
                    <td className="py-2 px-2 text-right text-warm-light">
                      {fmt(ing.carbs)}g
                    </td>
                    <td className="py-2 pl-2 text-right text-warm-light">
                      {fmt(ing.fat)}g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
