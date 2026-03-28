import { getAllRecipes } from "@/lib/data";
import FoodLogForm from "@/components/FoodLogForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Food Log",
};

export default async function FoodLogPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(true, user?.id);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-warm-dark mb-6">Food Log</h1>
      <FoodLogForm recipes={recipes} />
    </div>
  );
}
