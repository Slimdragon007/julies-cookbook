"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Sparkles,
  Plus,
  Type,
  Zap,
  ScanLine,
  CheckCircle2,
  Loader2,
  ShoppingBasket,
} from "lucide-react";
import clsx from "clsx";
import { Button, buttonClass } from "@/components/ui/Button";

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
type Tab = "link" | "text";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("link");
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");
  const [blockedUrl, setBlockedUrl] = useState("");

  const steps = blockedUrl || activeTab === "text" ? TEXT_STEPS : URL_STEPS;

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
        setActiveTab("text");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setError(
          res.status === 409
            ? data.error
            : res.status === 422
              ? "Couldn't find a recipe on that page. Try pasting the recipe text instead."
              : "Something went wrong. Please try again.",
        );
        return;
      }

      setResult(data);
      setStatus(data.recipe?.hasImage ? "success" : "partial");
      router.refresh();
    } catch {
      clearInterval(interval);
      setStatus("error");
      setError("Couldn't connect. Check your internet and try again.");
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
        body: JSON.stringify({
          text: pasteText.trim(),
          sourceUrl: blockedUrl || undefined,
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(
          res.status === 409
            ? data.error
            : "Couldn't extract the recipe. Try cleaning up the text and submitting again.",
        );
        return;
      }

      setResult(data);
      setStatus(data.recipe?.hasImage ? "success" : "partial");
      router.refresh();
    } catch {
      clearInterval(interval);
      setStatus("error");
      setError("Couldn't connect. Check your internet and try again.");
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

  // Success / Partial state
  if ((status === "success" || status === "partial") && result) {
    return (
      <div className="min-h-screen pt-20 lg:pt-10 pb-32">
        <div className="max-w-2xl mx-auto px-4 text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-accent-soft border border-accent-soft">
            <CheckCircle2 className="w-10 h-10 text-accent-ink" />
          </div>

          <h3 className="font-display text-[32px] text-ink mb-3">
            {result.recipe.name}
          </h3>

          <div className="flex justify-center gap-4 font-mono text-sm text-ink-soft tabular-nums mb-4">
            {result.recipe.servings && (
              <span>{result.recipe.servings} servings</span>
            )}
            <span>{result.recipe.ingredientCount} ingredients</span>
            {result.recipe.hasImage ? (
              <span className="text-accent">Photo added</span>
            ) : (
              <span className="text-accent-ink">No photo found</span>
            )}
          </div>

          {status === "partial" && (
            <p className="font-sans text-xs text-accent-ink font-medium mb-4">
              Recipe saved but no photo was available. You can add one later.
            </p>
          )}

          <p className="font-sans text-xs text-ink-mute mb-8 font-medium">
            Live on the site within 60 seconds.
          </p>

          <div className="flex gap-3 justify-center">
            <a
              href={`/recipe/${result.recipe.slug}`}
              className={buttonClass("primary")}
            >
              View recipe
            </a>
            <button onClick={reset} className={buttonClass("secondary")}>
              Add another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-soft text-accent-ink rounded-full mb-6">
            <Plus className="w-8 h-8" />
          </div>
          <h1 className="font-display text-[40px] sm:text-[52px] text-ink leading-[1.05] mb-3">
            Expand your collection
          </h1>
          <p className="font-sans text-base text-ink-soft max-w-sm mx-auto leading-relaxed">
            Paste a recipe URL or the recipe text itself; we&apos;ll do the
            rest.
          </p>
        </header>

        {/* Tab switcher */}
        <div className="max-w-md mx-auto mb-10">
          <div className="bg-card border border-rule p-1 rounded-pill relative flex items-center">
            <div
              className="absolute bg-accent rounded-pill z-0 transition-all duration-300 ease-hearth"
              style={{
                left: activeTab === "link" ? "4px" : "calc(50% + 0px)",
                width: "calc(50% - 4px)",
                height: "calc(100% - 8px)",
                top: "4px",
              }}
            />
            <button
              onClick={() => {
                setActiveTab("link");
                if (status === "error") setStatus("idle");
              }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-pill font-sans text-sm font-semibold transition-colors relative z-10",
                activeTab === "link"
                  ? "text-accent-on"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <Link2 className="w-4 h-4" />
              Paste link
            </button>
            <button
              onClick={() => {
                setActiveTab("text");
                if (status === "error") setStatus("idle");
              }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-pill font-sans text-sm font-semibold transition-colors relative z-10",
                activeTab === "text"
                  ? "text-accent-on"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <Type className="w-4 h-4" />
              Paste text
            </button>
          </div>
        </div>

        {/* Form card */}
        <div className="relative">
          <div
            className="absolute -top-10 -right-10 w-40 h-40 bg-accent-soft/60 rounded-full blur-[60px] pointer-events-none"
            aria-hidden
          />

          <div className="bg-card border border-rule rounded-lg shadow-lift p-8 sm:p-12 overflow-hidden relative">
            {/* Loading overlay */}
            {status === "scraping" && (
              <div className="absolute inset-0 bg-paper/85 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center mb-6 mx-auto">
                  {activeTab === "link" ? (
                    <Link2 className="w-8 h-8" />
                  ) : (
                    <ScanLine className="w-8 h-8" />
                  )}
                </div>
                <h3 className="font-display text-[24px] text-ink mb-2">
                  {steps[step]}
                </h3>
                <div className="flex justify-center gap-2 my-4">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "w-2.5 h-2.5 rounded-full transition-colors",
                        i <= step ? "bg-accent" : "bg-rule",
                      )}
                    />
                  ))}
                </div>
                <p className="font-sans text-sm text-ink-soft">
                  This usually takes 15-30 seconds.
                </p>
                <Loader2 className="w-6 h-6 text-accent animate-spin mt-6" />
              </div>
            )}

            {activeTab === "link" ? (
              <form onSubmit={handleUrlSubmit} className="relative z-10">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-sans text-[10px] font-semibold text-accent uppercase tracking-[0.15em]">
                      Smart import
                    </span>
                  </div>
                  <h2 className="font-display text-[28px] text-ink mb-2 leading-tight">
                    Paste a link
                  </h2>
                  <p className="font-sans text-sm text-ink-soft">
                    We&apos;ll strip the ads and long stories automatically.
                  </p>
                </div>

                <div className="mb-8">
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://cooking.nytimes.com/recipes/..."
                    className="w-full px-5 py-4 rounded font-sans text-[15px] text-ink placeholder:text-ink-mute bg-paper border border-rule outline-none transition-colors hover:border-accent/30 focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                </div>

                {error && (
                  <div className="bg-accent-soft border border-accent-ink/30 rounded px-4 py-3 font-sans text-sm text-accent-ink mb-6">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!url.trim() || status === "scraping"}
                  className="w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Extract recipe
                </Button>
              </form>
            ) : (
              <form onSubmit={handleTextSubmit} className="relative z-10">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center">
                      <ScanLine className="w-4 h-4" />
                    </div>
                    <span className="font-sans text-[10px] font-semibold text-accent uppercase tracking-[0.15em]">
                      Text input
                    </span>
                  </div>
                  <h2 className="font-display text-[28px] text-ink mb-2 leading-tight">
                    Paste recipe text
                  </h2>
                  <p className="font-sans text-sm text-ink-soft">
                    Copy the recipe from any page and paste it below.
                  </p>
                </div>

                <div className="mb-6">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={
                      "Paste the recipe here. Ingredients, instructions, everything you see on the page.\n\nTip: on the recipe page, tap Select All then Copy and paste it all in here. We'll sort it out."
                    }
                    rows={8}
                    className="w-full px-5 py-4 rounded font-sans text-[15px] text-ink placeholder:text-ink-mute bg-paper border border-rule outline-none transition-colors hover:border-accent/30 focus:border-accent focus:ring-2 focus:ring-accent/15 resize-y min-h-[200px]"
                    required
                  />
                </div>

                {blockedUrl && (
                  <p className="font-mono text-xs text-ink-mute truncate mb-4">
                    Source: {blockedUrl}
                  </p>
                )}

                {error && (
                  <div className="bg-accent-soft border border-accent-ink/30 rounded px-4 py-3 font-sans text-sm text-accent-ink mb-6">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!pasteText.trim() || status === "scraping"}
                  className="w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Extract recipe
                </Button>

                {blockedUrl && (
                  <button
                    type="button"
                    onClick={reset}
                    className={clsx(buttonClass("secondary"), "w-full mt-3")}
                  >
                    Try a different URL
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Quick tips */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-card border border-rule rounded shadow-lift-sm">
            <div className="w-10 h-10 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-display text-[18px] text-ink mb-1">
              Ad-free content
            </h4>
            <p className="font-sans text-xs text-ink-soft leading-relaxed">
              We extract only the core recipe data, leaving the clutter and the
              long intros behind.
            </p>
          </div>
          <div className="p-6 bg-card border border-rule rounded shadow-lift-sm">
            <div className="w-10 h-10 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center mb-4">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <h4 className="font-display text-[18px] text-ink mb-1">
              Auto-list sync
            </h4>
            <p className="font-sans text-xs text-ink-soft leading-relaxed">
              Ingredients are auto-formatted so you can drop them into your
              grocery list with one tap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
