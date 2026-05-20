"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StepRibbonStep {
  id: number;
  label: string;
  icon?: ReactNode;
}

interface StepRibbonProps {
  steps: StepRibbonStep[];
  currentStep: number;
  onSelect: (idx: number) => void;
  className?: string;
}

export function StepRibbon({
  steps,
  currentStep,
  onSelect,
  className,
}: StepRibbonProps) {
  return (
    <div
      className={cn("flex items-start gap-2 sm:gap-3", className)}
      aria-label="Demo steps"
    >
      {steps.map((step, i) => {
        const complete = i < currentStep;
        const active = i === currentStep;
        const upcoming = i > currentStep;

        return (
          <div
            key={step.id}
            className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0"
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "step" : undefined}
              className="flex flex-col items-center gap-1.5 group flex-shrink-0"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "font-sans font-semibold text-sm",
                  "transition-all duration-240 ease-hearth",
                  "border-2 border-transparent",
                  complete && "bg-accent-ink text-accent-on",
                  active && "bg-accent text-accent-on shadow-lift-sm",
                  upcoming &&
                    "bg-card text-ink-mute border-rule group-hover:bg-rule/30",
                )}
              >
                {complete ? (
                  <span className="font-sans font-semibold text-base leading-none">
                    ✓
                  </span>
                ) : step.icon ? (
                  step.icon
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden sm:inline font-sans text-[11px] font-medium tracking-wide",
                  "max-w-[88px] text-center leading-tight",
                  complete && "text-ink-soft",
                  active && "text-ink",
                  upcoming && "text-ink-mute",
                )}
              >
                {step.label}
              </span>
              <span className="sm:hidden sr-only">{step.label}</span>
            </button>

            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-rule rounded-full mt-4 relative">
                <div
                  className={cn(
                    "absolute inset-0 bg-accent rounded-full transition-[transform] duration-240 ease-hearth origin-left",
                    complete ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
