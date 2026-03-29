/**
 * Live USDA API integration tests.
 * These hit the real API — skip if USDA_API_KEY is not set.
 * Run with: USDA_API_KEY=... npx vitest run usda-live
 */
import { describe, it, expect } from "vitest";
import { lookupNutrition, calculateIngredientMacros } from "../usda";

const API_KEY = process.env.USDA_API_KEY;
const describeIf = API_KEY ? describe : describe.skip;

describeIf("USDA API (live)", () => {
  it("looks up olive oil — high fat, zero protein", async () => {
    const result = await lookupNutrition("olive oil", API_KEY);
    expect(result).not.toBeNull();
    expect(result!.calories).toBeGreaterThan(800);
    expect(result!.fat).toBeGreaterThan(90);
    expect(result!.protein).toBe(0);
  });

  it("looks up a protein source — returns nonzero protein", async () => {
    const result = await lookupNutrition("chicken, broilers or fryers, breast", API_KEY);
    expect(result).not.toBeNull();
    expect(result!.calories).toBeGreaterThan(0);
    expect(result!.protein).toBeGreaterThan(0);
  });

  it("looks up salt — returns zero calories", async () => {
    const result = await lookupNutrition("salt, table", API_KEY);
    expect(result).not.toBeNull();
    expect(result!.calories).toBe(0);
    expect(result!.protein).toBe(0);
    expect(result!.fat).toBe(0);
  });

  it("calculates macros for 2 tbsp olive oil using USDA data", async () => {
    const result = await calculateIngredientMacros("olive oil", 2, "/tbsp", API_KEY);
    expect(result).not.toBeNull();
    expect(result!.source).toBe("usda");
    // 2 tbsp = 29.6g → (29.6/100) * ~884 ≈ 262 cal
    expect(result!.calories).toBeGreaterThan(200);
    expect(result!.calories).toBeLessThan(320);
    expect(result!.fat).toBeGreaterThan(25);
  });

  it("calculateIngredientMacros returns correct source tag", async () => {
    const result = await calculateIngredientMacros("butter", 1, "/tbsp", API_KEY);
    expect(result).not.toBeNull();
    expect(result!.source).toBe("usda");
    expect(result!.calories).toBeGreaterThan(0);
  });

  it("returns null for nonsense ingredient", async () => {
    const result = await lookupNutrition("xyzzy_not_a_food_12345", API_KEY);
    expect(result).toBeNull();
  });

  it("calculateIngredientMacros returns null for unknown food", async () => {
    const result = await calculateIngredientMacros("xyzzy_not_a_food_12345", 1, "/cup", API_KEY);
    expect(result).toBeNull();
  });
});
