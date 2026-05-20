"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Recipe } from "@/lib/types";
import {
  calculatePortionMacros,
  perServingMacros,
  sumIngredientMacros,
} from "@/lib/macros";
import {
  PORTION_UNITS,
  toGrams,
  type PortionUnit,
} from "@/lib/unit-conversions";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, InputLabel } from "@/components/ui/Input";
import MacroGrid, { type MacroValues } from "@/components/ui/MacroGrid";

interface LogEntry {
  id: string;
  recipe_id: string;
  meal: string;
  portion_g: number;
  portion_amount?: number;
  portion_unit?: PortionUnit;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  log_date: string;
  notes: string | null;
  recipes: { name: string } | null;
}

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const selectClass =
  "w-full px-4 py-3 rounded bg-card border border-rule font-sans text-[15px] text-ink outline-none transition-colors focus:border-accent";

export default function FoodLogForm({ recipes }: { recipes: Recipe[] }) {
  const [recipeId, setRecipeId] = useState("");
  const [meal, setMeal] = useState<string>("Lunch");
  const [portionAmount, setPortionAmount] = useState("");
  const [portionUnit, setPortionUnit] = useState<PortionUnit>("servings");
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useSWR(`/api/log-meal?date=${logDate}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  const entries: LogEntry[] = data?.entries || [];

  function calculateMacros() {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe)
      return {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        portion_g: 0,
      };

    const amount = parseFloat(portionAmount) || 0;
    const servingsCount = recipe.servings ?? 1;

    const grams = toGrams(amount, portionUnit, {
      totalBatchWeightG: recipe.totalBatchWeightG,
      servings: servingsCount,
    });

    if (grams === null && portionUnit === "servings") {
      const totals = sumIngredientMacros(recipe.ingredients);
      const perServing = perServingMacros(totals, servingsCount);
      return {
        calories: Math.round(perServing.calories * amount),
        protein_g: Math.round(perServing.protein * amount),
        carbs_g: Math.round(perServing.carbs * amount),
        fat_g: Math.round(perServing.fat * amount),
        portion_g: 0,
      };
    }

    const resolvedGrams = grams ?? 0;
    const { macros } = calculatePortionMacros(
      recipe.ingredients,
      resolvedGrams,
      recipe.totalBatchWeightG,
      servingsCount,
    );

    return {
      calories: macros.calories,
      protein_g: macros.protein,
      carbs_g: macros.carbs,
      fat_g: macros.fat,
      portion_g: resolvedGrams,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipeId || !portionAmount) return;

    setSaving(true);
    setMessage("");

    const macros = calculateMacros();
    const selectedRecipe = recipes.find((r) => r.id === recipeId);
    const displayAmount = parseFloat(portionAmount) || 0;

    const optimisticEntry: LogEntry = {
      id: `temp-${Date.now()}`,
      recipe_id: recipeId,
      meal,
      portion_g: macros.portion_g,
      portion_amount: displayAmount,
      portion_unit: portionUnit,
      calories: macros.calories,
      protein_g: macros.protein_g,
      carbs_g: macros.carbs_g,
      fat_g: macros.fat_g,
      log_date: logDate,
      notes: null,
      recipes: { name: selectedRecipe?.name || "Unknown" },
    };

    mutate(
      `/api/log-meal?date=${logDate}`,
      { entries: [optimisticEntry, ...entries] },
      false,
    );

    const res = await fetch("/api/log-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipeId,
        meal,
        portion_g: macros.portion_g,
        portion_amount: displayAmount,
        portion_unit: portionUnit,
        log_date: logDate,
        calories: macros.calories,
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g,
      }),
    });

    const responseData = await res.json();
    setSaving(false);

    if (responseData.success) {
      setMessage("Logged.");
      setPortionAmount("");
      mutate(`/api/log-meal?date=${logDate}`);
    } else {
      setMessage("Couldn't save. Please try again.");
      mutate(`/api/log-meal?date=${logDate}`);
    }
  }

  // Day total in MacroValues shape so we can pass it directly to <MacroGrid>.
  const todayTotal: MacroValues = entries.reduce<MacroValues>(
    (acc, e) => ({
      calories: (acc.calories ?? 0) + (e.calories || 0),
      protein: (acc.protein ?? 0) + (e.protein_g || 0),
      carbs: (acc.carbs ?? 0) + (e.carbs_g || 0),
      fat: (acc.fat ?? 0) + (e.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const isToday = logDate === new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Log form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-rule rounded shadow-lift-sm p-6 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div className="space-y-2">
            <InputLabel htmlFor="log-recipe">Recipe</InputLabel>
            <select
              id="log-recipe"
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select a recipe…</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="log-meal">Meal</InputLabel>
            <select
              id="log-meal"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className={selectClass}
            >
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="log-portion">Portion</InputLabel>
            <div className="flex gap-2">
              <Input
                id="log-portion"
                type="number"
                inputMode="decimal"
                step="0.25"
                value={portionAmount}
                onChange={(e) => setPortionAmount(e.target.value)}
                placeholder={portionUnit === "servings" ? "1" : "0"}
                className="flex-1"
                required
              />
              <select
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value as PortionUnit)}
                className={`${selectClass} w-auto`}
                aria-label="Portion unit"
              >
                {PORTION_UNITS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="log-date">Date</InputLabel>
            <input
              id="log-date"
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className={selectClass}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={saving || !recipeId || !portionAmount}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving…" : "Log meal"}
          </Button>
          {message && (
            <span className="font-sans italic text-sm text-ink-soft">
              {message}
            </span>
          )}
        </div>
      </form>

      {/* Day total: uses retoned MacroGrid. */}
      {entries.length > 0 && (
        <section className="mb-8">
          <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-3">
            Day total
          </h3>
          <MacroGrid values={todayTotal} />
        </section>
      )}

      {/* Entries */}
      <h3 className="font-display text-[24px] text-ink mb-4">
        {isToday ? "Today" : logDate}
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        // EmptyState: Food Log variant.
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-ink mb-4">
            <UtensilsCrossed size={28} aria-hidden />
          </div>
          <h4 className="font-display text-[22px] text-ink mb-2">
            Nothing logged{isToday ? " today" : ""}, yet.
          </h4>
          <p className="font-sans text-sm text-ink-mute leading-relaxed max-w-[260px] mx-auto">
            Pick a recipe above and tap <em>Log meal</em> when you eat.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-4 bg-card border border-rule rounded shadow-lift-sm p-4 sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="font-display text-[18px] text-ink truncate">
                  {entry.recipes?.name || "Unknown"}
                </div>
                <div className="font-sans text-xs text-ink-mute mt-0.5 uppercase tracking-[0.08em]">
                  {entry.meal}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm font-medium text-ink-soft tabular-nums">
                  {entry.portion_amount && entry.portion_unit
                    ? `${entry.portion_amount} ${entry.portion_unit}`
                    : `${entry.portion_g}g`}
                </div>
                <div className="font-mono text-sm font-semibold text-accent tabular-nums">
                  {entry.calories} cal
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
