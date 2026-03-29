"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Recipe } from "@/lib/types";
import { calculatePortionMacros } from "@/lib/macros";
import { Loader2 } from "lucide-react";

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

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function FoodLogForm({ recipes }: { recipes: Recipe[] }) {
  const [recipeId, setRecipeId] = useState("");
  const [meal, setMeal] = useState<string>("Lunch");
  const [portionG, setPortionG] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useSWR(`/api/log-meal?date=${logDate}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  const entries: LogEntry[] = data?.entries || [];

  function calculateMacros() {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

    const grams = parseFloat(portionG) || 0;
    const { macros } = calculatePortionMacros(
      recipe.ingredients,
      grams,
      recipe.totalBatchWeightG,
      recipe.servings ?? 1
    );

    return {
      calories: macros.calories,
      protein_g: macros.protein,
      carbs_g: macros.carbs,
      fat_g: macros.fat,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipeId || !portionG) return;

    setSaving(true);
    setMessage("");

    const macros = calculateMacros();
    const selectedRecipe = recipes.find(r => r.id === recipeId);

    // Optimistic update — add entry immediately
    const optimisticEntry: LogEntry = {
      id: `temp-${Date.now()}`,
      recipe_id: recipeId,
      meal,
      portion_g: parseInt(portionG, 10),
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
      false
    );

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

    const responseData = await res.json();
    setSaving(false);

    if (responseData.success) {
      setMessage("Logged!");
      setPortionG("");
      // Revalidate to get the real entry with server-generated ID
      mutate(`/api/log-meal?date=${logDate}`);
    } else {
      setMessage("Couldn't save. Please try again.");
      // Revert optimistic update
      mutate(`/api/log-meal?date=${logDate}`);
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
      <form onSubmit={handleSubmit} className="glass-strong rounded-[2rem] p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">Recipe</label>
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl glass-input text-slate-800 text-[15px] font-bold"
              required
            >
              <option value="">Select a recipe...</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">Meal</label>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl glass-input text-slate-800 text-[15px] font-bold"
            >
              {MEALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">Portion (grams)</label>
            <input
              type="number"
              inputMode="numeric"
              value={portionG}
              onChange={(e) => setPortionG(e.target.value)}
              placeholder="e.g. 350"
              className="w-full h-14 px-5 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl glass-input text-slate-800 text-[15px] font-bold"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !recipeId || !portionG}
            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Log Meal"}
          </button>
          {message && (
            <span className="text-sm text-amber-700 font-bold">{message}</span>
          )}
        </div>
      </form>

      {/* Day totals */}
      {entries.length > 0 && (
        <div className="glass rounded-[2rem] px-6 py-5 mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Day Total</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Calories", value: todayTotal.cal, color: "text-amber-700", bg: "bg-amber-50" },
              { label: "Protein", value: `${todayTotal.p}g`, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Carbs", value: `${todayTotal.c}g`, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Fat", value: `${todayTotal.f}g`, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        {logDate === new Date().toISOString().split("T")[0] ? "Today" : logDate}
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400 font-medium">No meals logged yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between glass p-5 rounded-[1.75rem]"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[15px] font-bold text-slate-800 truncate block">
                  {entry.recipes?.name || "Unknown"}
                </span>
                <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full">{entry.meal}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-800">{entry.portion_g}g</span>
                <span className="text-xs text-amber-700 font-bold ml-2">{entry.calories} cal</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
