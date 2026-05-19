import { describe, it, expect } from "vitest";
import {
  toGrams,
  formatPortion,
  PORTION_UNITS,
  convertForDisplay,
} from "../unit-conversions";

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

describe("convertForDisplay", () => {
  describe("imperial system", () => {
    it("passes amount and unit through unchanged", () => {
      expect(convertForDisplay(1.5, "cup", "imperial")).toEqual({
        amount: 1.5,
        label: "cup",
      });
      expect(convertForDisplay(8, "oz", "imperial")).toEqual({
        amount: 8,
        label: "oz",
      });
    });

    it("treats null unit as empty label", () => {
      expect(convertForDisplay(2, null, "imperial")).toEqual({
        amount: 2,
        label: "",
      });
    });
  });

  describe("metric system — volumes", () => {
    it("converts 1 cup to 240 ml", () => {
      expect(convertForDisplay(1, "cup", "metric")).toEqual({
        amount: 240,
        label: "ml",
      });
    });

    it("converts cups (plural) to ml", () => {
      expect(convertForDisplay(2, "cups", "metric")).toEqual({
        amount: 480,
        label: "ml",
      });
    });

    it("converts 1 tbsp to 15 ml", () => {
      expect(convertForDisplay(1, "tbsp", "metric")).toEqual({
        amount: 15,
        label: "ml",
      });
    });

    it("converts 1 tsp to 5 ml", () => {
      expect(convertForDisplay(1, "tsp", "metric")).toEqual({
        amount: 5,
        label: "ml",
      });
    });

    it("converts long-form 'teaspoon' to ml", () => {
      expect(convertForDisplay(2, "teaspoon", "metric")).toEqual({
        amount: 10,
        label: "ml",
      });
    });
  });

  describe("metric system — weights", () => {
    it("converts 1 oz to 28 g", () => {
      expect(convertForDisplay(1, "oz", "metric")).toEqual({
        amount: 28,
        label: "g",
      });
    });

    it("converts 1 lb to 454 g", () => {
      expect(convertForDisplay(1, "lb", "metric")).toEqual({
        amount: 454,
        label: "g",
      });
    });

    it("converts lbs (plural) to g", () => {
      expect(convertForDisplay(0.5, "lbs", "metric")).toEqual({
        amount: 227,
        label: "g",
      });
    });
  });

  describe("metric system — pass-through units", () => {
    it("passes 'each' through unchanged", () => {
      expect(convertForDisplay(3, "each", "metric")).toEqual({
        amount: 3,
        label: "each",
      });
    });

    it("passes 'can' through unchanged", () => {
      expect(convertForDisplay(2, "can", "metric")).toEqual({
        amount: 2,
        label: "can",
      });
    });

    it("passes null unit through with empty label", () => {
      expect(convertForDisplay(1, null, "metric")).toEqual({
        amount: 1,
        label: "",
      });
    });
  });

  describe("metric system — case + whitespace tolerance", () => {
    it("matches uppercase units", () => {
      expect(convertForDisplay(1, "CUP", "metric").label).toBe("ml");
    });

    it("matches trimmed units", () => {
      expect(convertForDisplay(1, "  tbsp  ", "metric").label).toBe("ml");
    });

    it("matches trailing-period abbreviations", () => {
      expect(convertForDisplay(1, "oz.", "metric")).toEqual({
        amount: 28,
        label: "g",
      });
    });
  });

  describe("metric system — rounding", () => {
    it("rounds 1/2 cup (120 ml exactly) to integer", () => {
      expect(convertForDisplay(0.5, "cup", "metric").amount).toBe(120);
    });

    it("rounds 1/3 cup (80 ml exactly) to integer", () => {
      expect(convertForDisplay(1 / 3, "cup", "metric").amount).toBe(80);
    });

    it("rounds 1/2 tsp (2.5 ml) to nearest integer", () => {
      expect(convertForDisplay(0.5, "tsp", "metric").amount).toBe(3);
    });

    it("keeps one decimal for sub-1 values to avoid collapsing to 0", () => {
      // 0.1 tsp × 5 = 0.5 ml — would round to 0 or 1; spec keeps 0.5.
      expect(convertForDisplay(0.1, "tsp", "metric").amount).toBe(0.5);
    });

    it("returns 0 for zero amount", () => {
      expect(convertForDisplay(0, "cup", "metric").amount).toBe(0);
    });
  });
});
