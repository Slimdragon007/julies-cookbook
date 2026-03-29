import { describe, it, expect } from "vitest";
import { ingredientToGrams, clearUSDACache } from "../usda";

describe("ingredientToGrams", () => {
  it("converts cups", () => {
    expect(ingredientToGrams("flour", 1, "/cup")).toBe(237);
    expect(ingredientToGrams("flour", 0.5, "/cup")).toBe(118.5);
  });

  it("converts tablespoons", () => {
    expect(ingredientToGrams("olive oil", 2, "/tbsp")).toBeCloseTo(29.6, 1);
  });

  it("converts teaspoons", () => {
    expect(ingredientToGrams("salt", 1, "/tsp")).toBeCloseTo(4.9, 1);
  });

  it("converts ounces", () => {
    expect(ingredientToGrams("cheese", 8, "/oz")).toBeCloseTo(226.8, 1);
  });

  it("converts pounds", () => {
    expect(ingredientToGrams("ground beef", 1, "/lb")).toBeCloseTo(453.6, 1);
  });

  it("uses per-ingredient weights for /each", () => {
    expect(ingredientToGrams("egg", 2, "/each")).toBe(100); // 2 * 50g
    expect(ingredientToGrams("garlic", 3, "/each")).toBe(9); // 3 * 3g
    expect(ingredientToGrams("onion", 1, "/each")).toBe(150);
  });

  it("falls back to 100g for unknown /each items", () => {
    expect(ingredientToGrams("dragon fruit", 1, "/each")).toBe(100);
  });

  it("handles unit without leading slash", () => {
    expect(ingredientToGrams("olive oil", 1, "tbsp")).toBeCloseTo(14.8, 1);
  });

  it("handles cans", () => {
    expect(ingredientToGrams("chickpeas", 1, "/can")).toBe(425);
  });
});

describe("clearUSDACache", () => {
  it("does not throw", () => {
    expect(() => clearUSDACache()).not.toThrow();
  });
});
