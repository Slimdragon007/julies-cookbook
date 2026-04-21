export const runtime = "edge";

import type { Metadata } from "next";
import { getRecipeById } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import RecipeTabs from "@/components/RecipeTabs";
import RecipeActions from "@/components/RecipeActions";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ChevronLeft, Clock, Flame, Users, Sparkles } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipe = await getRecipeById(id, user?.id);
  return {
    title: recipe ? `${recipe.name} — Julie's Cookbook` : "Recipe — Julie's Cookbook",
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const recipe = await getRecipeById(id, user?.id);

  if (!recipe) notFound();

  return (
    <div className="min-h-screen relative selection:bg-amber-100 selection:text-amber-900">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-50/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-amber-50/30 rounded-full blur-[100px]" />
      </div>

      <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:min-h-screen relative z-10">
        {/* Image section */}
        <div className="relative h-[50vh] lg:h-screen lg:sticky lg:top-0 w-full overflow-hidden">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
              style={{ viewTransitionName: `recipe-img-${recipe.slug}` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-amber-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/30" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 w-full p-6 pt-12 lg:pt-8 flex justify-between items-center z-20">
            <Link
              href="/"
              className="w-11 h-11 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 shadow-lg hover:bg-white/40 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
          </div>

          {/* Title overlay (mobile) */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 lg:hidden">
            {recipe.cuisineTag && (
              <span className="inline-block px-3 py-1 bg-amber-600/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 border border-amber-500/50">
                {recipe.cuisineTag}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2 break-words">
              {recipe.name}
            </h1>
          </div>
        </div>

        {/* Content section */}
        <div className="relative -mt-8 lg:mt-0 bg-white/60 lg:bg-white/30 backdrop-blur-3xl rounded-t-[3rem] lg:rounded-none px-6 sm:px-10 pt-12 lg:pt-12 lg:pl-16 lg:pr-12 pb-32 lg:pb-12 lg:overflow-y-auto lg:max-h-screen border-t lg:border-t-0 lg:border-l border-white/60 shadow-[0_-8px_40px_rgba(0,0,0,0.05)]">
          {/* Mobile drag indicator */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-1.5 bg-slate-200/50 rounded-full" />
          </div>

          {/* Title (desktop) */}
          <div className="hidden lg:block mb-8">
            {recipe.cuisineTag && (
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 border border-amber-200">
                {recipe.cuisineTag}
              </span>
            )}
            <h1 className="text-4xl xl:text-5xl font-bold text-slate-800 leading-tight break-words">
              {recipe.name}
            </h1>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Clock, label: "Prep Time", value: recipe.prepTime ? `${recipe.prepTime} min` : "N/A", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: Flame, label: "Cook Time", value: recipe.cookTime ? `${recipe.cookTime} min` : "N/A", color: "text-orange-500", bg: "bg-orange-50" },
              { icon: Users, label: "Servings", value: recipe.servings ? `${recipe.servings}` : "N/A", color: "text-emerald-500", bg: "bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="glass p-4 rounded-3xl flex flex-col items-center text-center transition-transform hover:scale-[1.02]">
                <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-2 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1 leading-none">{label}</p>
                <p className="text-sm font-bold text-slate-700 leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* Tags + Rating */}
          {(recipe.dietaryTags.length > 0 || recipe.julieRating) && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {recipe.dietaryTags.map((tag) => (
                <span key={tag} className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
                  {tag}
                </span>
              ))}
              {recipe.julieRating && (
                <span className="ml-auto text-amber-600 text-sm font-bold">
                  {"★".repeat(recipe.julieRating)}
                  <span className="text-slate-200">{"★".repeat(5 - recipe.julieRating)}</span>
                </span>
              )}
            </div>
          )}

          {/* Edit/Delete actions */}
          <RecipeActions recipe={{
            id: recipe.id,
            name: recipe.name,
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            cuisineTag: recipe.cuisineTag,
          }} />

          {/* Tabbed content */}
          <RecipeTabs
            ingredients={recipe.ingredients}
            preparation={recipe.preparation}
            defaultServings={recipe.servings}
            totalBatchWeightG={recipe.totalBatchWeightG}
          />

          {/* Source link */}
          {recipe.sourceUrl && (
            <div className="mt-10 text-center">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:text-amber-800 text-xs font-bold underline"
              >
                Original recipe source
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
