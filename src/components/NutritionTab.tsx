"use client";

import { useState, useMemo } from "react";
import { Ingredient } from "@/lib/types";
import {
  sumIngredientMacros,
  portionMacros as calcPortionMacros,
  perServingMacros,
} from "@/lib/macros";
import {
  PORTION_UNITS,
  toGrams,
  type PortionUnit,
} from "@/lib/unit-conversions";

interface Props {
  ingredients: Ingredient[];
  scale: number;
  servings: number;
  totalBatchWeightG: number | null;
}

const MACRO_FIELDS = [
  { key: "calories", label: "Calories", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const;

type MacroValues = Record<(typeof MACRO_FIELDS)[number]["key"], number | null>;

function MacroGrid({ values }: { values: MacroValues }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {MACRO_FIELDS.map(({ key, label, unit }) => {
        const v = values[key];
        const display =
          v === null ? "—" : v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
        return (
          <div key={key} className="bg-linen rounded p-4">
            <div className="font-sans text-[11px] tracking-[0.08em] uppercase text-ink-mute font-semibold mb-1.5">
              {label}
            </div>
            <div className="font-sans text-2xl font-semibold text-ink tabular-nums">
              {display}
              {unit && v !== null && (
                <span className="text-[13px] text-ink-mute font-medium ml-0.5">
                  {unit}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NutritionTab({
  ingredients,
  scale,
  servings,
  totalBatchWeightG,
}: Props) {
  const [portionAmount, setPortionAmount] = useState<string>("");
  const [portionUnit, setPortionUnit] = useState<PortionUnit>("servings");

  const totals = useMemo(() => sumIngredientMacros(ingredients), [ingredients]);

  const scaledTotals: MacroValues = {
    calories: totals.calories === null ? null : totals.calories * scale,
    protein: totals.protein === null ? null : totals.protein * scale,
    carbs: totals.carbs === null ? null : totals.carbs * scale,
    fat: totals.fat === null ? null : totals.fat * scale,
  };

  const servingsLabel = servings === 1 ? "serving" : "servings";

  const amount = parseFloat(portionAmount) || 0;
  const hasBatchWeight = totalBatchWeightG != null && totalBatchWeightG > 0;

  const portionGrams =
    amount > 0
      ? toGrams(amount, portionUnit, { totalBatchWeightG, servings })
      : 0;

  const useServingsFallback =
    portionUnit === "servings" && !hasBatchWeight && amount > 0;

  const portionResult =
    portionGrams && portionGrams > 0 && hasBatchWeight
      ? calcPortionMacros(totals, portionGrams, totalBatchWeightG!)
      : null;

  const perServing = perServingMacros(totals, servings);

  const fallbackValues: MacroValues = useServingsFallback
    ? {
        calories: Math.round(perServing.calories * amount),
        protein: Math.round(perServing.protein * amount),
        carbs: Math.round(perServing.carbs * amount),
        fat: Math.round(perServing.fat * amount),
      }
    : {
        calories: perServing.calories,
        protein: perServing.protein,
        carbs: perServing.carbs,
        fat: perServing.fat,
      };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">
        Nutrition
      </h2>

      {/* Totals — MacroGrid per spec §9. */}
      <section className="mb-8">
        <h3 className="font-sans text-xs font-semibold tracking-[0.06em] uppercase text-brown mb-3">
          Total
          {scale !== 1 && (
            <span className="text-ink-mute font-medium ml-2 normal-case tracking-normal">
              (scaled to {servings} {servingsLabel})
            </span>
          )}
        </h3>
        <MacroGrid values={scaledTotals} />
      </section>

      {/* Portion calculator — keeps existing logic, reskinned per spec §10 inspiration. */}
      <section className="mb-8 bg-gradient-to-b from-linen to-linen-dim rounded-lg p-6 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-leaf/10"
          aria-hidden
        />
        <div className="relative">
          <div className="font-sans text-[11px] tracking-[0.1em] uppercase text-brown font-semibold mb-1">
            Tare scale → exact macros
          </div>
          <h3 className="font-display text-xl font-semibold text-ink mb-4">
            What&apos;s on your plate
          </h3>

          <div className="flex items-baseline gap-2 bg-cream px-5 py-4 rounded border border-brown-glass mb-5">
            <input
              id="portion-input"
              type="number"
              inputMode="decimal"
              step="0.25"
              placeholder={portionUnit === "servings" ? "1" : "0"}
              value={portionAmount}
              onChange={(e) => setPortionAmount(e.target.value)}
              className="flex-1 min-w-0 font-sans text-[28px] font-semibold text-ink bg-transparent outline-none p-0 tabular-nums"
              aria-label="Portion amount"
            />
            <select
              value={portionUnit}
              onChange={(e) => setPortionUnit(e.target.value as PortionUnit)}
              className="font-sans text-sm font-medium text-ink-soft bg-transparent outline-none cursor-pointer"
              aria-label="Portion unit"
            >
              {PORTION_UNITS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {amount > 0 && portionResult && <MacroGrid values={portionResult} />}

          {useServingsFallback && (
            <>
              <MacroGrid values={fallbackValues} />
              <p className="font-serif text-[13px] italic text-ink-mute mt-3">
                Per-serving estimate. Set batch weight for exact tracking.
              </p>
            </>
          )}

          {amount > 0 && !portionResult && !useServingsFallback && (
            <>
              <MacroGrid values={fallbackValues} />
              <p className="font-serif text-[13px] italic text-ink-mute mt-3">
                Set batch weight for exact {portionUnit} tracking. Showing
                per-serving estimate.
              </p>
            </>
          )}

          {hasBatchWeight && (
            <p className="font-serif text-[13px] italic text-ink-mute mt-3">
              Total batch: {totalBatchWeightG}g · {servings} {servingsLabel} ·{" "}
              {Math.round(totalBatchWeightG! / servings)}g per serving
            </p>
          )}
        </div>
      </section>

      {/* Per-ingredient breakdown — linen card with table. */}
      <section className="bg-linen rounded p-6 overflow-x-auto">
        <h3 className="font-sans text-xs font-semibold tracking-[0.06em] uppercase text-brown mb-4">
          Per Ingredient
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-linen-dim">
              <th className="py-2 pr-4 text-left font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Ingredient
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Cal
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Protein
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Carbs
              </th>
              <th className="py-2 pl-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Fat
              </th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              function fmt(val: number | null, unit = "") {
                if (val === null) return "—";
                const scaled = val * scale;
                const num =
                  scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
                return num + unit;
              }
              return (
                <tr
                  key={ing.id}
                  className="border-b border-linen-dim last:border-b-0"
                >
                  <td className="py-2.5 pr-4 font-serif text-base text-ink">
                    {ing.name}
                  </td>
                  <td className="py-2.5 px-2 text-right font-sans text-sm text-ink-soft tabular-nums">
                    {fmt(ing.calories)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-sans text-sm text-ink-soft tabular-nums">
                    {fmt(ing.protein, "g")}
                  </td>
                  <td className="py-2.5 px-2 text-right font-sans text-sm text-ink-soft tabular-nums">
                    {fmt(ing.carbs, "g")}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-sans text-sm text-ink-soft tabular-nums">
                    {fmt(ing.fat, "g")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
