import { CheckCircle2 } from "lucide-react";

interface Props {
  preparation: string;
}

export default function InstructionsTab({ preparation }: Props) {
  const steps = preparation
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/^\d+[\.\)\-]\s*/, ""));

  if (steps.length === 0) {
    return (
      <p className="font-sans text-base text-ink-mute">
        No instructions available.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-[32px] text-ink mb-8">Method</h2>

      {/* InstructionList — paper editorial. Accent-soft disc with Instrument
          Serif italic numeral inside (handoff §"Step numbers"). */}
      <ol className="space-y-6 mb-10">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex-none w-9 h-9 rounded-full bg-accent-soft text-accent-ink font-display text-[20px] flex items-center justify-center leading-none">
              {i + 1}
            </div>
            <div className="font-sans text-base leading-[1.65] text-ink pt-1">
              {step}
            </div>
          </li>
        ))}
      </ol>

      {/* Completion card — restrained card surface, no gradients. */}
      <div className="text-center py-8 px-6 bg-card border border-rule rounded shadow-lift-sm">
        <div className="w-12 h-12 bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-accent-ink" />
        </div>
        <h3 className="font-display text-[24px] text-ink mb-1">Bon Appetit</h3>
        <p className="font-sans text-sm text-ink-soft">Enjoy your meal.</p>
      </div>
    </div>
  );
}
