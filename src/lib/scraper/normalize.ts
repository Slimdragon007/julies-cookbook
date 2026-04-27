import {
  CANONICAL_NAMES,
  CATEGORY_MAP,
  COUNTABLE,
  CUISINE_MAP,
  KEEP_WITH_ADJECTIVE,
  NO_PLURAL_STRIP,
  SMALL_LIQUIDS,
  SPICES,
  UNIT_MAP,
  VALID_CATEGORIES,
  VALID_COOKING_UNITS,
  VALID_CUISINES,
  type Category,
  type CookingUnit,
  type Cuisine,
} from "./contracts";

export function slugify(name: string): string {
  // Falls back to "recipe" when the input has no alphanumeric characters
  // (e.g. "!!!", "¿¡"). An empty slug breaks slug-based routing in
  // `getRecipeById`, so we guarantee a non-empty result here. The persistence
  // layer can append suffixes if uniqueness is needed.
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "recipe";
}

export function normalizeName(name: string): string {
  let n = name.toLowerCase().trim();
  if (CANONICAL_NAMES[n]) return CANONICAL_NAMES[n];
  if (KEEP_WITH_ADJECTIVE.includes(n)) return n;

  for (const adj of ["large", "medium", "small"]) {
    if (n.startsWith(adj + " ")) n = n.slice(adj.length + 1);
  }

  if (
    !NO_PLURAL_STRIP.includes(n) &&
    n.endsWith("s") &&
    !n.endsWith("ss") &&
    !n.endsWith("us")
  ) {
    const singular = n.endsWith("ies")
      ? n.slice(0, -3) + "y"
      : n.endsWith("es")
        ? n.slice(0, -2)
        : n.slice(0, -1);
    if (singular.length > 2) n = singular;
  }

  if (CANONICAL_NAMES[n]) return CANONICAL_NAMES[n];
  return n;
}

export function assignUnit(
  name: string,
  qty: number | null,
  rawUnit: string | null,
): CookingUnit {
  const mapped = rawUnit ? UNIT_MAP[rawUnit.toLowerCase()] || null : null;
  if (mapped && (VALID_COOKING_UNITS as readonly string[]).includes(mapped)) {
    return mapped;
  }
  if (SPICES.includes(name) && (qty ?? 1) <= 3) return "/tsp";
  if (SMALL_LIQUIDS.includes(name) && (qty ?? 1) <= 3) return "/tbsp";
  if (COUNTABLE.includes(name)) return "/each";
  return "/tsp";
}

export function mapCategory(
  name: string,
  rawCategory: string | null | undefined,
): Category {
  const fromName = CATEGORY_MAP[name];
  if (fromName) return fromName;
  const candidate = rawCategory ?? "Other";
  if ((VALID_CATEGORIES as readonly string[]).includes(candidate)) {
    return candidate as Category;
  }
  return "Other";
}

export function mapCuisine(
  rawCuisine: string | null | undefined,
): Cuisine | null {
  if (!rawCuisine) return null;
  if ((VALID_CUISINES as readonly string[]).includes(rawCuisine)) {
    return rawCuisine as Cuisine;
  }
  return CUISINE_MAP[rawCuisine.toLowerCase()] ?? null;
}
