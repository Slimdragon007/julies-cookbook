export const runtime = "edge";

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllRecipes } from "@/lib/data";
import RecipeGrid from "@/components/RecipeGrid";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Recipes — Julie's Cookbook",
};

async function WelcomeHeader() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.display_name
    || (user?.email?.split("@")[0] || "Chef").replace(/^\w/, (c: string) => c.toUpperCase());

  return (
    <header className="mb-8 px-2">
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

async function RecipeSection() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(false, user?.id);
  return <RecipeGrid recipes={recipes} />;
}

function RecipeGridSkeleton() {
  return (
    <section>
      <div className="h-14 bg-slate-100/30 rounded-2xl mb-8 animate-pulse" />
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="h-6 w-32 bg-slate-200/50 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-[2.5rem] overflow-hidden animate-pulse">
            <div className="h-64 bg-slate-200/30" />
            <div className="p-6 pt-5">
              <div className="h-6 w-3/4 bg-slate-200/50 rounded-xl mb-4" />
              <div className="flex gap-6">
                <div className="h-4 w-24 bg-slate-100/50 rounded-lg" />
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
        <RecipeSection />
      </Suspense>
    </div>
  );
}
