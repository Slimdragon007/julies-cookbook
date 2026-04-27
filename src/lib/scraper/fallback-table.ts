// Hardcoded macro fallback table — last-resort estimate when USDA + Claude
// both fail to provide data. Values reflect canonical USDA references for
// the listed reference unit; see normalize/macros for the multiplier logic.

export interface MacroRef {
  per: string;
  cal: number;
  p: number;
  c: number;
  f: number;
}

export const FALLBACK_MACROS: Record<string, MacroRef> = {
  "olive oil": { per: "tbsp", cal: 119, p: 0, c: 0, f: 14 },
  butter: { per: "tbsp", cal: 102, p: 0, c: 0, f: 12 },
  "toasted sesame oil": { per: "tbsp", cal: 120, p: 0, c: 0, f: 14 },
  "ground beef": { per: "lb", cal: 1152, p: 77, c: 0, f: 92 },
  "chicken breast": { per: "lb", cal: 748, p: 139, c: 0, f: 16 },
  "chicken thigh": { per: "lb", cal: 1085, p: 109, c: 0, f: 69 },
  egg: { per: "each", cal: 72, p: 6, c: 0, f: 5 },
  "all-purpose flour": { per: "cup", cal: 455, p: 13, c: 95, f: 1 },
  "white rice": { per: "cup", cal: 675, p: 13, c: 148, f: 1 },
  "brown rice": { per: "cup", cal: 685, p: 14, c: 143, f: 5 },
  "elbow macaroni": { per: "cup", cal: 389, p: 13, c: 78, f: 2 },
  couscous: { per: "cup", cal: 650, p: 22, c: 134, f: 1 },
  lentil: { per: "cup", cal: 678, p: 50, c: 115, f: 2 },
  milk: { per: "cup", cal: 149, p: 8, c: 12, f: 8 },
  "heavy cream": { per: "cup", cal: 821, p: 5, c: 7, f: 88 },
  "cheddar cheese": { per: "cup", cal: 455, p: 28, c: 1, f: 37 },
  "feta cheese": { per: "cup", cal: 396, p: 22, c: 6, f: 32 },
  "diced tomatoes": { per: "14oz", cal: 70, p: 4, c: 14, f: 0 },
  "crushed tomatoes": { per: "28oz", cal: 140, p: 7, c: 28, f: 0 },
  "tomato sauce": { per: "8oz", cal: 60, p: 2, c: 12, f: 0 },
  chickpea: { per: "can", cal: 360, p: 19, c: 58, f: 6 },
  salt: { per: "tsp", cal: 0, p: 0, c: 0, f: 0 },
  "black pepper": { per: "tsp", cal: 6, p: 0, c: 2, f: 0 },
  cumin: { per: "tsp", cal: 8, p: 0, c: 1, f: 0 },
  paprika: { per: "tsp", cal: 6, p: 0, c: 1, f: 0 },
  "italian seasoning": { per: "tsp", cal: 5, p: 0, c: 1, f: 0 },
  "dried thyme": { per: "tsp", cal: 5, p: 0, c: 1, f: 0 },
  "curry powder": { per: "tsp", cal: 7, p: 0, c: 1, f: 0 },
  "red pepper flakes": { per: "tsp", cal: 6, p: 0, c: 1, f: 0 },
  "baking powder": { per: "tsp", cal: 2, p: 0, c: 1, f: 0 },
  "soy sauce": { per: "tbsp", cal: 9, p: 1, c: 1, f: 0 },
  honey: { per: "tbsp", cal: 64, p: 0, c: 17, f: 0 },
  "maple syrup": { per: "tbsp", cal: 52, p: 0, c: 13, f: 0 },
  vinegar: { per: "tbsp", cal: 3, p: 0, c: 0, f: 0 },
  "red wine vinegar": { per: "tbsp", cal: 3, p: 0, c: 0, f: 0 },
  "rice vinegar": { per: "tbsp", cal: 3, p: 0, c: 0, f: 0 },
  "tomato paste": { per: "tbsp", cal: 13, p: 1, c: 3, f: 0 },
  "dijon mustard": { per: "tbsp", cal: 15, p: 1, c: 1, f: 1 },
  "lemon juice": { per: "tbsp", cal: 4, p: 0, c: 1, f: 0 },
  cornstarch: { per: "tbsp", cal: 30, p: 0, c: 7, f: 0 },
  "brown sugar": { per: "tbsp", cal: 52, p: 0, c: 13, f: 0 },
  sugar: { per: "tbsp", cal: 48, p: 0, c: 12, f: 0 },
  "vanilla extract": { per: "tsp", cal: 12, p: 0, c: 1, f: 0 },
  onion: { per: "each", cal: 44, p: 1, c: 10, f: 0 },
  garlic: { per: "each", cal: 4, p: 0, c: 1, f: 0 },
  carrot: { per: "each", cal: 25, p: 1, c: 6, f: 0 },
  "bell pepper": { per: "each", cal: 30, p: 1, c: 7, f: 0 },
  "red bell pepper": { per: "each", cal: 30, p: 1, c: 7, f: 0 },
  zucchini: { per: "each", cal: 33, p: 2, c: 6, f: 1 },
  "sweet potato": { per: "lb", cal: 390, p: 7, c: 90, f: 1 },
  lemon: { per: "each", cal: 17, p: 1, c: 5, f: 0 },
  blueberry: { per: "cup", cal: 84, p: 1, c: 21, f: 0 },
  strawberry: { per: "each", cal: 4, p: 0, c: 1, f: 0 },
  broccoli: { per: "cup", cal: 31, p: 3, c: 6, f: 0 },
  water: { per: "cup", cal: 0, p: 0, c: 0, f: 0 },
  "vegetable broth": { per: "cup", cal: 12, p: 1, c: 2, f: 0 },
  "chicken broth": { per: "cup", cal: 15, p: 3, c: 1, f: 0 },
  "hamburger bun": { per: "each", cal: 120, p: 4, c: 22, f: 2 },
};
