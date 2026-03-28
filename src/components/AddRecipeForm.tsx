"use client";

import { useState } from "react";
import { Link2, Sparkles, Plus, Type, Zap, ScanLine, CheckCircle2, Loader2, ShoppingBasket } from "lucide-react";
import clsx from "clsx";

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
          res.status === 409 ? data.error :
          res.status === 422 ? "Couldn't find a recipe on that page. Try pasting the recipe text instead." :
          "Something went wrong. Please try again."
        );
        return;
      }

      setResult(data);
      setStatus(data.recipe?.hasImage ? "success" : "partial");
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
        body: JSON.stringify({ text: pasteText.trim(), sourceUrl: blockedUrl || undefined }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(
          res.status === 409 ? data.error :
          "Couldn't extract the recipe. Try cleaning up the text and submitting again."
        );
        return;
      }

      setResult(data);
      setStatus(data.recipe?.hasImage ? "success" : "partial");
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
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${status === "success" ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}>
            <CheckCircle2 className={`w-10 h-10 ${status === "success" ? "text-emerald-500" : "text-amber-500"}`} />
          </div>

          <h3 className="text-2xl font-bold text-slate-800 mb-3">{result.recipe.name}</h3>

          <div className="flex justify-center gap-4 text-sm text-slate-500 font-semibold mb-4">
            {result.recipe.servings && <span>{result.recipe.servings} servings</span>}
            <span>{result.recipe.ingredientCount} ingredients</span>
            {result.recipe.hasImage ? (
              <span className="text-emerald-600">Photo added</span>
            ) : (
              <span className="text-amber-600">No photo found</span>
            )}
          </div>

          {status === "partial" && (
            <p className="text-xs text-amber-600 font-medium mb-4">
              Recipe saved but no photo was available. You can add one later.
            </p>
          )}

          <p className="text-xs text-slate-400 mb-8 font-medium">
            Live on the site within 60 seconds
          </p>

          <div className="flex gap-3 justify-center">
            <a
              href={`/recipe/${result.recipe.slug}`}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:shadow-[0_12px_32px_rgba(196,149,46,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              View Recipe
            </a>
            <button
              onClick={reset}
              className="px-8 py-4 glass rounded-2xl text-slate-600 font-bold hover:bg-white/60 transition-all"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 selection:bg-amber-100 selection:text-amber-900">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-3xl shadow-sm mb-6">
            <Plus className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Expand Your Collection</h1>
          <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Paste a recipe URL or copy-paste the recipe text to add it to your cookbook.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-md mx-auto mb-10">
          <div className="glass p-1.5 rounded-[2rem] relative flex items-center">
            <div
              className="absolute bg-white border border-white/60 shadow-md rounded-[1.75rem] z-0 transition-all duration-300"
              style={{
                left: activeTab === "link" ? "6px" : "calc(50% + 2px)",
                width: "calc(50% - 8px)",
                height: "calc(100% - 12px)",
                top: "6px",
              }}
            />
            <button
              onClick={() => { setActiveTab("link"); if (status === "error") setStatus("idle"); }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.75rem] text-sm font-bold transition-all relative z-10",
                activeTab === "link" ? "text-amber-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Link2 className="w-4 h-4" />
              Paste Link
            </button>
            <button
              onClick={() => { setActiveTab("text"); if (status === "error") setStatus("idle"); }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.75rem] text-sm font-bold transition-all relative z-10",
                activeTab === "text" ? "text-amber-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Type className="w-4 h-4" />
              Paste Text
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-200/15 rounded-full blur-[60px] pointer-events-none" />

          <div className="glass-strong rounded-[3rem] p-8 sm:p-12 overflow-hidden relative">
            {/* Loading Overlay */}
            {status === "scraping" && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6 mx-auto relative overflow-hidden">
                  {activeTab === "link" ? (
                    <Link2 className="w-8 h-8 text-amber-600" />
                  ) : (
                    <ScanLine className="w-8 h-8 text-amber-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {steps[step]}
                </h3>
                <div className="flex justify-center gap-2 my-4">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "w-2.5 h-2.5 rounded-full transition-colors",
                        i <= step ? "bg-amber-600" : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  This usually takes 15-30 seconds
                </p>
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin mt-6" />
              </div>
            )}

            {activeTab === "link" ? (
              <form onSubmit={handleUrlSubmit} className="relative z-10">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Smart Import</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Paste a Link</h2>
                  <p className="text-slate-500 font-medium text-sm">We&apos;ll automatically strip out the ads and long stories.</p>
                </div>

                <div className="mb-8">
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://cooking.nytimes.com/recipes/..."
                    className="w-full h-16 glass-input text-slate-800 px-6 rounded-2xl text-[15px] font-medium placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium mb-6">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!url.trim() || status === "scraping"}
                  className="w-full h-16 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:shadow-[0_12px_32px_rgba(196,149,46,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5" />
                  Extract Recipe
                </button>
              </form>
            ) : (
              <form onSubmit={handleTextSubmit} className="relative z-10">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                      <ScanLine className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Text Input</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Paste Recipe Text</h2>
                  <p className="text-slate-500 font-medium text-sm">Copy the recipe from any page and paste it below.</p>
                </div>

                <div className="mb-6">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={"Paste the recipe here — ingredients, instructions, everything you see on the page.\n\nTip: on the recipe page, tap Select All then Copy and paste it all in here. We'll sort it out!"}
                    rows={8}
                    className="w-full glass-input text-slate-800 px-6 py-4 rounded-2xl text-[15px] font-medium placeholder:text-slate-300 shadow-sm resize-y min-h-[200px]"
                    required
                  />
                </div>

                {blockedUrl && (
                  <p className="text-xs text-slate-400 truncate mb-4 font-medium">
                    Source: {blockedUrl}
                  </p>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium mb-6">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!pasteText.trim() || status === "scraping"}
                  className="w-full h-16 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:shadow-[0_12px_32px_rgba(196,149,46,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5" />
                  Extract Recipe
                </button>

                {blockedUrl && (
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full mt-3 h-14 glass rounded-2xl text-slate-500 font-bold hover:bg-white/60 transition-all"
                  >
                    Try a Different URL
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
          <div className="p-6 glass rounded-[2rem]">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Ad-Free Content</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">We extract only the core recipe data, leaving behind the clutter and long intros.</p>
          </div>
          <div className="p-6 glass rounded-[2rem]">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <ShoppingBasket className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Auto-List Sync</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Ingredients are automatically formatted so you can add them to your grocery list with one tap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
