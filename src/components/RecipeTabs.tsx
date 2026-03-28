"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import IngredientsTab from "./IngredientsTab";
import InstructionsTab from "./InstructionsTab";
import NutritionTab from "./NutritionTab";

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
      {/* Sticky tab bar */}
      <div className="sticky top-16 z-10 glass rounded-xl mb-6">
        <div className="flex">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-center font-body text-base transition-colors relative rounded-xl ${
                activeTab === key
                  ? "text-gold font-semibold bg-gold/10"
                  : "text-warm-light"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
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
