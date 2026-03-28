import { getAllRecipes } from "@/lib/data";
import GroceryListBuilder from "@/components/GroceryListBuilder";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GroceryListPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipes = await getAllRecipes(true, user?.id);

  return <GroceryListBuilder recipes={recipes} />;
}
