"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import IngredientsTab from "./IngredientsTab";
import InstructionsTab from "./InstructionsTab";
import NutritionTab from "./NutritionTab";
import { cn } from "@/lib/utils";

type TabName = "ingredients" | "instructions" | "nutrition";

const TABS: { key: TabName; label: string }[] = [
  { key: "ingredients", label: "Ingredients" },
  { key: "instructions", label: "Instructions" },
  { key: "nutrition", label: "Nutrition" },
];

interface Props {
  ingredients: Ingredient[];
  preparation: string;
  defaultServings: number | null;
  totalBatchWeightG: number | null;
}

export default function RecipeTabs({
  ingredients,
  preparation,
  defaultServings,
  totalBatchWeightG,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabName>("ingredients");
  const fallbackServings = defaultServings ?? 1;
  const baseServings = fallbackServings > 0 ? fallbackServings : 1;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  return (
    <div>
      {/* TabBar — MISE segmented control. Sticky so long recipes keep the
          section switcher reachable without bringing back the old glass tab. */}
      <div
        role="tablist"
        aria-label="Recipe sections"
        className="sticky top-0 z-40 mb-8 grid grid-cols-3 gap-1 rounded-pill border border-rule bg-card p-1"
      >
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(key)}
              className={cn(
                "min-h-11 rounded-pill px-2 font-sans text-[12px] font-semibold",
                "transition-all duration-200 ease-hearth",
                isActive
                  ? "bg-ink text-card shadow-none"
                  : "text-ink-soft hover:bg-ink/5 hover:text-ink",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "ingredients" && (
        <IngredientsTab
          ingredients={ingredients}
          defaultServings={defaultServings}
          servings={servings}
          onServingsChange={setServings}
        />
      )}
      {activeTab === "instructions" && (
        <InstructionsTab preparation={preparation} />
      )}
      {activeTab === "nutrition" && (
        <NutritionTab
          ingredients={ingredients}
          scale={scale}
          servings={servings}
          defaultServings={defaultServings}
          totalBatchWeightG={totalBatchWeightG}
        />
      )}
    </div>
  );
}
