import { getAllRecipes } from "@/lib/data";
import RecipeCard from "@/components/RecipeCard";

export const revalidate = 60;

export default async function HomePage() {
  const recipes = await getAllRecipes();

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
      {recipes.length === 0 && (
        <p className="text-center text-warm-light mt-12 font-body">
          No recipes yet. Add some in Airtable!
        </p>
      )}
    </div>
  );
}
