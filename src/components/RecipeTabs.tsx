"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import IngredientsTab from "./IngredientsTab";
import InstructionsTab from "./InstructionsTab";
import NutritionTab from "./NutritionTab";
import clsx from "clsx";

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

export default function RecipeTabs({ ingredients, preparation, defaultServings, totalBatchWeightG }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>("ingredients");
  const baseServings = defaultServings || 1;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-10 glass rounded-2xl mb-8 p-1.5">
        <div className="flex">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                "flex-1 py-3 text-center text-sm font-bold transition-all rounded-xl",
                activeTab === key
                  ? "text-amber-700 bg-white border border-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
          totalBatchWeightG={totalBatchWeightG}
        />
      )}
    </div>
  );
}
