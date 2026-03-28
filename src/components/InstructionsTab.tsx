import React from "react";
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
      <p className="text-slate-500 font-medium">
        No instructions available.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Method</h2>
      <div className="space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100/50">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-6 relative">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white border border-white shadow-sm text-amber-700 text-sm font-bold flex items-center justify-center z-10">
              {i + 1}
            </div>
            <div className="pt-1.5 flex-1 glass p-5 rounded-3xl">
              <p className="text-slate-600 leading-relaxed text-[15px] font-medium">
                {step}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Completion card */}
      <div className="text-center p-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[3rem] border border-white shadow-sm mt-10">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <CheckCircle2 className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Bon Appetit!</h3>
        <p className="text-slate-500 text-sm font-medium">Enjoy your meal.</p>
      </div>
    </div>
  );
}
