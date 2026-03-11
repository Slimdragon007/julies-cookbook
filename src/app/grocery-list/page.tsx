import { getAllRecipes } from "@/lib/data";
import GroceryListBuilder from "@/components/GroceryListBuilder";

export const revalidate = 60;

export default async function GroceryListPage() {
  const recipes = await getAllRecipes(true);

  return <GroceryListBuilder recipes={recipes} />;
}
