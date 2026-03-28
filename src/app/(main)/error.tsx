"use client";

import { AlertTriangle } from "lucide-react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Something went wrong</h2>
        <p className="text-slate-500 font-medium mb-8">
          {error.message === "NEXT_NOT_FOUND" ? "This page doesn't exist." : "We hit an unexpected error. Try refreshing."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 glass rounded-2xl text-slate-600 font-bold hover:bg-white/60 transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
