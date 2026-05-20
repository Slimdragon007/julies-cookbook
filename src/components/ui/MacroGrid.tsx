// MacroGrid — spec §9. Single source of truth for the calorie + protein +
// carbs + fat readout. Used by NutritionTab and FoodLog day totals; will
// also be used by Phase 3 Weekly Summary. Each cell: brown caption + ink
// tabular-nums value. Drops per-macro coloring per Hearth Rule 4.

export type MacroValues = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

const FIELDS = [
  { key: "calories", label: "Calories", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const;

function format(v: number | null) {
  if (v === null) return "—";
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
}

export default function MacroGrid({ values }: { values: MacroValues }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {FIELDS.map(({ key, label, unit }) => {
        const v = values[key];
        return (
          <div key={key} className="bg-card border border-rule rounded p-4">
            <div className="font-sans text-[11px] tracking-[0.08em] uppercase text-ink-mute font-semibold mb-1.5">
              {label}
            </div>
            <div className="font-sans text-2xl font-semibold text-ink tabular-nums">
              {format(v)}
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
