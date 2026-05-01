import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge tailwind classes with proper deduplication so callers can override
// variant defaults predictably (e.g. `<Button className="px-2">` reliably
// beats variant's `px-6` regardless of CSS load order).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
