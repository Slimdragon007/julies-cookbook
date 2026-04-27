import { describe, it, expect } from "vitest";
import {
  slugify,
  normalizeName,
  assignUnit,
  mapCategory,
  mapCuisine,
} from "../scraper/normalize";

describe("slugify", () => {
  it("lowercases and replaces non-alphanumerics with dashes", () => {
    expect(slugify("Best Goulash")).toBe("best-goulash");
    expect(slugify("Mom's Apple Pie!")).toBe("mom-s-apple-pie");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("--hello--")).toBe("hello");
    expect(slugify("...World")).toBe("world");
  });

  it("collapses runs of separators", () => {
    expect(slugify("a   b___c")).toBe("a-b-c");
  });
});

describe("normalizeName", () => {
  it("returns canonical names for known mappings", () => {
    expect(normalizeName("extra-virgin olive oil")).toBe("olive oil");
    expect(normalizeName("EVOO")).toBe("olive oil");
    expect(normalizeName("Large Eggs")).toBe("egg");
    expect(normalizeName("garlic cloves")).toBe("garlic");
  });

  it("preserves protected adjective compounds", () => {
    expect(normalizeName("sweet potato")).toBe("sweet potato");
    expect(normalizeName("red bell pepper")).toBe("red bell pepper");
    expect(normalizeName("diced tomatoes")).toBe("diced tomatoes");
  });

  it("strips size adjectives", () => {
    expect(normalizeName("medium onion")).toBe("onion");
    expect(normalizeName("small carrot")).toBe("carrot");
  });

  it("strips simple plurals", () => {
    expect(normalizeName("carrots")).toBe("carrot");
    expect(normalizeName("onions")).toBe("onion");
  });

  it("converts -ies to -y", () => {
    expect(normalizeName("blueberries")).toBe("blueberry");
    expect(normalizeName("strawberries")).toBe("strawberry");
  });

  it("does not strip plurals from no-strip list", () => {
    expect(normalizeName("peas")).toBe("peas");
    expect(normalizeName("collard greens")).toBe("collard greens");
  });

  it("does not strip -ss or -us endings", () => {
    expect(normalizeName("hummus")).toBe("hummus");
    expect(normalizeName("watercress")).toBe("watercress");
  });
});

describe("assignUnit", () => {
  it("maps raw units via UNIT_MAP", () => {
    expect(assignUnit("flour", 1, "cups")).toBe("/cup");
    expect(assignUnit("ground beef", 2, "pounds")).toBe("/lb");
    expect(assignUnit("garlic", 3, "cloves")).toBe("/each");
  });

  it("returns /tsp for small-quantity spices", () => {
    expect(assignUnit("salt", 1, null)).toBe("/tsp");
    expect(assignUnit("cumin", 2, null)).toBe("/tsp");
  });

  it("returns /tbsp for small-quantity small liquids", () => {
    expect(assignUnit("olive oil", 2, null)).toBe("/tbsp");
    expect(assignUnit("soy sauce", 1, null)).toBe("/tbsp");
  });

  it("returns /each for countable items", () => {
    expect(assignUnit("egg", 2, null)).toBe("/each");
    expect(assignUnit("onion", 1, null)).toBe("/each");
  });

  it("falls back to /tsp for unknown ingredients with no unit", () => {
    expect(assignUnit("dragonfruit", 1, null)).toBe("/tsp");
  });

  it("prefers explicit raw unit over name heuristics", () => {
    expect(assignUnit("salt", 1, "tbsp")).toBe("/tbsp");
  });
});

describe("mapCategory", () => {
  it("uses name-based map first", () => {
    expect(mapCategory("onion", null)).toBe("Produce");
    expect(mapCategory("ground beef", "Meat")).toBe("Meat");
    expect(mapCategory("hamburger bun", "Other")).toBe("Bakery");
  });

  it("falls back to raw category if name unknown", () => {
    expect(mapCategory("dragonfruit", "Produce")).toBe("Produce");
  });

  it("returns Other for invalid raw category and unknown name", () => {
    expect(mapCategory("dragonfruit", "Misc.")).toBe("Other");
    expect(mapCategory("dragonfruit", null)).toBe("Other");
  });
});

describe("mapCuisine", () => {
  it("returns valid cuisines unchanged", () => {
    expect(mapCuisine("American")).toBe("American");
    expect(mapCuisine("Italian")).toBe("Italian");
  });

  it("maps known aliases", () => {
    expect(mapCuisine("Middle Eastern")).toBe("Mediterranean");
    expect(mapCuisine("Japanese")).toBe("Asian");
    expect(mapCuisine("Mexican")).toBe("Other");
  });

  it("returns null for unknown cuisines", () => {
    expect(mapCuisine("Martian")).toBeNull();
    expect(mapCuisine(null)).toBeNull();
    expect(mapCuisine(undefined)).toBeNull();
  });
});
