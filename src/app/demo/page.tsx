"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  Sparkles,
  ChefHat,
  ShoppingBasket,
  Check,
  Clock,
  Users,
  Play,
  Pause,
  RotateCcw,
  X,
  Clipboard,
  Loader2,
  BookHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { StepRibbon } from "@/components/ui/StepRibbon";

const DEMO_RECIPE = {
  title: "Creamy Tomato Basil Pasta",
  image:
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
  prepTime: "15 min",
  cookTime: "20 min",
  servings: 4,
  ingredients: [
    "1 lb Penne pasta",
    "2 tbsp Olive oil",
    "1 medium Onion, diced",
    "3 cloves Garlic, minced",
    "1 can Crushed tomatoes",
    "1/2 cup Heavy cream",
    "Fresh basil, chopped",
  ],
};

interface Step {
  id: number;
  label: string;
  icon: React.ReactNode;
  duration: number;
}

const steps: Step[] = [
  {
    id: 0,
    label: "Paste a Link",
    icon: <Link2 className="w-4 h-4" />,
    duration: 4500,
  },
  {
    id: 1,
    label: "AI Extracts",
    icon: <Sparkles className="w-4 h-4" />,
    duration: 4000,
  },
  {
    id: 2,
    label: "Recipe Ready",
    icon: <ChefHat className="w-4 h-4" />,
    duration: 5500,
  },
  {
    id: 3,
    label: "Grocery List",
    icon: <ShoppingBasket className="w-4 h-4" />,
    duration: 5000,
  },
];

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedUrl, setTypedUrl] = useState("");
  const [extractProgress, setExtractProgress] = useState(0);
  const [revealedIngredients, setRevealedIngredients] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const demoUrl = "https://myfavoriterecipes.com/creamy-tomato-basil-pasta";

  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setIsPlaying(false);
      }
    }, steps[currentStep].duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isPlaying]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (currentStep === 0) {
      setTypedUrl("");
      setExtractProgress(0);
      setRevealedIngredients(0);
      setCheckedItems(new Set());
      let i = 0;
      intervalRef.current = setInterval(() => {
        i++;
        setTypedUrl(demoUrl.slice(0, i));
        if (i >= demoUrl.length && intervalRef.current)
          clearInterval(intervalRef.current);
      }, 50);
    }
    if (currentStep === 1) {
      setExtractProgress(0);
      let p = 0;
      intervalRef.current = setInterval(() => {
        p += 2;
        setExtractProgress(Math.min(p, 100));
        if (p >= 100 && intervalRef.current) clearInterval(intervalRef.current);
      }, 60);
    }
    if (currentStep === 2) {
      setRevealedIngredients(0);
      let idx = 0;
      intervalRef.current = setInterval(() => {
        idx++;
        setRevealedIngredients(idx);
        if (idx >= DEMO_RECIPE.ingredients.length && intervalRef.current)
          clearInterval(intervalRef.current);
      }, 500);
    }
    if (currentStep === 3) {
      setCheckedItems(new Set());
      let idx = 0;
      intervalRef.current = setInterval(() => {
        idx++;
        setCheckedItems((prev) => {
          const next = new Set(prev);
          next.add(idx - 1);
          return next;
        });
        if (idx >= DEMO_RECIPE.ingredients.length && intervalRef.current)
          clearInterval(intervalRef.current);
      }, 600);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentStep]);

  const restart = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const goToStep = (idx: number) => {
    setCurrentStep(idx);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="relative z-30 flex items-center justify-between px-6 sm:px-10 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-linen text-brown">
            <BookHeart size={18} aria-hidden />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-semibold text-[15px] text-ink">
              Julie&apos;s Cookbook
            </span>
            <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-ink-mute">
              Interactive Demo
            </span>
          </div>
        </div>
        <Link
          href="/login"
          aria-label="Close demo"
          className={cn(
            "inline-flex items-center justify-center w-10 h-10 rounded-full",
            "bg-transparent text-ink-mute",
            "transition-colors duration-150 ease-hearth",
            "hover:bg-linen hover:text-ink",
          )}
        >
          <X size={18} aria-hidden />
        </Link>
      </header>

      <div className="relative z-20 px-6 sm:px-10 max-w-5xl mx-auto w-full flex-1 flex flex-col pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <StepRibbon
            steps={steps}
            currentStep={currentStep}
            onSelect={goToStep}
            className="flex-1"
          />

          <div className="flex items-center gap-2 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-linen text-ink-soft hover:bg-linen-dim hover:text-ink transition-colors duration-150 ease-hearth"
            >
              {isPlaying ? (
                <Pause size={16} aria-hidden />
              ) : (
                <Play size={16} aria-hidden className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label="Restart"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-linen text-ink-soft hover:bg-linen-dim hover:text-ink transition-colors duration-150 ease-hearth"
            >
              <RotateCcw size={16} aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brown-glass text-brown font-sans text-[11px] font-semibold uppercase tracking-[0.15em] rounded-pill mb-6">
                    <Link2 className="w-3 h-3" /> Step 01: Capture
                  </div>
                  <h2 className="font-display font-semibold text-[36px] sm:text-[48px] text-ink mb-5 tracking-tight leading-[1.1]">
                    Import from <span className="text-brown">Anywhere.</span>
                  </h2>
                  <p className="font-serif text-base sm:text-lg text-ink-soft leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Just copy the URL of any recipe website. We&apos;ll extract
                    only the ingredients and steps, leaving the ads behind.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="bg-linen rounded-lg shadow-lift p-8 sm:p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-cream text-brown">
                        <Clipboard className="w-4 h-4" />
                      </div>
                      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-mute">
                        URL Smart Detector
                      </span>
                    </div>

                    <div className="bg-cream border border-brown-glass rounded px-5 py-4 min-h-[60px] flex items-center mb-6">
                      <span className="font-sans text-[14px] text-ink break-all">
                        {typedUrl}
                      </span>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-0.5 h-5 bg-brown ml-1 rounded-full"
                      />
                    </div>

                    <div
                      className={cn(
                        "rounded-pill px-6 py-3.5 text-center font-sans font-semibold text-[15px]",
                        "bg-brown text-cream transition-opacity duration-200",
                        typedUrl.length > 30 ? "opacity-100" : "opacity-40",
                      )}
                    >
                      Import Recipe
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div className="text-center lg:text-left order-first lg:order-last">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-ember/10 text-ember font-sans text-[11px] font-semibold uppercase tracking-[0.15em] rounded-pill mb-6">
                    <Sparkles className="w-3 h-3" /> Step 02: Intelligence
                  </div>
                  <h2 className="font-display font-semibold text-[36px] sm:text-[48px] text-ink mb-5 tracking-tight leading-[1.1]">
                    AI-Powered <span className="text-ember">Extraction.</span>
                  </h2>
                  <p className="font-serif text-base sm:text-lg text-ink-soft leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Our AI parses recipes from any website, instantly
                    structuring ingredients, cook times, and nutritional data
                    into a clean format.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="bg-linen rounded-lg shadow-lift p-8 sm:p-10">
                    <div className="flex justify-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream text-ember">
                        <Sparkles className="w-7 h-7" />
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between font-sans text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 px-1">
                        <span className="text-ink-mute">Parsing Structure</span>
                        <span className="text-ember tabular-nums">
                          {extractProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-brown-glass">
                        <div
                          className="h-full bg-ember rounded-full transition-all duration-100"
                          style={{ width: `${extractProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        "Recipe Metadata",
                        "Ingredient Parsing",
                        "Method Structuring",
                        "Nutritional Data",
                      ].map((item, i) => {
                        const done = extractProgress > (i + 1) * 24;
                        const active = extractProgress > i * 24 && !done;
                        return (
                          <div
                            key={item}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded transition-colors",
                              done ? "bg-leaf/10" : "bg-cream",
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                done
                                  ? "bg-leaf text-cream"
                                  : active
                                    ? "bg-ember/20 text-ember"
                                    : "bg-linen-dim text-ink-mute",
                              )}
                            >
                              {done ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : active ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : null}
                            </div>
                            <span
                              className={cn(
                                "font-sans text-[14px] font-medium",
                                done
                                  ? "text-ink"
                                  : active
                                    ? "text-ink-soft"
                                    : "text-ink-mute",
                              )}
                            >
                              {item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-leaf/10 text-leaf font-sans text-[11px] font-semibold uppercase tracking-[0.15em] rounded-pill mb-6">
                    <ChefHat className="w-3 h-3" /> Step 03: Organization
                  </div>
                  <h2 className="font-display font-semibold text-[36px] sm:text-[48px] text-ink mb-5 tracking-tight leading-[1.1]">
                    Pure, Clean <span className="text-leaf">Design.</span>
                  </h2>
                  <p className="font-serif text-base sm:text-lg text-ink-soft leading-relaxed max-w-lg mx-auto lg:mx-0">
                    No clutter, no popups. Just your recipe, beautifully
                    presented with all the details you need to cook with
                    confidence.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="bg-linen rounded-lg shadow-lift overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={DEMO_RECIPE.image}
                        alt={DEMO_RECIPE.title}
                        fill
                        sizes="400px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-6 right-6">
                        <span className="inline-block px-2 py-0.5 bg-leaf/90 text-cream font-sans text-[10px] font-semibold uppercase tracking-[0.12em] rounded-pill">
                          Easy Prep
                        </span>
                        <h3 className="font-display font-semibold text-2xl text-cream leading-tight mt-2">
                          {DEMO_RECIPE.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-7">
                      <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-linen-dim">
                        {[
                          {
                            icon: <Clock className="w-4 h-4 text-brown" />,
                            text: DEMO_RECIPE.prepTime,
                            label: "Prep",
                          },
                          {
                            icon: <Clock className="w-4 h-4 text-brown" />,
                            text: DEMO_RECIPE.cookTime,
                            label: "Cook",
                          },
                          {
                            icon: <Users className="w-4 h-4 text-brown" />,
                            text: `${DEMO_RECIPE.servings}`,
                            label: "Servings",
                          },
                        ].map((s, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center gap-1"
                          >
                            {s.icon}
                            <span className="font-sans text-[14px] font-semibold text-ink leading-none tabular-nums">
                              {s.text}
                            </span>
                            <span className="font-sans text-[10px] font-semibold text-ink-mute uppercase tracking-[0.1em] leading-none">
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-brown mb-3">
                          Ingredients
                        </h4>
                        <div className="space-y-1.5">
                          {DEMO_RECIPE.ingredients.slice(0, 5).map((ing, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{
                                opacity: i < revealedIngredients ? 1 : 0,
                                x: i < revealedIngredients ? 0 : -8,
                              }}
                              className="flex items-center gap-3 font-serif text-[14px] text-ink py-1.5"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-leaf shrink-0" />
                              {ing}
                            </motion.div>
                          ))}
                          <p className="font-serif text-[12px] italic text-ink-mute pl-5 pt-1">
                            + {DEMO_RECIPE.ingredients.length - 5} more
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div className="text-center lg:text-left order-first lg:order-last">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 text-brown-deep font-sans text-[11px] font-semibold uppercase tracking-[0.15em] rounded-pill mb-6">
                    <ShoppingBasket className="w-3 h-3" /> Step 04: Shopping
                  </div>
                  <h2 className="font-display font-semibold text-[36px] sm:text-[48px] text-ink mb-5 tracking-tight leading-[1.1]">
                    Smart <span className="text-gold">Groceries.</span>
                  </h2>
                  <p className="font-serif text-base sm:text-lg text-ink-soft leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Instantly sync ingredients to your shopping list. Mark them
                    off as you go, and never wander aimlessly through aisles
                    again.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="bg-linen rounded-lg shadow-lift p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-mute leading-none mb-1.5">
                          Weekly List
                        </h4>
                        <span className="font-display font-semibold text-[18px] text-ink">
                          Fresh Pantry
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-sans text-2xl font-semibold text-brown leading-none block tabular-nums">
                          {Math.round(
                            (checkedItems.size /
                              DEMO_RECIPE.ingredients.length) *
                              100,
                          )}
                          %
                        </span>
                        <span className="font-sans text-[10px] font-semibold text-ink-mute uppercase tracking-[0.15em]">
                          Done
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-brown-glass mb-6">
                      <motion.div
                        animate={{
                          width: `${
                            (checkedItems.size /
                              DEMO_RECIPE.ingredients.length) *
                            100
                          }%`,
                        }}
                        className="h-full bg-leaf rounded-full"
                      />
                    </div>

                    <div className="space-y-2">
                      {DEMO_RECIPE.ingredients.slice(0, 6).map((ing, i) => {
                        const checked = checkedItems.has(i);
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-3 py-3 px-4 rounded transition-colors",
                              checked ? "bg-cream opacity-60" : "bg-cream",
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                checked
                                  ? "bg-leaf border-leaf"
                                  : "border-brown-glass bg-transparent",
                              )}
                            >
                              {checked && (
                                <Check className="w-3.5 h-3.5 text-cream stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "font-serif text-[14px] transition-all",
                                checked
                                  ? "text-ink-mute line-through"
                                  : "text-ink",
                              )}
                            >
                              {ing}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-16 pb-16 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-40">
          <Link
            href="/signup"
            className={buttonClass("primary", "w-full sm:w-auto")}
          >
            Try It Yourself
          </Link>
          <Link
            href="/login"
            className={buttonClass("secondary", "w-full sm:w-auto")}
          >
            Sign in to Existing Account
          </Link>
        </div>
      </div>
    </div>
  );
}
