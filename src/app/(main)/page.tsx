import { getAllRecipes } from "@/lib/data";
import RecipeCard from "@/components/RecipeCard";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(false, user?.id);

  const firstName = user?.email?.split("@")[0] || "Chef";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      {/* Welcome Header */}
      <header className="mb-10 px-2">
        <div className="flex items-center gap-3 mb-2">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              backgroundImage: "linear-gradient(45deg, #1d293d, #45556c, #00a6f4)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hello, {displayName}
          </h1>
          <Sparkles className="w-6 h-6 text-sky-400" />
        </div>
        <p className="text-slate-500 font-medium text-[15px]">
          Find your next favorite meal today.
        </p>
      </header>

      {/* Recipe Grid */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-bold text-slate-800">Your Recipes</h2>
          <span className="text-sky-600 font-bold text-sm">
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
            <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-sky-100">
              <Sparkles className="w-8 h-8 text-sky-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No recipes yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Add your first recipe to get started!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
