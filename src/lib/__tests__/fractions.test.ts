import { describe, it, expect } from "vitest";
import { toFraction, formatQuantity } from "../fractions";

describe("toFraction", () => {
  it("returns whole numbers as-is", () => {
    expect(toFraction(1)).toBe("1");
    expect(toFraction(2)).toBe("2");
    expect(toFraction(10)).toBe("10");
  });

  it("converts common cooking fractions", () => {
    expect(toFraction(0.25)).toBe("1/4");
    expect(toFraction(0.5)).toBe("1/2");
    expect(toFraction(0.75)).toBe("3/4");
    expect(toFraction(0.333)).toBe("1/3");
    expect(toFraction(0.667)).toBe("2/3");
    expect(toFraction(0.125)).toBe("1/8");
    expect(toFraction(0.375)).toBe("3/8");
    expect(toFraction(0.875)).toBe("7/8");
  });

  it("handles mixed numbers", () => {
    expect(toFraction(1.5)).toBe("1 1/2");
    expect(toFraction(2.25)).toBe("2 1/4");
    expect(toFraction(3.75)).toBe("3 3/4");
    expect(toFraction(1.333)).toBe("1 1/3");
  });

  it("rounds near-whole values", () => {
    expect(toFraction(0.99)).toBe("1");
    expect(toFraction(2.98)).toBe("3");
    expect(toFraction(1.03)).toBe("1");
  });

  it("handles zero", () => {
    expect(toFraction(0)).toBe("0");
  });
});

describe("formatQuantity", () => {
  it("returns empty string for null", () => {
    expect(formatQuantity(null)).toBe("");
  });

  it("applies scale factor", () => {
    expect(formatQuantity(0.5, 2)).toBe("1");
    expect(formatQuantity(1, 0.5)).toBe("1/2");
    expect(formatQuantity(0.25, 2)).toBe("1/2");
  });

  it("formats whole scaled values as integers", () => {
    expect(formatQuantity(2, 1)).toBe("2");
    expect(formatQuantity(1, 3)).toBe("3");
  });
});
