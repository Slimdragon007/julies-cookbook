import { cn } from "@/lib/utils";

interface MacroPillProps {
  label: string;
  value: number | string | null;
  unit?: string;
  accent?: boolean;
  size?: "sm" | "md";
  className?: string;
}

// Atomic macro display used inline (e.g. inside RecipeCard meta row, ingredient
// rows). Distinct from MacroGrid, which is the 4-cell layout for full readouts.
export function MacroPill({
  label,
  value,
  unit,
  accent = false,
  size = "md",
  className,
}: MacroPillProps) {
  const display = value === null || value === undefined ? "—" : value;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 rounded-pill",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        accent
          ? "bg-accent-soft text-accent-ink"
          : "bg-card border border-rule text-ink-soft",
        className,
      )}
    >
      <span className="font-sans font-medium uppercase tracking-[0.06em] text-[10px] opacity-70">
        {label}
      </span>
      <span className="font-mono font-semibold tabular-nums text-ink">
        {display}
        {unit && value !== null && value !== undefined && (
          <span className="ml-0.5 opacity-60">{unit}</span>
        )}
      </span>
    </span>
  );
}
