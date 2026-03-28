"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2, Sparkles, ChefHat, ShoppingBasket, ArrowRight,
  Check, Clock, Users, Play, Pause, RotateCcw, X,
  Clipboard, Loader2, BookHeart,
} from "lucide-react";
import clsx from "clsx";

const DEMO_RECIPE = {
  title: "Creamy Tomato Basil Pasta",
  image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
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
  { id: 0, label: "Paste a Link", icon: <Link2 className="w-4 h-4" />, duration: 4500 },
  { id: 1, label: "AI Extracts", icon: <Sparkles className="w-4 h-4" />, duration: 4000 },
  { id: 2, label: "Recipe Ready", icon: <ChefHat className="w-4 h-4" />, duration: 5500 },
  { id: 3, label: "Grocery List", icon: <ShoppingBasket className="w-4 h-4" />, duration: 5000 },
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

  // Auto-advance steps
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

  // Step-specific animations
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
        if (i >= demoUrl.length && intervalRef.current) clearInterval(intervalRef.current);
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
        if (idx >= DEMO_RECIPE.ingredients.length && intervalRef.current) clearInterval(intervalRef.current);
      }, 500);
    }
    if (currentStep === 3) {
      setCheckedItems(new Set());
      let idx = 0;
      intervalRef.current = setInterval(() => {
        idx++;
        setCheckedItems((prev) => { const next = new Set(prev); next.add(idx - 1); return next; });
        if (idx >= DEMO_RECIPE.ingredients.length && intervalRef.current) clearInterval(intervalRef.current);
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
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col relative overflow-hidden selection:bg-sky-100 selection:text-sky-900">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] bg-sky-100/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-5%] right-[5%] w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-6 sm:px-10 pt-12 lg:pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200/50">
            <BookHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-slate-800 text-[15px] font-black tracking-tight leading-none block mb-0.5">
              Julie&apos;s Cookbook
            </span>
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none">
              Interactive Demo
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative z-20 px-6 sm:px-10 max-w-5xl mx-auto flex-1 flex flex-col pt-4">
        {/* Step Progress Bar */}
        <div className="flex items-center gap-2 mb-12 glass p-2 rounded-[2rem] max-w-fit mx-auto lg:mx-0">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => goToStep(idx)}
              className={clsx(
                "flex items-center gap-2.5 px-4 py-3 rounded-[1.75rem] text-[13px] font-bold transition-all whitespace-nowrap relative",
                idx === currentStep
                  ? "text-sky-600 bg-white shadow-md border border-sky-100/50"
                  : idx < currentStep
                  ? "text-emerald-600 bg-white/40 hover:bg-white/60"
                  : "text-slate-400 bg-transparent hover:bg-white/20"
              )}
            >
              {idx < currentStep ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <div className={clsx("w-5 h-5 rounded-lg flex items-center justify-center", idx === currentStep ? "bg-sky-50" : "bg-slate-100/50")}>
                  {step.icon}
                </div>
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          ))}

          <div className="w-px h-6 bg-slate-200/50 mx-2" />

          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-2xl bg-white border border-white shadow-sm flex items-center justify-center text-slate-500 hover:text-sky-600 transition-all active:scale-90"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>
            <button
              onClick={restart}
              className="w-10 h-10 rounded-2xl bg-white border border-white shadow-sm flex items-center justify-center text-slate-500 hover:text-sky-600 transition-all active:scale-90"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {/* Step 0: Paste a link */}
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-sky-100">
                    <Link2 className="w-3 h-3" /> Step 01: Capture
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-6 tracking-tight leading-[1.1]">
                    Import from <span className="text-sky-500">Anywhere.</span>
                  </h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Just copy the URL of any recipe website. We&apos;ll extract only the ingredients and steps, leaving the ads behind.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="glass-strong rounded-[3rem] p-10 relative">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center">
                        <Clipboard className="w-5 h-5 text-sky-500" />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">URL Smart Detector</span>
                    </div>

                    <div className="bg-white/80 border border-sky-100 rounded-2xl px-6 py-5 min-h-[64px] flex items-center shadow-inner mb-6">
                      <span className="text-slate-700 font-bold text-[15px] break-all">
                        {typedUrl}
                      </span>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-1 h-6 bg-sky-400 ml-1 rounded-full"
                      />
                    </div>

                    <div className={clsx(
                      "bg-sky-500 text-white py-5 rounded-2xl font-black text-center text-[15px] shadow-[0_8px_24px_rgba(0,166,244,0.25)] flex items-center justify-center gap-3 transition-opacity",
                      typedUrl.length > 30 ? "opacity-100" : "opacity-40"
                    )}>
                      Import Recipe <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: AI extracting */}
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-orange-100">
                    <Sparkles className="w-3 h-3" /> Step 02: Intelligence
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-6 tracking-tight leading-[1.1]">
                    AI-Powered <span className="text-orange-500">Extraction.</span>
                  </h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Our AI parses recipes from any website, instantly structuring ingredients, cook times, and nutritional data into a clean format.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="glass-strong rounded-[3rem] p-10">
                    <div className="flex justify-center mb-10">
                      <div className="relative">
                        <div className="absolute inset-[-20px] bg-orange-400/20 rounded-full blur-3xl animate-pulse" />
                        <div className="relative w-20 h-20 bg-white border border-orange-100 rounded-[2rem] flex items-center justify-center shadow-md">
                          <Sparkles className="w-9 h-9 text-orange-400" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between text-xs font-black mb-3 px-1">
                        <span className="text-slate-400 uppercase tracking-widest">Parsing Structure...</span>
                        <span className="text-orange-500">{extractProgress}%</span>
                      </div>
                      <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden border border-white shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-100"
                          style={{ width: `${extractProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {["Recipe Metadata", "Ingredient Parsing", "Method Structuring", "Nutritional Data"].map((item, i) => {
                        const done = extractProgress > (i + 1) * 24;
                        const active = extractProgress > i * 24 && !done;
                        return (
                          <div
                            key={item}
                            className={clsx(
                              "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all border",
                              done ? "bg-emerald-50/50 border-emerald-100" : "bg-white/40 border-transparent"
                            )}
                          >
                            <div className={clsx(
                              "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm",
                              done ? "bg-emerald-500 text-white" : active ? "bg-orange-100 text-orange-500" : "bg-slate-100 text-slate-300"
                            )}>
                              {done ? <Check className="w-4 h-4 stroke-[4]" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            </div>
                            <span className={clsx(
                              "text-[14px] font-bold",
                              done ? "text-emerald-700" : active ? "text-orange-700" : "text-slate-400"
                            )}>
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

            {/* Step 2: Recipe display */}
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-emerald-100">
                    <ChefHat className="w-3 h-3" /> Step 03: Organization
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-6 tracking-tight leading-[1.1]">
                    Pure, Clean <span className="text-emerald-500">Design.</span>
                  </h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                    No clutter, no popups. Just your recipe, beautifully presented with all the details you need to cook with confidence.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="glass-strong rounded-[3rem] overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={DEMO_RECIPE.image} alt={DEMO_RECIPE.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-8 right-8">
                        <span className="px-2 py-0.5 bg-emerald-500/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                          Easy Prep
                        </span>
                        <h3 className="text-2xl font-black text-white leading-tight mt-2">{DEMO_RECIPE.title}</h3>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-3 gap-3 mb-8">
                        {[
                          { icon: <Clock className="w-4 h-4 text-emerald-500" />, text: DEMO_RECIPE.prepTime, label: "Prep" },
                          { icon: <Clock className="w-4 h-4 text-emerald-500" />, text: DEMO_RECIPE.cookTime, label: "Cook" },
                          { icon: <Users className="w-4 h-4 text-emerald-500" />, text: `${DEMO_RECIPE.servings}p`, label: "Yield" },
                        ].map((s, i) => (
                          <div key={i} className="glass p-3 rounded-2xl flex flex-col items-center gap-1">
                            {s.icon}
                            <span className="text-[12px] font-black text-slate-700 leading-none">{s.text}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{s.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Ingredients</h4>
                        {DEMO_RECIPE.ingredients.slice(0, 5).map((ing, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{
                              opacity: i < revealedIngredients ? 1 : 0,
                              x: i < revealedIngredients ? 0 : -10,
                            }}
                            className="flex items-center gap-3 text-[14px] font-bold text-slate-600 glass p-3 rounded-2xl"
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            {ing}
                          </motion.div>
                        ))}
                        <p className="text-[11px] font-bold text-slate-400 pl-2">+ {DEMO_RECIPE.ingredients.length - 5} more items...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Grocery List */}
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-sky-100">
                    <ShoppingBasket className="w-3 h-3" /> Step 04: Shopping
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-6 tracking-tight leading-[1.1]">
                    Smart <span className="text-sky-500">Groceries.</span>
                  </h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Instantly sync ingredients to your shopping list. Mark them off as you go, and never wander aimlessly through aisles again.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full">
                  <div className="glass-strong rounded-[3rem] p-10 relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-sky-200/20 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8 px-1">
                        <div>
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Weekly List</h4>
                          <span className="text-[14px] font-black text-slate-800">Fresh Pantry</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-sky-600 leading-none block">
                            {Math.round((checkedItems.size / DEMO_RECIPE.ingredients.length) * 100)}%
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-white shadow-inner mb-10">
                        <motion.div
                          animate={{ width: `${(checkedItems.size / DEMO_RECIPE.ingredients.length) * 100}%` }}
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                        />
                      </div>

                      <div className="space-y-3">
                        {DEMO_RECIPE.ingredients.slice(0, 6).map((ing, i) => {
                          const checked = checkedItems.has(i);
                          return (
                            <div
                              key={i}
                              className={clsx(
                                "flex items-center gap-4 py-4 px-5 rounded-2xl border transition-all",
                                checked ? "bg-white/20 border-white/40 opacity-60" : "bg-white/60 border-white shadow-sm"
                              )}
                            >
                              <div className={clsx(
                                "w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all shadow-sm",
                                checked ? "bg-emerald-500 border-emerald-500" : "border-sky-100 bg-white"
                              )}>
                                {checked && <Check className="w-4 h-4 text-white stroke-[4]" />}
                              </div>
                              <span className={clsx(
                                "text-[14px] font-bold transition-all",
                                checked ? "text-slate-400 line-through" : "text-slate-700"
                              )}>
                                {ing}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="mt-20 pb-16 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-40">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-500 text-white px-10 py-5 rounded-[2rem] font-black text-[16px] flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(0,166,244,0.3)] hover:shadow-[0_16px_48px_rgba(0,166,244,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Try It Yourself — Create an Account
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-slate-500 hover:text-sky-600 px-8 py-5 rounded-[2rem] font-bold text-[15px] transition-all glass"
          >
            Sign in to Existing Account
          </Link>
        </div>
      </div>
    </div>
  );
}
