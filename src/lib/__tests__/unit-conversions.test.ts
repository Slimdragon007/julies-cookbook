import { describe, it, expect } from "vitest";
import { toGrams, formatPortion, PORTION_UNITS } from "../unit-conversions";

describe("toGrams", () => {
  it("passes grams through as-is", () => {
    expect(toGrams(350, "g")).toBe(350);
  });

  it("converts cups to grams", () => {
    expect(toGrams(1, "cups")).toBe(237);
    expect(toGrams(0.5, "cups")).toBe(119); // rounded
  });

  it("converts oz to grams", () => {
    expect(toGrams(1, "oz")).toBe(28); // rounded from 28.35
    expect(toGrams(8, "oz")).toBe(227);
  });

  it("converts tbsp to grams", () => {
    expect(toGrams(1, "tbsp")).toBe(15); // rounded from 14.8
    expect(toGrams(2, "tbsp")).toBe(30);
  });

  it("converts tsp to grams", () => {
    expect(toGrams(1, "tsp")).toBe(5); // rounded from 4.9
  });

  it("converts servings with batch weight", () => {
    // 1.5 servings of a 4-serving recipe with 1000g batch = 375g
    const result = toGrams(1.5, "servings", {
      totalBatchWeightG: 1000,
      servings: 4,
    });
    expect(result).toBe(375);
  });

  it("converts 1 serving with batch weight", () => {
    // 1 serving of a 4-serving recipe with 800g batch = 200g
    const result = toGrams(1, "servings", {
      totalBatchWeightG: 800,
      servings: 4,
    });
    expect(result).toBe(200);
  });

  it("returns null for servings without batch weight", () => {
    const result = toGrams(1, "servings", {
      totalBatchWeightG: null,
      servings: 4,
    });
    expect(result).toBeNull();
  });

  it("returns null for servings with zero batch weight", () => {
    const result = toGrams(1, "servings", {
      totalBatchWeightG: 0,
      servings: 4,
    });
    expect(result).toBeNull();
  });

  it("defaults to 1 serving when servings is null", () => {
    const result = toGrams(1, "servings", {
      totalBatchWeightG: 500,
      servings: null,
    });
    expect(result).toBe(500); // 1 serving = full batch
  });
});

describe("formatPortion", () => {
  it("formats whole numbers", () => {
    expect(formatPortion(2, "cups")).toBe("2 cups");
    expect(formatPortion(1, "servings")).toBe("1 servings");
    expect(formatPortion(350, "g")).toBe("350 grams");
  });

  it("formats decimal numbers to one place", () => {
    expect(formatPortion(1.5, "cups")).toBe("1.5 cups");
    expect(formatPortion(0.5, "oz")).toBe("0.5 oz");
  });
});

describe("PORTION_UNITS", () => {
  it("has 6 unit options", () => {
    expect(PORTION_UNITS).toHaveLength(6);
  });

  it("includes servings as first option", () => {
    expect(PORTION_UNITS[0].value).toBe("servings");
  });

  it("includes grams as last option", () => {
    expect(PORTION_UNITS[PORTION_UNITS.length - 1].value).toBe("g");
  });
});
