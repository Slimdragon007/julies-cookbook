import { describe, it, expect } from "vitest";
import {
  sumIngredientMacros,
  portionMacros,
  perServingMacros,
  calculatePortionMacros,
} from "../macros";
import { Ingredient } from "../types";

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "test-1",
    name: "test ingredient",
    quantity: 1,
    unit: "/each",
    category: "Other",
    calories: 100,
    protein: 10,
    carbs: 20,
    fat: 5,
    ...overrides,
  };
}

describe("sumIngredientMacros", () => {
  it("sums macros across ingredients", () => {
    const ingredients = [
      makeIngredient({ calories: 100, protein: 10, carbs: 20, fat: 5 }),
      makeIngredient({ calories: 200, protein: 15, carbs: 30, fat: 10 }),
    ];
    const result = sumIngredientMacros(ingredients);
    expect(result).toEqual({ calories: 300, protein: 25, carbs: 50, fat: 15 });
  });

  it("handles null values as zero", () => {
    const ingredients = [
      makeIngredient({ calories: null, protein: null, carbs: null, fat: null }),
      makeIngredient({ calories: 100, protein: 10, carbs: 20, fat: 5 }),
    ];
    const result = sumIngredientMacros(ingredients);
    expect(result).toEqual({ calories: 100, protein: 10, carbs: 20, fat: 5 });
  });

  it("returns zeros for empty array", () => {
    expect(sumIngredientMacros([])).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

describe("portionMacros", () => {
  it("calculates macros for a weighed portion", () => {
    const totals = { calories: 1000, protein: 80, carbs: 120, fat: 40 };
    // 200g out of 1000g batch = 20%
    const result = portionMacros(totals, 200, 1000);
    expect(result).toEqual({ calories: 200, protein: 16, carbs: 24, fat: 8 });
  });

  it("handles small portions correctly", () => {
    const totals = { calories: 500, protein: 40, carbs: 60, fat: 20 };
    // 50g out of 800g = 6.25%
    const result = portionMacros(totals, 50, 800);
    expect(result).toEqual({ calories: 31, protein: 3, carbs: 4, fat: 1 });
  });

  it("rounds to whole numbers", () => {
    const totals = { calories: 333, protein: 33, carbs: 33, fat: 33 };
    const result = portionMacros(totals, 100, 300);
    expect(result).toEqual({ calories: 111, protein: 11, carbs: 11, fat: 11 });
  });
});

describe("perServingMacros", () => {
  it("divides totals by servings", () => {
    const totals = { calories: 800, protein: 60, carbs: 100, fat: 30 };
    const result = perServingMacros(totals, 4);
    expect(result).toEqual({ calories: 200, protein: 15, carbs: 25, fat: 8 });
  });

  it("treats 0 servings as 1", () => {
    const totals = { calories: 500, protein: 40, carbs: 60, fat: 20 };
    const result = perServingMacros(totals, 0);
    expect(result).toEqual({ calories: 500, protein: 40, carbs: 60, fat: 20 });
  });

  it("rounds to whole numbers", () => {
    const totals = { calories: 100, protein: 10, carbs: 10, fat: 10 };
    const result = perServingMacros(totals, 3);
    expect(result).toEqual({ calories: 33, protein: 3, carbs: 3, fat: 3 });
  });
});

describe("calculatePortionMacros", () => {
  const ingredients = [
    makeIngredient({ calories: 500, protein: 40, carbs: 60, fat: 20 }),
    makeIngredient({ calories: 300, protein: 20, carbs: 30, fat: 15 }),
  ];

  it("uses batch weight when available", () => {
    const { macros, method } = calculatePortionMacros(ingredients, 200, 1000, 4);
    expect(method).toBe("batch_weight");
    expect(macros).toEqual({ calories: 160, protein: 12, carbs: 18, fat: 7 });
  });

  it("falls back to per-serving when no batch weight", () => {
    const { macros, method } = calculatePortionMacros(ingredients, 200, null, 4);
    expect(method).toBe("per_serving");
    expect(macros).toEqual({ calories: 200, protein: 15, carbs: 23, fat: 9 });
  });

  it("falls back to per-serving when batch weight is 0", () => {
    const { macros, method } = calculatePortionMacros(ingredients, 200, 0, 4);
    expect(method).toBe("per_serving");
    expect(macros).toEqual({ calories: 200, protein: 15, carbs: 23, fat: 9 });
  });

  it("handles single serving", () => {
    const { macros, method } = calculatePortionMacros(ingredients, 200, null, 1);
    expect(method).toBe("per_serving");
    // Full recipe totals: 800 cal, 60p, 90c, 35f — divided by 1
    expect(macros).toEqual({ calories: 800, protein: 60, carbs: 90, fat: 35 });
  });
});
