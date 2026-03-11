import React from "react";

interface Props {
  preparation: string;
}

export default function InstructionsTab({ preparation }: Props) {
  // Split preparation into steps: by newlines, filtering empties
  // Also strip leading numbers/dots/dashes that some recipes have
  const steps = preparation
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/^\d+[\.\)\-]\s*/, ""));

  if (steps.length === 0) {
    return (
      <p className="font-body text-base text-warm-light">
        No instructions available.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl text-warm-dark mb-5">Instructions</h2>
      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-linen flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-display text-sm text-warm-dark">{i + 1}</span>
            </div>
            <p className="font-body text-base leading-7 text-warm-dark/80 flex-1">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
