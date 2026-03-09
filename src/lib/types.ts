export interface Recipe {
  id: string;
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
  ingredients: Ingredient[];
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}
