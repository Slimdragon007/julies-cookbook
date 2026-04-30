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
  const baseServings = defaultServings || 1;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  return (
    <div>
      {/* TabBar — spec §11. Sticky, frosted on scroll, brown active underline.
          top-0 since the (main) MainNav is a side/bottom nav, not a top header.
          Bleeds full-width via -mx so the underline divider runs edge-to-edge. */}
      <div
        role="tablist"
        aria-label="Recipe sections"
        className="sticky top-0 z-40 flex px-3 -mx-6 sm:-mx-10 mb-8 bg-glass-base backdrop-blur-glass backdrop-saturate-glass border-b border-glass-line"
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
                "flex-1 py-3.5 px-2 font-sans text-sm font-semibold",
                "border-b-2 border-transparent transition-all duration-200 ease-hearth",
                isActive
                  ? "text-brown border-brown"
                  : "text-ink-mute hover:text-ink-soft",
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
          totalBatchWeightG={totalBatchWeightG}
        />
      )}
    </div>
  );
}
