import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllRecipes } from "@/lib/data";
import RecipeCard from "@/components/RecipeCard";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Recipes — Julie's Cookbook",
};

export const dynamic = "force-dynamic";

// Header renders instantly (only needs user email, fast query)
async function WelcomeHeader() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.email?.split("@")[0] || "Chef";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <header className="mb-10 px-2">
      <div className="flex items-center gap-3 mb-2">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{
            backgroundImage: "linear-gradient(45deg, #2D2417, #8B7355, #C4952E)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Hello, {displayName}
        </h1>
        <Sparkles className="w-6 h-6 text-amber-500" />
      </div>
      <p className="text-slate-500 font-medium text-[15px]">
        Find your next favorite meal today.
      </p>
    </header>
  );
}

// Recipe grid streams in after header
async function RecipeGrid() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(false, user?.id);

  return (
    <section>
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-slate-800">Your Recipes</h2>
        <span className="text-amber-700 font-bold text-sm">
          {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
        </span>
      </div>

      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
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

// Skeleton for recipe grid while streaming
function RecipeGridSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="h-6 w-32 bg-slate-200/50 rounded-xl animate-pulse" />
        <div className="h-5 w-20 bg-slate-100/50 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-[2.5rem] overflow-hidden animate-pulse">
            <div className="h-64 bg-slate-200/30" />
            <div className="p-6 pt-5">
              <div className="h-6 w-3/4 bg-slate-200/50 rounded-xl mb-4" />
              <div className="flex gap-6">
                <div className="h-4 w-24 bg-slate-100/50 rounded-lg" />
                <div className="h-4 w-16 bg-slate-100/50 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      <Suspense>
        <WelcomeHeader />
      </Suspense>
      <Suspense fallback={<RecipeGridSkeleton />}>
        <RecipeGrid />
      </Suspense>
    </div>
  );
}
