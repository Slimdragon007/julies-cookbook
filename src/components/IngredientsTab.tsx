"use client";

import { Ingredient } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MeasurementToggle } from "@/components/ui/MeasurementToggle";
import { useMeasurementSystem } from "@/lib/measurement-system";
import { convertForDisplay } from "@/lib/unit-conversions";

interface Props {
  ingredients: Ingredient[];
  defaultServings: number | null;
  servings: number;
  onServingsChange: (s: number) => void;
}

function formatMetricAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}

export default function IngredientsTab({
  ingredients,
  defaultServings,
  servings,
  onServingsChange,
}: Props) {
  const baseServings = defaultServings || 1;
  const scale = servings / baseServings;
  const { system } = useMeasurementSystem();

  // Returns the rendered quantity + unit pair for one ingredient row.
  // - Imperial keeps the existing cooking-fraction formatter ("1 1/2 cups").
  // - Metric converts known units to ml/g; for pass-through units (each, can)
  //   the label is unchanged so fractions still render naturally.
  function renderQuantity(ing: Ingredient): { qty: string; unit: string } {
    if (ing.quantity == null) return { qty: "", unit: ing.unit ?? "" };
    if (system === "imperial") {
      return { qty: formatQuantity(ing.quantity, scale), unit: ing.unit ?? "" };
    }
    const { amount, label } = convertForDisplay(
      ing.quantity * scale,
      ing.unit,
      "metric",
    );
    const isPassThrough = label === (ing.unit ?? "");
    const qty = isPassThrough
      ? formatQuantity(ing.quantity, scale)
      : formatMetricAmount(amount);
    return { qty, unit: label };
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  // Group by category. Ingredients with no category fall into "Other".
  const grouped = ingredients.reduce<Record<string, Ingredient[]>>(
    (acc, ing) => {
      const cat = ing.category?.trim() || "Other";
      (acc[cat] ||= []).push(ing);
      return acc;
    },
    {},
  );
  const categories = Object.keys(grouped);
  const showHeadings = categories.length > 1 || categories[0] !== "Other";

  return (
    <div>
      {/* Header band — units toggle on top, servings scaler below. Card surface
          so the two related controls read as one group. */}
      <div className="mb-8 -mx-6 sm:-mx-10 lg:mx-0 lg:rounded border-y border-rule bg-card">
        <div className="flex items-center justify-end px-5 pt-3">
          <MeasurementToggle />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 pb-4 pt-2">
          <span className="font-sans text-sm text-ink-soft">Scale recipe</span>
          <div className="flex items-center gap-2.5">
            <Button
              variant="icon"
              onClick={() => onServingsChange(Math.max(1, servings - 1))}
              disabled={servings <= 1}
              aria-label="Decrease servings"
            >
              <span className="w-8 h-8 rounded-full bg-accent text-accent-on flex items-center justify-center transition-transform duration-150 hover:bg-accent-ink hover:scale-105">
                <Minus size={16} />
              </span>
            </Button>
            <span className="font-mono text-base font-semibold text-ink min-w-[80px] text-center transition-opacity duration-200 tabular-nums">
              {servings} {servingsLabel}
            </span>
            <Button
              variant="icon"
              onClick={() => onServingsChange(servings + 1)}
              aria-label="Increase servings"
            >
              <span className="w-8 h-8 rounded-full bg-accent text-accent-on flex items-center justify-center transition-transform duration-150 hover:bg-accent-ink hover:scale-105">
                <Plus size={16} />
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* IngredientList — paper editorial. Grouped sections, rule row dividers. */}
      <div>
        {categories.map((category) => (
          <section key={category} className="mb-6">
            {showHeadings && (
              <h4 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-2.5">
                {category}
              </h4>
            )}
            {grouped[category].map((ing) => {
              const { qty, unit } = renderQuantity(ing);
              return (
                <div
                  key={ing.id}
                  className="flex justify-between gap-4 py-2.5 border-b border-rule last:border-b-0"
                >
                  <span className="font-sans text-base text-ink">
                    {ing.name}
                  </span>
                  <span className="font-mono text-sm font-medium text-ink-soft tabular-nums whitespace-nowrap">
                    {qty && <>{qty} </>}
                    {unit}
                  </span>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
