export const runtime = "edge";

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllRecipes } from "@/lib/data";
import RecipeGrid from "@/components/RecipeGrid";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Recipes — Julie's Cookbook",
};

async function WelcomeHeader() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const displayName =
    user?.user_metadata?.display_name ||
    (user?.email?.split("@")[0] || "Chef").replace(/^\w/, (c: string) =>
      c.toUpperCase(),
    );

  return (
    <header className="mb-8 px-1">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink leading-tight mb-1">
        Hello, {displayName}.
      </h1>
      <p className="font-serif text-base text-ink-soft">
        Find your next favorite meal today.
      </p>
    </header>
  );
}

async function RecipeSection() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(false, user?.id);
  return <RecipeGrid recipes={recipes} />;
}

function RecipeGridSkeleton() {
  return (
    <section>
      <div className="h-12 bg-linen rounded-pill mb-8 animate-pulse" />
      <div className="flex items-baseline justify-between mb-5 px-1">
        <div className="h-6 w-32 bg-linen rounded animate-pulse" />
        <div className="h-4 w-16 bg-linen rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-linen rounded shadow-lift-sm overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] md:aspect-[16/11] bg-linen-dim" />
            <div className="p-3.5 pb-4 space-y-2">
              <div className="h-4 w-3/4 bg-linen-dim rounded" />
              <div className="h-3 w-1/2 bg-linen-dim rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Suspense>
          <WelcomeHeader />
        </Suspense>
        <Suspense fallback={<RecipeGridSkeleton />}>
          <RecipeSection />
        </Suspense>
      </div>
    </div>
  );
}
