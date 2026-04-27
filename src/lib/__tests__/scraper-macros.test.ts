import { describe, it, expect } from "vitest";
import { getUnitMultiplier, estimateMacros } from "../scraper/macros";

describe("getUnitMultiplier", () => {
  it("returns 1 for matching units", () => {
    expect(getUnitMultiplier("/tbsp", "tbsp")).toBe(1);
    expect(getUnitMultiplier("/cup", "cup")).toBe(1);
  });

  it("converts tsp <-> tbsp", () => {
    expect(getUnitMultiplier("/tsp", "tbsp")).toBeCloseTo(1 / 3);
    expect(getUnitMultiplier("/tbsp", "tsp")).toBe(3);
  });

  it("converts cup <-> tbsp", () => {
    expect(getUnitMultiplier("/cup", "tbsp")).toBe(16);
    expect(getUnitMultiplier("/tbsp", "cup")).toBeCloseTo(1 / 16);
  });

  it("converts oz to canned reference", () => {
    expect(getUnitMultiplier("/oz", "14oz")).toBeCloseTo(1 / 14);
    expect(getUnitMultiplier("/oz", "28oz")).toBeCloseTo(1 / 28);
    expect(getUnitMultiplier("/oz", "8oz")).toBeCloseTo(1 / 8);
  });

  it("returns null for unregistered conversions (avoids wildly wrong macro estimates)", () => {
    expect(getUnitMultiplier("/lb", "cup")).toBeNull();
    expect(getUnitMultiplier("/oz", "cup")).toBeNull();
    expect(getUnitMultiplier("/g", "tbsp")).toBeNull();
  });
});

describe("estimateMacros", () => {
  it("returns null for unknown ingredient", () => {
    expect(estimateMacros("dragonfruit", 1, "/each")).toBeNull();
  });

  it("returns null when ingredient is known but unit conversion is not", () => {
    // milk's ref is per-cup; estimating from a /lb recipe quantity has no
    // sensible conversion, so callers must treat macros as unknown rather
    // than silently using qty * 1 * per-cup-values.
    expect(estimateMacros("milk", 1, "/lb")).toBeNull();
  });

  it("scales canonical recipe quantities (2 tbsp olive oil)", () => {
    const result = estimateMacros("olive oil", 2, "/tbsp");
    expect(result).toEqual({ cal: 238, p: 0, c: 0, f: 28 });
  });

  it("scales /each ingredients (3 eggs)", () => {
    const result = estimateMacros("egg", 3, "/each");
    expect(result).toEqual({ cal: 216, p: 18, c: 0, f: 15 });
  });

  it("scales unit conversions (1 cup soy sauce in tbsp ref)", () => {
    const result = estimateMacros("soy sauce", 1, "/cup");
    // soy sauce ref is per-tbsp; 1 cup = 16 tbsp
    expect(result).toEqual({ cal: 144, p: 16, c: 16, f: 0 });
  });

  it("scales canned references (8 oz crushed tomatoes from a 28oz ref)", () => {
    const result = estimateMacros("crushed tomatoes", 8, "/oz");
    expect(result).toEqual({ cal: 40, p: 2, c: 8, f: 0 });
  });

  it("treats null qty as 1", () => {
    const result = estimateMacros("egg", null, "/each");
    expect(result).toEqual({ cal: 72, p: 6, c: 0, f: 5 });
  });
});
