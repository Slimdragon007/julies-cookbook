"use client";

import { useState } from "react";

interface ScrapeResult {
  recipe: {
    id: string;
    slug: string;
    name: string;
    servings: number | null;
    ingredientCount: number;
    hasImage: boolean;
    cuisineTag: string | null;
  };
}

type Status = "idle" | "scraping" | "success" | "partial" | "error" | "blocked";

const URL_STEPS = [
  "Fetching recipe page...",
  "Extracting ingredients with AI...",
  "Uploading image...",
  "Saving to cookbook...",
];

const TEXT_STEPS = [
  "Reading your recipe...",
  "Extracting ingredients with AI...",
  "Saving to cookbook...",
];

export default function AddRecipeForm() {
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");
  const [blockedUrl, setBlockedUrl] = useState("");

  const steps = blockedUrl ? TEXT_STEPS : URL_STEPS;

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("scraping");
    setStep(0);
    setError("");
    setResult(null);

    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, URL_STEPS.length - 1));
    }, 5000);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (data.blocked) {
        setBlockedUrl(url.trim());
        setStatus("blocked");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
      setStatus(data.recipe?.hasImage ? "success" : "partial");
    } catch {
      clearInterval(interval);
      setStatus("error");
      setError("Network error — check your connection");
    }
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteText.trim()) return;

    setStatus("scraping");
    setStep(0);
    setError("");
    setResult(null);

    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, TEXT_STEPS.length - 1));
    }, 5000);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText.trim(), sourceUrl: blockedUrl || undefined }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
      setStatus(data.recipe?.hasImage ? "success" : "partial");
    } catch {
      clearInterval(interval);
      setStatus("error");
      setError("Network error — check your connection");
    }
  }

  function reset() {
    setUrl("");
    setPasteText("");
    setStatus("idle");
    setStep(0);
    setResult(null);
    setError("");
    setBlockedUrl("");
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-warm-dark">Add Recipe</h2>
        <p className="font-body text-sm text-warm-light mt-1">
          Paste a recipe URL and we&apos;ll add it to the cookbook
        </p>
      </div>

      {status === "idle" || status === "error" ? (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block font-body text-sm text-warm-dark mb-1">
              Recipe URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.seriouseats.com/best-chicken..."
              className="w-full px-4 py-3 rounded-xl glass-input font-body text-base text-warm-dark placeholder:text-warm-light/40 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!url.trim()}
            className="w-full font-display text-sm px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gold text-cream hover:brightness-110"
          >
            Add to Cookbook
          </button>
        </form>
      ) : status === "blocked" ? (
        <div>
          <div className="glass rounded-xl px-5 py-5 mb-5">
            <p className="font-display text-lg text-warm-dark mb-2">
              No worries! Just add it here
            </p>
            <p className="font-body text-sm text-warm-light">
              That site didn&apos;t let us grab the recipe automatically.
              Just copy the recipe from the page and paste it below — we&apos;ll take care of the rest.
            </p>
          </div>

          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <label htmlFor="paste" className="block font-body text-sm text-warm-dark mb-1">
                Recipe text
              </label>
              <textarea
                id="paste"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Paste the recipe here — ingredients, instructions, everything you see on the page.\n\nTip: on the recipe page, tap Select All then Copy and paste it all in here. We'll sort it out!"}
                rows={8}
                className="w-full px-4 py-3 rounded-xl glass-input font-body text-base text-warm-dark placeholder:text-warm-light/40 focus:outline-none resize-y min-h-[200px]"
                required
              />
            </div>

            {blockedUrl && (
              <p className="font-body text-xs text-warm-light truncate">
                Source: {blockedUrl}
              </p>
            )}

            <button
              type="submit"
              disabled={!pasteText.trim()}
              className="w-full font-display text-sm px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gold text-cream hover:brightness-110"
            >
              Add to Cookbook
            </button>

            <button
              type="button"
              onClick={reset}
              className="w-full font-display text-sm px-6 py-3 rounded-xl glass text-warm-light hover:bg-white/[0.09] transition-colors"
            >
              Try a Different URL
            </button>
          </form>
        </div>
      ) : status === "scraping" ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-white/10 border-t-gold rounded-full animate-spin mx-auto mb-6" />

          <p className="font-display text-lg text-warm-dark mb-4">
            {steps[step]}
          </p>

          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= step ? "bg-warm" : "bg-border"
                }`}
              />
            ))}
          </div>

          <p className="font-body text-xs text-warm-light">
            This usually takes 15-30 seconds
          </p>
        </div>
      ) : (status === "success" || status === "partial") && result ? (
        <div className="text-center py-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${status === "success" ? "bg-green-500/10" : "bg-amber-500/10"}`}>
            {status === "success" ? (
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>

          <h3 className="font-display text-xl text-warm-dark mb-2">
            {result.recipe.name}
          </h3>

          <div className="flex justify-center gap-4 text-sm text-warm-light font-body mb-4">
            {result.recipe.servings && <span>{result.recipe.servings} servings</span>}
            <span>{result.recipe.ingredientCount} ingredients</span>
            {result.recipe.hasImage ? (
              <span className="text-green-600">Photo added</span>
            ) : (
              <span className="text-amber-600">No photo found</span>
            )}
          </div>

          {status === "partial" && (
            <p className="font-body text-xs text-amber-600 mb-4">
              Recipe saved but no photo was available from that site. You can add one manually later.
            </p>
          )}

          <p className="font-body text-xs text-warm-light mb-6">
            Live on the site within 60 seconds
          </p>

          <div className="flex gap-3 justify-center">
            <a
              href={`/recipe/${result.recipe.slug}`}
              className="font-display text-sm px-6 py-2.5 rounded-xl bg-gold text-cream hover:brightness-110 transition-all"
            >
              View Recipe
            </a>
            <button
              onClick={reset}
              className="font-display text-sm px-6 py-2.5 rounded-xl glass text-warm-light hover:bg-white/[0.09] transition-colors"
            >
              Add Another
            </button>
          </div>
        </div>
      ) : null}

      {/* Feedback link */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="font-body text-xs text-warm-light">
          For any feedback, please use the{" "}
          <button
            type="button"
            onClick={() => {
              const fab = document.querySelector("[data-chat-fab]") as HTMLButtonElement | null;
              if (fab) fab.click();
            }}
            className="text-gold underline hover:text-warm-dark"
          >
            chat assistant
          </button>
          {" "}or message Slim directly.
        </p>
      </div>
    </div>
  );
}
