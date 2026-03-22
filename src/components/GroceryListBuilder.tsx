"use client";

import { useState } from "react";
import { Recipe } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";

interface GroceryItem {
  name: string;
  unit: string | null;
  quantity: number | null;
  category: string;
}

// Category display order
const CATEGORY_ORDER = [
  "Produce",
  "Protein",
  "Dairy",
  "Grains & Pasta",
  "Canned & Jarred",
  "Spices & Seasonings",
  "Oils & Condiments",
  "Baking",
  "Other",
];

function combineIngredients(recipes: Recipe[]): Array<[string, GroceryItem[]]> {
  const merged = new Map<string, GroceryItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      // Key by lowercase name + unit for deduplication
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

  // Group by category
  const byCategory = new Map<string, GroceryItem[]>();
  Array.from(merged.values()).forEach((item) => {
    const cat = item.category || "Other";
    const list = byCategory.get(cat) || [];
    list.push(item);
    byCategory.set(cat, list);
  });

  // Sort categories by predefined order, then any remaining
  const result: Array<[string, GroceryItem[]]> = [];
  for (const cat of CATEGORY_ORDER) {
    const items = byCategory.get(cat);
    if (items) {
      items.sort((a: GroceryItem, b: GroceryItem) => a.name.localeCompare(b.name));
      result.push([cat, items]);
    }
  }
  Array.from(byCategory.entries()).forEach(([cat, items]) => {
    if (!result.some(([c]) => c === cat)) {
      items.sort((a: GroceryItem, b: GroceryItem) => a.name.localeCompare(b.name));
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

  // Count total items for summary
  let totalItems = 0;
  if (groceryList) {
    for (const [, items] of groceryList) totalItems += items.length;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-warm-dark">Grocery List</h2>
          <p className="font-body text-sm text-warm-light mt-1">
            Select recipes to generate a combined shopping list
          </p>
        </div>
        <a
          href="/"
          className="font-body text-sm text-warm hover:text-warm-dark transition-colors"
        >
          &larr; Back to recipes
        </a>
      </div>

      {!showList ? (
        <>
          {/* Selection controls */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={selectAll}
              className="font-body text-xs text-warm hover:text-warm-dark transition-colors"
            >
              Select all
            </button>
            <span className="text-border">|</span>
            <button
              onClick={clearAll}
              className="font-body text-xs text-warm hover:text-warm-dark transition-colors"
            >
              Clear
            </button>
            <span className="ml-auto font-body text-sm text-warm-light">
              {selected.size} selected
            </span>
          </div>

          {/* Recipe grid with checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => {
              const isSelected = selected.has(recipe.id);
              return (
                <button
                  key={recipe.id}
                  onClick={() => toggle(recipe.id)}
                  className={`text-left rounded-xl border overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? "border-warm ring-2 ring-warm/20 bg-white"
                      : "border-border bg-white hover:border-warm-light"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-warm border-warm text-white"
                          : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="font-display text-sm text-warm-dark block truncate">
                        {recipe.name}
                      </span>
                      <span className="font-body text-xs text-warm-light">
                        {recipe.ingredients.length} ingredients
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Generate button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowList(true)}
              disabled={selected.size === 0}
              className="font-display text-sm px-8 py-3 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-warm text-white hover:bg-warm-dark"
            >
              Generate Shopping List ({selected.size} {selected.size === 1 ? "recipe" : "recipes"})
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Shopping list view */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                setShowList(false);
                setChecked(new Set());
              }}
              className="font-body text-sm text-warm hover:text-warm-dark transition-colors"
            >
              &larr; Change recipes
            </button>
            <span className="ml-auto font-body text-sm text-warm-light">
              {checked.size}/{totalItems} items checked
            </span>
          </div>

          {/* Selected recipes summary */}
          <div className="bg-linen rounded-lg px-4 py-3 mb-6">
            <p className="font-body text-xs text-warm-light mb-1">Shopping for:</p>
            <p className="font-display text-sm text-warm-dark">
              {selectedRecipes.map((r) => r.name).join(", ")}
            </p>
          </div>

          {/* Grouped items */}
          {groceryList && groceryList.map(([category, items]) => (
            <section key={category} className="mb-6">
              <h3 className="font-display text-base text-warm-dark mb-2 pb-1 border-b border-border">
                {category}
              </h3>
              <ul className="space-y-0">
                {items.map((item) => {
                  const key = `${item.name}|${item.unit}`;
                  const isChecked = checked.has(key);
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggleChecked(key)}
                        className="w-full flex items-center gap-3 py-2 px-1 text-left hover:bg-linen/50 rounded transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? "bg-warm border-warm text-white"
                              : "border-warm-light"
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`font-body text-sm flex-1 transition-colors ${
                            isChecked ? "line-through text-warm-light" : "text-warm-dark"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.quantity !== null && (
                          <span
                            className={`font-body text-xs flex-shrink-0 transition-colors ${
                              isChecked ? "text-warm-light/50" : "text-warm-light"
                            }`}
                          >
                            {formatQty(item.quantity, item.unit)}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
