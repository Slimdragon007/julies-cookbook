"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";
import {
  ShoppingBasket,
  Check,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
} from "lucide-react";
import clsx from "clsx";
import { Button, buttonClass } from "@/components/ui/Button";

interface GroceryItem {
  name: string;
  unit: string | null;
  quantity: number | null;
  category: string;
}

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
  const progress =
    totalItems === 0 ? 0 : Math.round((checked.size / totalItems) * 100);

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 px-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-accent">
              Aisle list
            </span>
          </div>
          <h1 className="font-display text-[40px] sm:text-[52px] text-ink leading-[1.05] mb-1">
            Shopping list
          </h1>
          <p className="font-sans text-base text-ink-soft">
            {showList
              ? `${totalItems - checked.size} items left to pick up.`
              : "Pick the recipes for the week; we combine the ingredients by aisle."}
          </p>
        </header>

        {recipes.length === 0 ? (
          <div className="text-center py-12 px-6 bg-card border border-rule rounded shadow-lift-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-ink mb-5">
              <ShoppingBasket size={28} aria-hidden />
            </div>
            <h3 className="font-display text-[24px] text-ink mb-2">
              The pantry is empty.
            </h3>
            <p className="font-sans text-sm text-ink-mute leading-relaxed max-w-[280px] mx-auto mb-6">
              Add a recipe or two, then come back to build a list.
            </p>
            <Link href="/add-recipe" className={buttonClass("primary")}>
              Add your first recipe
            </Link>
          </div>
        ) : !showList ? (
          <>
            {/* Selection controls */}
            <div className="flex items-center gap-3 mb-6 px-1">
              <button
                onClick={selectAll}
                className="font-sans text-accent text-xs font-semibold hover:text-accent-ink transition-colors"
              >
                Select all
              </button>
              <div className="w-1 h-1 rounded-full bg-rule" />
              <button
                onClick={clearAll}
                className="font-sans text-ink-mute text-xs font-semibold hover:text-ink-soft transition-colors"
              >
                Clear
              </button>
              <span className="ml-auto font-mono text-sm text-ink-soft tabular-nums">
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
                      "text-left rounded overflow-hidden transition-all duration-200 ease-hearth border p-4",
                      isSelected
                        ? "bg-accent-soft border-accent shadow-lift-sm"
                        : "bg-card border-rule hover:border-accent/40 hover:shadow-lift-sm",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
                          isSelected
                            ? "bg-accent border-accent"
                            : "border-rule bg-card",
                        )}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-accent-on stroke-[3]" />
                        )}
                      </div>
                      {recipe.imageUrl && (
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="font-display text-[16px] text-ink block truncate leading-tight">
                          {recipe.name}
                        </span>
                        <span className="font-mono text-xs text-ink-mute tabular-nums">
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
              <Button
                onClick={() => setShowList(true)}
                disabled={selected.size === 0}
              >
                Generate shopping list ({selected.size}{" "}
                {selected.size === 1 ? "recipe" : "recipes"})
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Progress card */}
            <div className="bg-card border border-rule rounded p-6 mb-10 relative overflow-hidden shadow-lift-sm">
              <div
                className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-soft/60 rounded-full blur-[60px] pointer-events-none"
                aria-hidden
              />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="font-sans text-sm font-semibold text-ink flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-accent" />
                  Progress
                </span>
                <span className="font-mono text-lg font-semibold text-accent tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="relative h-3 bg-paper rounded-full overflow-hidden border border-rule z-10">
                <div
                  className="h-full bg-accent rounded-full relative transition-all duration-500"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.18)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.18)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-shine_2s_linear_infinite]" />
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                setShowList(false);
                setChecked(new Set());
              }}
              className="inline-flex items-center gap-1.5 font-sans text-accent font-semibold text-sm mb-6 hover:gap-2.5 hover:text-accent-ink transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Change recipes
            </button>

            {/* Selected recipes summary */}
            <div className="bg-card border border-rule rounded px-5 py-3 mb-8 shadow-lift-sm">
              <p className="font-sans text-[11px] text-ink-mute font-semibold uppercase tracking-[0.1em] mb-1">
                Shopping for
              </p>
              <p className="font-sans text-sm text-ink-soft">
                {selectedRecipes.map((r) => r.name).join(", ")}
              </p>
            </div>

            {/* Grouped items by aisle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {groceryList &&
                groceryList.map(([category, items]) => (
                  <div key={category} className="flex flex-col">
                    <div className="flex items-baseline gap-3 mb-4 px-1">
                      <h3 className="font-display text-[22px] text-ink leading-none">
                        {category}
                      </h3>
                      <div className="h-px bg-rule flex-1" />
                      <span className="font-mono text-xs text-ink-mute tabular-nums">
                        {items.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => {
                        const key = `${item.name}|${item.unit}`;
                        const isChecked = checked.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleChecked(key)}
                            className={clsx(
                              "w-full flex items-center gap-4 py-3 px-4 rounded transition-all text-left border group",
                              isChecked
                                ? "bg-accent-soft/60 border-accent-soft"
                                : "bg-card border-rule hover:border-accent/40 hover:shadow-lift-sm",
                            )}
                          >
                            <div
                              className={clsx(
                                "w-9 h-9 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                isChecked
                                  ? "bg-accent border-accent"
                                  : "border-rule bg-paper",
                              )}
                            >
                              {isChecked && (
                                <Check className="w-5 h-5 text-accent-on stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={clsx(
                                "font-sans text-[15px] transition-all flex-1",
                                isChecked
                                  ? "text-ink-mute line-through"
                                  : "text-ink",
                              )}
                            >
                              {item.name}
                            </span>
                            {item.quantity !== null && (
                              <span
                                className={clsx(
                                  "font-mono text-xs flex-shrink-0 tabular-nums transition-colors",
                                  isChecked ? "text-ink-mute" : "text-ink-soft",
                                )}
                              >
                                {formatQty(item.quantity, item.unit)}
                              </span>
                            )}
                            {!isChecked && (
                              <ChevronRight className="w-4 h-4 text-ink-mute group-hover:text-accent transition-colors" />
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
