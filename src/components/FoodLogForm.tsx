"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/lib/types";

interface LogEntry {
  id: string;
  recipe_id: string;
  meal: string;
  portion_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  log_date: string;
  notes: string | null;
  recipes: { name: string } | null;
}

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export default function FoodLogForm({ recipes }: { recipes: Recipe[] }) {
  const [recipeId, setRecipeId] = useState("");
  const [meal, setMeal] = useState<string>("Lunch");
  const [portionG, setPortionG] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [message, setMessage] = useState("");

  async function loadEntries() {
    const res = await fetch(`/api/log-meal?date=${logDate}`);
    const data = await res.json();
    if (data.entries) setEntries(data.entries);
  }

  useEffect(() => {
    loadEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logDate]);

  function calculateMacros() {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

    const totals = recipe.ingredients.reduce(
      (acc, ing) => ({
        cal: acc.cal + (ing.calories ?? 0),
        p: acc.p + (ing.protein ?? 0),
        c: acc.c + (ing.carbs ?? 0),
        f: acc.f + (ing.fat ?? 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );

    const grams = parseFloat(portionG) || 0;

    if (recipe.totalBatchWeightG && recipe.totalBatchWeightG > 0) {
      const fraction = grams / recipe.totalBatchWeightG;
      return {
        calories: Math.round(totals.cal * fraction),
        protein_g: Math.round(totals.p * fraction),
        carbs_g: Math.round(totals.c * fraction),
        fat_g: Math.round(totals.f * fraction),
      };
    }

    // Fallback: per-serving estimate
    const servings = recipe.servings || 1;
    return {
      calories: Math.round(totals.cal / servings),
      protein_g: Math.round(totals.p / servings),
      carbs_g: Math.round(totals.c / servings),
      fat_g: Math.round(totals.f / servings),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipeId || !portionG) return;

    setSaving(true);
    setMessage("");

    const macros = calculateMacros();

    const res = await fetch("/api/log-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipeId,
        meal,
        portion_g: parseInt(portionG, 10),
        log_date: logDate,
        ...macros,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      setMessage("Logged!");
      setPortionG("");
      loadEntries();
    } else {
      setMessage(`Error: ${data.error}`);
    }
  }

  const todayTotal = entries.reduce(
    (acc, e) => ({
      cal: acc.cal + (e.calories || 0),
      p: acc.p + (e.protein_g || 0),
      c: acc.c + (e.carbs_g || 0),
      f: acc.f + (e.fat_g || 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <div>
      {/* Log form */}
      <form onSubmit={handleSubmit} className="bg-linen rounded-lg p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-body text-sm text-warm-dark mb-1">Recipe</label>
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-warm-dark font-body text-base focus:outline-none focus:ring-2 focus:ring-gold"
              required
            >
              <option value="">Select a recipe...</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-body text-sm text-warm-dark mb-1">Meal</label>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-warm-dark font-body text-base focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {MEALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-body text-sm text-warm-dark mb-1">Portion (grams)</label>
            <input
              type="number"
              inputMode="numeric"
              value={portionG}
              onChange={(e) => setPortionG(e.target.value)}
              placeholder="e.g. 350"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-warm-dark font-body text-base focus:outline-none focus:ring-2 focus:ring-gold"
              required
            />
          </div>
          <div>
            <label className="block font-body text-sm text-warm-dark mb-1">Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-warm-dark font-body text-base focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !recipeId || !portionG}
          className="w-full sm:w-auto px-6 py-3 bg-warm text-white font-body text-base rounded-lg hover:bg-warm-dark transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Log Meal"}
        </button>
        {message && (
          <span className="ml-3 font-body text-sm text-warm-dark">{message}</span>
        )}
      </form>

      {/* Today's totals */}
      {entries.length > 0 && (
        <div className="bg-linen rounded-lg px-5 py-4 mb-5">
          <h3 className="font-display text-sm text-warm-dark mb-3">Day Total</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="font-display text-lg text-warm-dark">{todayTotal.cal}</div>
              <div className="text-xs text-warm-light">Calories</div>
            </div>
            <div>
              <div className="font-display text-lg text-warm-dark">{todayTotal.p}g</div>
              <div className="text-xs text-warm-light">Protein</div>
            </div>
            <div>
              <div className="font-display text-lg text-warm-dark">{todayTotal.c}g</div>
              <div className="text-xs text-warm-light">Carbs</div>
            </div>
            <div>
              <div className="font-display text-lg text-warm-dark">{todayTotal.f}g</div>
              <div className="text-xs text-warm-light">Fat</div>
            </div>
          </div>
        </div>
      )}

      {/* Log entries */}
      <h3 className="font-display text-lg text-warm-dark mb-3">
        {logDate === new Date().toISOString().split("T")[0] ? "Today" : logDate}
      </h3>
      {entries.length === 0 ? (
        <p className="font-body text-sm text-warm-light">No meals logged yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-white border border-border rounded-lg px-4 py-3"
            >
              <div>
                <span className="font-body text-base text-warm-dark">
                  {entry.recipes?.name || "Unknown"}
                </span>
                <span className="text-warm-light text-xs ml-2">{entry.meal}</span>
              </div>
              <div className="text-right">
                <span className="font-display text-sm text-warm-dark">{entry.portion_g}g</span>
                <span className="text-warm-light text-xs ml-2">{entry.calories} cal</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
