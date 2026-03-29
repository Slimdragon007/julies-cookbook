import { createSupabaseServer } from "@/lib/supabase/server";
import { getAllRecipes } from "@/lib/data";
import ProfileForm from "@/components/ProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Julie's Cookbook",
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const recipes = await getAllRecipes(false, user?.id);
  const displayName = user?.user_metadata?.display_name || "";

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      <div className="max-w-2xl mx-auto">
        <ProfileForm
          email={user?.email || ""}
          displayName={displayName}
          recipeCount={recipes.length}
        />
      </div>
    </div>
  );
}
