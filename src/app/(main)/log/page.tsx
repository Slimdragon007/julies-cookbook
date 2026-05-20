export const runtime = "edge";

import { getAllRecipes } from "@/lib/data";
import FoodLogForm from "@/components/FoodLogForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata = {
  title: "Food Log — Julie's Cookbook",
};

export default async function FoodLogPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(true, user?.id);

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 px-1">
          <h1 className="font-display text-[40px] sm:text-[52px] text-ink leading-[1.05] mb-1">
            Food log
          </h1>
          <p className="font-sans text-base text-ink-soft">
            Log a meal when you eat. We&apos;ll do the macros.
          </p>
        </header>
        <FoodLogForm recipes={recipes} />
      </div>
    </div>
  );
}
