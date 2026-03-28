import { getAllRecipes } from "@/lib/data";
import FoodLogForm from "@/components/FoodLogForm";
import { createSupabaseServer } from "@/lib/supabase/server";
import { UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Food Log — Julie's Cookbook",
};

export default async function FoodLogPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(true, user?.id);

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
            <UtensilsCrossed className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Food Log</h1>
        </div>
        <FoodLogForm recipes={recipes} />
      </div>
    </div>
  );
}
