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
import MacroGrid, { type MacroValues } from "@/components/ui/MacroGrid";
import { Ring } from "@/components/ui/Ring";
import { Mono } from "@/components/ui/Mono";

interface Props {
  ingredients: Ingredient[];
  scale: number;
  servings: number;
  /** Recipe's BASE serving count (the value as stored, before the user
   *  adjusts). Used for the per-serving Ring + macro-split hero so those
   *  values stay constant when the user scales away from the recipe
   *  default. Added per Codex P1 finding on PR #43 (2026-05-21). */
  defaultServings: number | null;
  totalBatchWeightG: number | null;
}

export default function NutritionTab({
  ingredients,
  scale,
  servings,
  defaultServings,
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

  const parsedAmount = parseFloat(portionAmount);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
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

  // Per-serving values for the Ring + macro-split hero. MUST be computed
  // from the recipe's BASE servings, not the user-adjusted servings prop.
  // Otherwise scaling from 4 → 2 servings would HALVE the per-serving
  // values displayed (since perServing = totals/servings divides by the
  // user-adjusted number) AND keep "total kcal" stuck at the original
  // batch's calories — all three hero numbers go wrong simultaneously.
  // Fix per Codex P1 finding on PR #43 (2026-05-21). Prototype reference:
  // mobile.jsx NutritionBlock lines 410-446.
  const fallbackServings = defaultServings ?? 1;
  const baseServings = fallbackServings > 0 ? fallbackServings : 1;
  const basePerServing = perServingMacros(totals, baseServings);
  const cal = basePerServing.calories;
  const p = basePerServing.protein;
  const c = basePerServing.carbs;
  const f = basePerServing.fat;
  // Macro split: protein/carbs/fat caloric contribution (4/4/9 kcal per gram).
  const macroCalRaw = p * 4 + c * 4 + f * 9;
  const macroCalTotal = macroCalRaw > 0 ? macroCalRaw : 1;
  const pPct = Math.round(((p * 4) / macroCalTotal) * 100);
  const cPct = Math.round(((c * 4) / macroCalTotal) * 100);
  const fPct = Math.round(((f * 9) / macroCalTotal) * 100);

  return (
    <div>
      <h2 className="font-display text-[34px] italic leading-none text-ink mb-6">
        Nutrition
      </h2>

      {/* Per-serving hero: Ring + total-kcal column. Phase 3 addition matching
          prototype mobile.jsx NutritionBlock. Ring is sized to the prototype's
          92px (slightly smaller on narrow viewports via min). */}
      <section className="mb-6 flex items-center gap-4 rounded border border-rule bg-card p-4">
        <Ring
          pct={100}
          size={92}
          stroke={9}
          color="rgb(var(--ink))"
          ariaLabel={`${cal} kcal per serving`}
        >
          <div className="text-center leading-none">
            <Mono className="text-[22px] font-medium">{cal}</Mono>
            <div className="text-[9px] tracking-[0.12em] text-ink-soft uppercase mt-1 font-semibold">
              per serving
            </div>
          </div>
        </Ring>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink-soft mb-1">
            For <Mono className="text-ink font-semibold">{servings}</Mono>{" "}
            {servingsLabel}
          </div>
          <div className="text-[22px] font-medium tracking-[-0.02em]">
            <Mono>{cal * servings}</Mono>{" "}
            <span className="text-[13px] text-ink-mute">total kcal</span>
          </div>
        </div>
      </section>

      {/* Macro split — horizontal stacked bar + 3-row breakdown. */}
      <section className="mb-8 rounded border border-rule bg-card p-4">
        <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-3">
          Macro split
        </h3>
        <div
          className="h-2 flex rounded-full overflow-hidden mb-3 bg-rule/40"
          role="img"
          aria-label={`Protein ${pPct}%, carbs ${cPct}%, fat ${fPct}%`}
        >
          {pPct > 0 && <div className="bg-ink" style={{ width: `${pPct}%` }} />}
          {cPct > 0 && (
            <div className="bg-accent" style={{ width: `${cPct}%` }} />
          )}
          {fPct > 0 && (
            <div className="bg-ink-mute" style={{ width: `${fPct}%` }} />
          )}
        </div>
        {(
          [
            { label: "Protein", grams: p, pct: pPct, color: "bg-ink" },
            { label: "Carbs", grams: c, pct: cPct, color: "bg-accent" },
            { label: "Fat", grams: f, pct: fPct, color: "bg-ink-mute" },
          ] as const
        ).map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-3 py-2.5 border-b border-rule last:border-b-0 text-sm"
          >
            <span className={`w-2 h-2 rounded-full ${m.color}`} aria-hidden />
            <span className="flex-1 text-ink">{m.label}</span>
            <Mono className="text-ink-soft min-w-9 text-right">{m.pct}%</Mono>
            <Mono className="font-semibold min-w-11 text-right">
              {m.grams}g
            </Mono>
          </div>
        ))}
      </section>

      {/* Totals — MacroGrid. Kept for at-a-glance scaled-total reference. */}
      <section className="mb-8">
        <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-3">
          Total
          {scale !== 1 && (
            <span className="text-ink-mute font-medium ml-2 normal-case tracking-normal">
              (scaled to {servings} {servingsLabel})
            </span>
          )}
        </h3>
        <MacroGrid values={scaledTotals} />
      </section>

      {/* Portion calculator — keeps existing logic. Card surface, accent-soft halo. */}
      <section className="mb-8 bg-card border border-rule rounded p-6 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent-soft/60"
          aria-hidden
        />
        <div className="relative">
          <div className="font-sans text-[11px] tracking-[0.1em] uppercase text-accent font-semibold mb-1">
            Tare scale → exact macros
          </div>
          <h3 className="font-display text-[24px] text-ink mb-4">
            What&apos;s on your plate
          </h3>

          <div className="flex items-baseline gap-2 bg-paper px-5 py-4 rounded border border-rule mb-5">
            <input
              id="portion-input"
              type="number"
              inputMode="decimal"
              step="0.25"
              placeholder={portionUnit === "servings" ? "1" : "0"}
              value={portionAmount}
              onChange={(e) => setPortionAmount(e.target.value)}
              className="flex-1 min-w-0 font-mono text-[28px] font-semibold text-ink bg-transparent outline-none p-0 tabular-nums"
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
              <p className="font-sans text-[13px] italic text-ink-mute mt-3">
                Per-serving estimate. Set batch weight for exact tracking.
              </p>
            </>
          )}

          {amount > 0 && !portionResult && !useServingsFallback && (
            <>
              <MacroGrid values={fallbackValues} />
              <p className="font-sans text-[13px] italic text-ink-mute mt-3">
                Set batch weight for exact {portionUnit} tracking. Showing
                per-serving estimate.
              </p>
            </>
          )}

          {hasBatchWeight && (
            <p className="font-sans text-[13px] italic text-ink-mute mt-3">
              Total batch: {totalBatchWeightG}g · {servings} {servingsLabel} ·{" "}
              {Math.round(totalBatchWeightG! / servings)}g per serving
            </p>
          )}
        </div>
      </section>

      {/* Per-ingredient breakdown — card with table. */}
      <section className="bg-card border border-rule rounded p-6 overflow-x-auto">
        <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-4">
          Per Ingredient
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
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
                  className="border-b border-rule last:border-b-0"
                >
                  <td className="py-2.5 pr-4 font-sans text-base text-ink">
                    {ing.name}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-sm text-ink-soft tabular-nums">
                    {fmt(ing.calories)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-sm text-ink-soft tabular-nums">
                    {fmt(ing.protein, "g")}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-sm text-ink-soft tabular-nums">
                    {fmt(ing.carbs, "g")}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-mono text-sm text-ink-soft tabular-nums">
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
