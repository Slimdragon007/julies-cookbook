import { Ingredient } from "@/lib/types";

interface Props {
  ingredients: Ingredient[];
  scale: number;
  servings: number;
}

const MACRO_FIELDS = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
] as const;

export default function NutritionTab({ ingredients, scale, servings }: Props) {
  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function fmt(val: number | null, unit = "") {
    if (val === null) return "—";
    const scaled = val * scale;
    const num = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
    return num + unit;
  }

  const servingsLabel = servings === 1 ? "serving" : "servings";

  return (
    <div>
      <h2 className="font-display text-xl text-warm-dark mb-5">
        Nutritional Facts
      </h2>

      {/* Totals summary */}
      <div className="bg-linen rounded-lg px-5 py-4 mb-5">
        <h3 className="font-display text-sm text-warm-dark mb-3">
          Total
          {scale !== 1 && (
            <span className="text-warm-light font-body text-xs ml-2">
              (scaled to {servings} {servingsLabel})
            </span>
          )}
        </h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          {MACRO_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div className="font-display text-lg text-warm-dark">
                {fmt(totals[key])}
              </div>
              <div className="text-xs text-warm-light">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-ingredient breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-border text-left text-warm-light text-xs">
              <th className="py-2.5 pr-4 font-normal">Ingredient</th>
              <th className="py-2.5 px-2 font-normal text-right">Cal</th>
              <th className="py-2.5 px-2 font-normal text-right">Protein</th>
              <th className="py-2.5 px-2 font-normal text-right">Carbs</th>
              <th className="py-2.5 pl-2 font-normal text-right">Fat</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.id} className="border-b border-border/30">
                <td className="py-2.5 pr-4 text-warm-dark">{ing.name}</td>
                <td className="py-2.5 px-2 text-right text-warm-light">
                  {fmt(ing.calories)}
                </td>
                <td className="py-2.5 px-2 text-right text-warm-light">
                  {fmt(ing.protein, "g")}
                </td>
                <td className="py-2.5 px-2 text-right text-warm-light">
                  {fmt(ing.carbs, "g")}
                </td>
                <td className="py-2.5 pl-2 text-right text-warm-light">
                  {fmt(ing.fat, "g")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
