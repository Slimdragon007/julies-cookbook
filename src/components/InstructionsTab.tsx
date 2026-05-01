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
      <p className="font-serif text-base text-ink-mute">
        No instructions available.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-8">
        Method
      </h2>

      {/* InstructionList — spec §8. Numbered circle (32×32 brown) + Lora 16px text. */}
      <ol className="space-y-6 mb-10">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex-none w-8 h-8 rounded-full bg-brown text-cream font-sans font-semibold text-sm flex items-center justify-center">
              {i + 1}
            </div>
            <div className="font-serif text-base leading-[1.65] text-ink pt-1">
              {step}
            </div>
          </li>
        ))}
      </ol>

      {/* Completion card — restrained linen surface, no gradients. */}
      <div className="text-center py-8 px-6 bg-linen rounded shadow-lift-sm">
        <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-leaf" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink mb-1">
          Bon Appetit
        </h3>
        <p className="font-serif text-sm text-ink-soft">Enjoy your meal.</p>
      </div>
    </div>
  );
}
