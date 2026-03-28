"use client";

import { useState, useMemo } from "react";
import { Recipe } from "@/lib/types";
import RecipeCard from "./RecipeCard";
import { Search, Sparkles } from "lucide-react";
import clsx from "clsx";

const ALL_CUISINES = ["All", "American", "Italian", "Asian", "Mediterranean", "Moroccan", "Other"];
const ALL_DIETARY = ["All", "Vegetarian", "Gluten-Free", "Dairy-Free", "High Protein", "Comfort Food"];

export default function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");

  // Collect tags that actually exist in the data
  const availableTags = useMemo(() => {
    const cuisines = new Set(recipes.map(r => r.cuisineTag).filter(Boolean));
    const dietary = new Set(recipes.flatMap(r => r.dietaryTags));
    const tags = ["All"];
    ALL_CUISINES.forEach(c => { if (c !== "All" && cuisines.has(c)) tags.push(c); });
    ALL_DIETARY.forEach(d => { if (d !== "All" && dietary.has(d)) tags.push(d); });
    return tags;
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = search === "" ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.ingredients.some(ing => ing.name.toLowerCase().includes(search.toLowerCase()));
      const matchesTag = activeTag === "All" ||
        r.cuisineTag === activeTag ||
        r.dietaryTags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [recipes, search, activeTag]);

  return (
    <section>
      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-amber-600" />
          <input
            type="text"
            placeholder="Search recipes, ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 glass-input rounded-2xl text-slate-800 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={clsx(
                "px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-bold transition-all border active:scale-95",
                activeTag === tag
                  ? "bg-amber-600 text-white border-amber-500 shadow-[0_4px_12px_rgba(196,149,46,0.25)]"
                  : "glass text-slate-500 hover:bg-white/60"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-slate-800">
          {activeTag === "All" ? "Your Recipes" : activeTag}
        </h2>
        <span className="text-amber-700 font-bold text-sm">
          {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : search || activeTag !== "All" ? (
        <div className="text-center py-20 glass rounded-[3rem]">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Search className="w-7 h-7 text-amber-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No recipes found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Try a different search term or clear the filter.
          </p>
          <button
            onClick={() => { setSearch(""); setActiveTag("All"); }}
            className="mt-4 text-amber-700 text-sm font-bold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="text-center py-24 glass rounded-[3rem]">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
            <Sparkles className="w-8 h-8 text-amber-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No recipes yet</h3>
          <p className="text-slate-500 max-w-xs mx-auto">
            Add your first recipe to get started!
          </p>
        </div>
      )}
    </section>
  );
}
