import { getAllRecipes } from "@/lib/data";
import FoodLogForm from "@/components/FoodLogForm";

export const revalidate = 60;

export const metadata = {
  title: "Food Log — Julie's Cookbook",
};

export default async function FoodLogPage() {
  const recipes = await getAllRecipes(true);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-warm-dark mb-6">Food Log</h1>
      <FoodLogForm recipes={recipes} />
    </div>
  );
}
