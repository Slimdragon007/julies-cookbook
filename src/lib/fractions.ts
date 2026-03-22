/**
 * Convert a decimal quantity to a human-friendly cooking fraction.
 *
 * Snaps to the nearest common cooking fraction (halves, thirds, quarters, eighths)
 * and returns a Unicode-fraction string like "1/2", "1 1/3", or "2".
 */

const FRACTIONS: [number, string][] = [
  [0, ""],
  [1 / 8, "1/8"],
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [3 / 8, "3/8"],
  [1 / 2, "1/2"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
  [7 / 8, "7/8"],
  [1, ""],
];

function closestFraction(decimal: number): string {
  let best = FRACTIONS[0];
  let bestDist = Math.abs(decimal - best[0]);

  for (const entry of FRACTIONS) {
    const dist = Math.abs(decimal - entry[0]);
    if (dist < bestDist) {
      best = entry;
      bestDist = dist;
    }
  }

  return best[1];
}

export function toFraction(value: number): string {
  if (value <= 0) return "0";

  const whole = Math.floor(value);
  const remainder = value - whole;

  // Tolerance: if very close to a whole number, just return it
  if (remainder < 0.0625) return String(whole || "");
  if (remainder > 0.9375) return String(whole + 1);

  const frac = closestFraction(remainder);

  if (whole === 0) return frac;
  return `${whole} ${frac}`;
}

/**
 * Format a quantity for display: whole numbers stay as-is,
 * decimals become cooking fractions.
 */
export function formatQuantity(val: number | null, scale: number = 1): string {
  if (val === null) return "";
  const scaled = val * scale;
  if (scaled % 1 === 0) return String(scaled);
  return toFraction(scaled);
}
