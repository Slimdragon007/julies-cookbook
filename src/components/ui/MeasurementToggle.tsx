"use client";

import {
  useMeasurementSystem,
  type MeasurementSystem,
} from "@/lib/measurement-system";
import { cn } from "@/lib/utils";

const OPTIONS: { value: MeasurementSystem; label: string }[] = [
  { value: "imperial", label: "Imperial" },
  { value: "metric", label: "Metric" },
];

interface Props {
  className?: string;
}

export function MeasurementToggle({ className }: Props) {
  const { system, setSystem } = useMeasurementSystem();

  return (
    <div
      role="group"
      aria-label="Measurement units"
      className={cn(
        "inline-flex items-center rounded-pill bg-card p-0.5 border border-rule",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = system === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSystem(opt.value)}
            aria-pressed={active}
            aria-label={`Show measurements in ${opt.label.toLowerCase()}`}
            className={cn(
              "px-3 py-1.5 rounded-pill font-sans text-xs font-semibold tracking-wide",
              "transition-all duration-200 ease-hearth",
              active
                ? "bg-accent text-accent-on shadow-lift-sm"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
