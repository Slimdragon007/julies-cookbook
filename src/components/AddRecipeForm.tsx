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

type Status = "idle" | "scraping" | "success" | "error" | "blocked";

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

      setStatus("success");
      setResult(data);
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

      setStatus("success");
      setResult(data);
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
              className="w-full px-4 py-3 rounded-lg border border-border bg-white font-body text-base text-warm-dark placeholder:text-warm-light/50 focus:outline-none focus:ring-2 focus:ring-warm/30 focus:border-warm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!url.trim()}
            className="w-full font-display text-sm px-6 py-3 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-warm text-white hover:bg-warm-dark"
          >
            Add to Cookbook
          </button>
        </form>
      ) : status === "blocked" ? (
        <div>
          <div className="bg-linen rounded-xl px-5 py-5 mb-5">
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
                className="w-full px-4 py-3 rounded-lg border border-border bg-white font-body text-base text-warm-dark placeholder:text-warm-light/50 focus:outline-none focus:ring-2 focus:ring-warm/30 focus:border-warm resize-y min-h-[200px]"
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
              className="w-full font-display text-sm px-6 py-3 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-warm text-white hover:bg-warm-dark"
            >
              Add to Cookbook
            </button>

            <button
              type="button"
              onClick={reset}
              className="w-full font-display text-sm px-6 py-3 rounded-full border border-border text-warm hover:bg-linen transition-colors"
            >
              Try a Different URL
            </button>
          </form>
        </div>
      ) : status === "scraping" ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-linen border-t-warm rounded-full animate-spin mx-auto mb-6" />

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
      ) : status === "success" && result ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="font-display text-xl text-warm-dark mb-2">
            {result.recipe.name}
          </h3>

          <div className="flex justify-center gap-4 text-sm text-warm-light font-body mb-6">
            {result.recipe.servings && <span>{result.recipe.servings} servings</span>}
            <span>{result.recipe.ingredientCount} ingredients</span>
            {result.recipe.hasImage && <span>Photo added</span>}
          </div>

          <p className="font-body text-xs text-warm-light mb-6">
            Live on the site within 60 seconds
          </p>

          <div className="flex gap-3 justify-center">
            <a
              href={`/recipe/${result.recipe.slug}`}
              className="font-display text-sm px-6 py-2.5 rounded-full bg-warm text-white hover:bg-warm-dark transition-colors"
            >
              View Recipe
            </a>
            <button
              onClick={reset}
              className="font-display text-sm px-6 py-2.5 rounded-full border border-border text-warm hover:bg-linen transition-colors"
            >
              Add Another
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
