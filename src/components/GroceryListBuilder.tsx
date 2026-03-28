"use client";

import { useState } from "react";
import Image from "next/image";
import { Recipe } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";
import { ShoppingBasket, Check, ChevronRight, ChevronLeft, LayoutGrid } from "lucide-react";
import clsx from "clsx";

interface GroceryItem {
  name: string;
  unit: string | null;
  quantity: number | null;
  category: string;
}

const CATEGORY_ORDER = [
  "Produce", "Protein", "Dairy", "Grains & Pasta",
  "Canned & Jarred", "Spices & Seasonings", "Oils & Condiments", "Baking", "Other",
];

function combineIngredients(recipes: Recipe[]): Array<[string, GroceryItem[]]> {
  const merged = new Map<string, GroceryItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}|${(ing.unit || "").toLowerCase()}`;
      const existing = merged.get(key);

      if (existing) {
        if (existing.quantity !== null && ing.quantity !== null) {
          existing.quantity += ing.quantity;
        } else if (ing.quantity !== null) {
          existing.quantity = ing.quantity;
        }
      } else {
        merged.set(key, {
          name: ing.name,
          unit: ing.unit,
          quantity: ing.quantity,
          category: ing.category || "Other",
        });
      }
    }
  }

  const byCategory = new Map<string, GroceryItem[]>();
  Array.from(merged.values()).forEach((item) => {
    const cat = item.category || "Other";
    const list = byCategory.get(cat) || [];
    list.push(item);
    byCategory.set(cat, list);
  });

  const result: Array<[string, GroceryItem[]]> = [];
  for (const cat of CATEGORY_ORDER) {
    const items = byCategory.get(cat);
    if (items) {
      items.sort((a, b) => a.name.localeCompare(b.name));
      result.push([cat, items]);
    }
  }
  Array.from(byCategory.entries()).forEach(([cat, items]) => {
    if (!result.some(([c]) => c === cat)) {
      items.sort((a, b) => a.name.localeCompare(b.name));
      result.push([cat, items]);
    }
  });

  return result;
}

function formatQty(qty: number | null, unit: string | null): string {
  if (qty === null) return "";
  const num = formatQuantity(qty);
  return unit ? `${num} ${unit}` : num;
}

export default function GroceryListBuilder({ recipes }: { recipes: Recipe[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showList, setShowList] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(recipes.map((r) => r.id)));
  }

  function clearAll() {
    setSelected(new Set());
    setShowList(false);
    setChecked(new Set());
  }

  function toggleChecked(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedRecipes = recipes.filter((r) => selected.has(r.id));
  const groceryList = showList ? combineIngredients(selectedRecipes) : null;

  let totalItems = 0;
  if (groceryList) {
    for (const [, items] of groceryList) totalItems += items.length;
  }
  const progress = totalItems === 0 ? 0 : Math.round((checked.size / totalItems) * 100);

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 selection:bg-amber-100 selection:text-amber-900">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
                  <ShoppingBasket className="w-6 h-6 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Shopping List</h1>
              </div>
              <p className="text-slate-500 font-medium pl-1 text-[15px]">
                {showList
                  ? `${totalItems - checked.size} items left to pick up`
                  : "Select recipes to generate a combined shopping list"}
              </p>
            </div>
          </div>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-24 glass rounded-[3rem]">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
              <ShoppingBasket className="w-8 h-8 text-amber-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No recipes yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-6">
              Add some recipes first, then come back to build your shopping list.
            </p>
            <a
              href="/add-recipe"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add Your First Recipe
            </a>
          </div>
        ) : !showList ? (
          <>
            {/* Selection controls */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={selectAll}
                className="text-amber-700 text-xs font-bold hover:underline transition-colors"
              >
                Select all
              </button>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <button
                onClick={clearAll}
                className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
              <span className="ml-auto text-sm text-slate-500 font-semibold">
                {selected.size} selected
              </span>
            </div>

            {/* Recipe grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => {
                const isSelected = selected.has(recipe.id);
                return (
                  <button
                    key={recipe.id}
                    onClick={() => toggle(recipe.id)}
                    className={clsx(
                      "text-left rounded-[1.75rem] overflow-hidden transition-all duration-200 border p-4",
                      isSelected
                        ? "bg-amber-50/50 border-amber-200 shadow-[0_4px_12px_rgba(196,149,46,0.1)]"
                        : "glass hover:bg-white/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-7 h-7 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          isSelected
                            ? "bg-amber-600 border-amber-600 shadow-[0_4px_12px_rgba(196,149,46,0.3)]"
                            : "border-amber-200 bg-white"
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </div>
                      {recipe.imageUrl && (
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          width={40}
                          height={40}
                          className="rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-800 block truncate">
                          {recipe.name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {recipe.ingredients.length} ingredients
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Generate button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowList(true)}
                disabled={selected.size === 0}
                className="px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold transition-all disabled:opacity-40 shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:shadow-[0_12px_32px_rgba(196,149,46,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Generate Shopping List ({selected.size} {selected.size === 1 ? "recipe" : "recipes"})
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Progress bar */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 mb-10 items-stretch">
              <div className="glass p-6 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-200/15 rounded-full blur-[60px] pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-amber-500" />
                    Progress
                  </span>
                  <span className="text-lg font-black text-amber-700">{progress}%</span>
                </div>
                <div className="relative h-4 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden border border-white/40 shadow-inner z-10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-700 rounded-full relative transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-shine_2s_linear_infinite]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => { setShowList(false); setChecked(new Set()); }}
              className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-6 hover:gap-3 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Change recipes
            </button>

            {/* Selected recipes summary */}
            <div className="glass rounded-2xl px-5 py-3 mb-8">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Shopping for:</p>
              <p className="text-sm text-slate-800 font-bold">
                {selectedRecipes.map((r) => r.name).join(", ")}
              </p>
            </div>

            {/* Grouped items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {groceryList && groceryList.map(([category, items]) => (
                <div key={category} className="flex flex-col">
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      {category}
                    </h3>
                    <div className="h-px bg-slate-100 flex-1 ml-2" />
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const key = `${item.name}|${item.unit}`;
                      const isChecked = checked.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleChecked(key)}
                          className={clsx(
                            "w-full flex items-center gap-4 p-5 rounded-[1.75rem] transition-all text-left border group relative overflow-hidden",
                            isChecked
                              ? "bg-white/20 border-white/40 opacity-70"
                              : "glass hover:bg-white/60 hover:border-amber-200"
                          )}
                        >
                          <div className={clsx(
                            "w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all",
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                              : "border-amber-200 bg-white group-hover:border-amber-300"
                          )}>
                            {isChecked && <Check className="w-5 h-5 text-white stroke-[4]" />}
                          </div>
                          <span className={clsx(
                            "text-[15px] font-bold transition-all flex-1",
                            isChecked ? "text-slate-400 line-through" : "text-slate-700"
                          )}>
                            {item.name}
                          </span>
                          {item.quantity !== null && (
                            <span className={clsx(
                              "text-xs flex-shrink-0 font-semibold transition-colors",
                              isChecked ? "text-slate-300" : "text-slate-400"
                            )}>
                              {formatQty(item.quantity, item.unit)}
                            </span>
                          )}
                          {!isChecked && (
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
