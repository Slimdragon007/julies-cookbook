"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import { formatQuantity } from "@/lib/fractions";
import { Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MeasurementToggle } from "@/components/ui/MeasurementToggle";
import { Mono } from "@/components/ui/Mono";
import { useMeasurementSystem } from "@/lib/measurement-system";
import { convertForDisplay } from "@/lib/unit-conversions";
import { cn } from "@/lib/utils";

interface Props {
  ingredients: Ingredient[];
  defaultServings: number | null;
  servings: number;
  onServingsChange: (s: number) => void;
}

function formatDisplayAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}

export default function IngredientsTab({
  ingredients,
  defaultServings,
  servings,
  onServingsChange,
}: Props) {
  const fallbackServings = defaultServings ?? 1;
  const baseServings = fallbackServings > 0 ? fallbackServings : 1;
  const scale = servings / baseServings;
  const { system } = useMeasurementSystem();

  // Local checkbox state for cooking-mode mark-off (per TASK-027 Phase 3,
  // prototype mobile.jsx MRecipe ingredient rows). Pure UI state; resets
  // when the user navigates away from the recipe. Persisting per-recipe
  // would be a separate scope item (no current call site for it).
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  function renderQuantity(ing: Ingredient): { qty: string; unit: string } {
    if (ing.quantity == null) {
      const original = convertForDisplay(0, ing.unit, "original");
      return { qty: "", unit: original.label };
    }
    const scaledAmount = ing.quantity * scale;
    const original = convertForDisplay(scaledAmount, ing.unit, "original");
    const { amount, label } = convertForDisplay(scaledAmount, ing.unit, system);
    const wasConverted = amount !== original.amount || label !== original.label;
    const qty = wasConverted
      ? formatDisplayAmount(amount)
      : formatQuantity(ing.quantity, scale);
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

  // Notes are a no-op today (the schema has no `note` column yet), but the
  // UI wires the asterisk-superscript + footnote-block pattern from
  // prototype mobile.jsx MRecipe lines 352-361 so that when notes land
  // they render correctly without another UI pass.
  const ingredientsWithNotes = ingredients.filter((ing) => ing.note);

  return (
    <div>
      {/* Header band — units toggle on top, servings scaler below. Card surface
          so the two related controls read as one group. */}
      <div className="mb-8 -mx-6 sm:-mx-10 lg:mx-0 lg:rounded border-y border-rule bg-card">
        <div className="flex items-center justify-between gap-3 px-5 pt-3">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
            Ingredient units
          </span>
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

      {/* IngredientList — paper editorial. Grouped sections, rule row dividers.
          Each row is now a button toggling its checked state. The checkbox is
          a 22×22 square on the left; clicking the row (anywhere) toggles. */}
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
              const isChecked = !!checked[ing.id];
              return (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggle(ing.id)}
                  className={cn(
                    "w-full flex items-center gap-3 py-2.5 border-b border-rule last:border-b-0 text-left transition-opacity",
                    isChecked && "opacity-50",
                  )}
                  aria-pressed={isChecked}
                  aria-label={`${isChecked ? "Uncheck" : "Check off"} ${ing.name}`}
                >
                  {/* Checkbox — 22×22 square, accent-bg when checked. */}
                  <span
                    aria-hidden
                    className={cn(
                      "w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
                      isChecked
                        ? "bg-accent border-accent text-accent-on"
                        : "border-rule bg-card",
                    )}
                  >
                    {isChecked ? <Check size={14} strokeWidth={3} /> : null}
                  </span>

                  <span
                    className={cn(
                      "font-sans text-base text-ink flex-1",
                      isChecked && "line-through",
                    )}
                  >
                    {ing.name}
                    {ing.note ? (
                      <sup
                        className="text-accent font-semibold ml-0.5"
                        aria-label={`Note: ${ing.note}`}
                      >
                        *
                      </sup>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium text-ink-soft tabular-nums whitespace-nowrap",
                      isChecked && "line-through",
                    )}
                  >
                    {qty && <>{qty} </>}
                    {unit}
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>

      {/* Footnote block — only renders when at least one ingredient has a
          note. Notes are off today (schema gap); this block stays in the
          tree as the rendering target for future data. */}
      {ingredientsWithNotes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-rule space-y-1.5">
          {ingredientsWithNotes.map((ing) => (
            <div
              key={`note-${ing.id}`}
              className="flex gap-2 text-xs text-ink-soft leading-relaxed"
            >
              <span className="text-accent font-semibold shrink-0" aria-hidden>
                *
              </span>
              <span>
                <span className="font-medium text-ink">{ing.name}</span> —{" "}
                {ing.note}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Servings summary footer — kept Mono for tabular feel. */}
      <p className="font-sans text-xs text-ink-mute mt-6 italic">
        Scaled to <Mono>{servings}</Mono> {servingsLabel} from{" "}
        <Mono>{baseServings}</Mono>.
      </p>
    </div>
  );
}
