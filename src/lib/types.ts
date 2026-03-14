export interface Recipe {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  preparation: string;
  servings: number | null;
  cookTime: number | null;
  prepTime: number | null;
  sourceUrl: string | null;
  cuisineTag: string | null;
  dietaryTags: string[];
  julieRating: number | null;
  caloriesPerServing: number | null;
  totalCalories: number | null;
  manualCalorieOverride: number | null;
  totalBatchWeightG: number | null;
  ingredients: Ingredient[];
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}
