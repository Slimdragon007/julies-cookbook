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
}

export default function RecipeTabs({ ingredients, preparation, defaultServings }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>("ingredients");
  const baseServings = defaultServings || 1;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  return (
    <div>
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 bg-cream border-b border-border mb-6">
        <div className="flex">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-center font-body text-base transition-colors relative ${
                activeTab === key
                  ? "text-warm-dark font-semibold"
                  : "text-warm-light"
              }`}
            >
              {label}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-warm" />
              )}
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
        />
      )}
    </div>
  );
}
