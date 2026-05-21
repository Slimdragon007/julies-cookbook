"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import RecipeCard from "./RecipeCard";
import { Search, BookOpen, Plus } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ALL_CUISINES = [
  "American",
  "Italian",
  "Asian",
  "Mediterranean",
  "Moroccan",
  "Other",
];
const ALL_DIETARY = [
  "Vegetarian",
  "Gluten-Free",
  "Dairy-Free",
  "High Protein",
  "Comfort Food",
];

interface RecipeGridProps {
  recipes: Recipe[];
  /** Map of recipe_id → number of times logged. Threaded to each RecipeCard
   *  so the mobile horizontal layout can render the "cooked Nx" eyebrow.
   *  Optional; defaults to empty Map. */
  cookedCounts?: Map<string, number>;
}

export default function RecipeGrid({ recipes, cookedCounts }: RecipeGridProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");

  // Collect tags that actually exist in the data.
  const availableTags = useMemo(() => {
    const cuisines = new Set(recipes.map((r) => r.cuisineTag).filter(Boolean));
    const dietary = new Set(recipes.flatMap((r) => r.dietaryTags));
    const tags = ["All"];
    ALL_CUISINES.forEach((c) => {
      if (cuisines.has(c)) tags.push(c);
    });
    ALL_DIETARY.forEach((d) => {
      if (dietary.has(d)) tags.push(d);
    });
    return tags;
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        search === "" ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesTag =
        activeTag === "All" ||
        r.cuisineTag === activeTag ||
        r.dietaryTags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [recipes, search, activeTag]);

  return (
    <section>
      {/* Search + Filter row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mb-8">
        <div className="flex-1 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute w-4 h-4 transition-colors group-focus-within:text-accent"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search recipes, ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 pl-11 py-3 rounded-pill bg-card border border-rule font-sans text-[15px] text-ink placeholder:text-ink-mute outline-none transition-colors focus:border-accent focus:bg-card"
            aria-label="Search recipes"
          />
        </div>

        {/* Filter chips — spec §2 Chip pattern. */}
        <div
          role="tablist"
          aria-label="Filter recipes"
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
        >
          {availableTags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-pill",
                  "font-sans font-medium text-[13px]",
                  "border transition-colors duration-150 ease-hearth",
                  "whitespace-nowrap",
                  isActive
                    ? "bg-accent text-accent-on border-accent"
                    : "bg-card text-ink-soft border-rule hover:bg-accent-soft hover:text-accent-ink",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-baseline justify-between mb-5 px-1">
        <h2 className="font-display text-[24px] text-ink">
          {activeTag === "All" ? "Your recipes" : activeTag}
        </h2>
        <span className="font-mono text-sm font-medium text-ink-mute tabular-nums">
          {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
        </span>
      </div>

      {/* Grid — spec: 2-col mobile, 4-col desktop (sm step at 2-col stays). */}
      {filtered.length > 0 ? (
        // Mobile: single-column horizontal cards (Phase 2 prototype-parity).
        // Desktop md+: 2-col / 4-col grid of portrait cards (existing).
        <div className="flex flex-col gap-1 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              cookedCount={cookedCounts?.get(recipe.id)}
            />
          ))}
        </div>
      ) : search || activeTag !== "All" ? (
        // EmptyState (filtered to nothing) — spec §17 with "useful copy" tone.
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-ink mb-5">
            <Search size={28} aria-hidden />
          </div>
          <h3 className="font-display text-[24px] text-ink mb-2">
            Nothing matches that.
          </h3>
          <p className="font-sans text-sm text-ink-mute leading-relaxed max-w-[260px] mx-auto mb-5">
            Try a different word, or clear the filter to see everything.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch("");
              setActiveTag("All");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        // EmptyState (no recipes at all) — spec §17 verbatim copy.
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-soft text-accent-ink mb-5">
            <BookOpen size={36} aria-hidden />
          </div>
          <h3 className="font-display text-[24px] text-ink mb-2">
            The kitchen is quiet.
          </h3>
          <p className="font-sans text-sm text-ink-mute leading-relaxed max-w-[260px] mx-auto mb-5">
            Import your first recipe from any URL. We&apos;ll handle the rest.
          </p>
          <Link href="/add-recipe" className={buttonClass("primary")}>
            <Plus size={16} aria-hidden />
            Add a recipe
          </Link>
        </div>
      )}
    </section>
  );
}
