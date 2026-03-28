"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { BookHeart, ArrowRight, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : "Something went wrong. Please try again."
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col items-center justify-center px-4 relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] animate-[float1_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-amber-100/15 rounded-full blur-[140px] animate-[float2_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(196, 149, 46, 0.2) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(196, 149, 46, 0.2) 1.5px, transparent 1.5px)',
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center relative z-10">
        {/* Logo */}
        <div className="relative mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-amber-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_12px_32px_rgba(196,149,46,0.25)] border-4 border-white relative z-10">
            <BookHeart className="text-white w-10 h-10" />
          </div>
          <div className="absolute inset-[-12px] bg-amber-100/50 rounded-[3rem] blur-xl" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">Julie&apos;s Cookbook</h1>
          <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            A meditative space to organize your recipes and simplify your kitchen workflow.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full glass-strong p-8 sm:p-10 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-[40px] pointer-events-none" />

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1" htmlFor="email">
                <Mail className="w-3 h-3" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="julie@example.com"
                className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pr-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1" htmlFor="password">
                  <Lock className="w-3 h-3" />
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-[1.75rem] font-bold text-[16px] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_12px_24px_rgba(196,149,46,0.3)] hover:shadow-[0_16px_32px_rgba(196,149,46,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-slate-200" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">New to Cookbook?</span>
            <div className="h-px w-8 bg-slate-200" />
          </div>

          <Link
            href="/demo"
            className="group flex items-center gap-4 px-6 py-3 rounded-2xl glass hover:bg-white/60 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <svg className="w-3.5 h-3.5 ml-0.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[13px] font-bold text-slate-800 leading-none mb-0.5">See How It Works</p>
              <p className="text-[11px] font-medium text-slate-400 leading-none">Interactive demo — no account needed</p>
            </div>
          </Link>

          <Link
            href="/signup"
            className="text-[13px] font-bold text-amber-700 hover:underline transition-all"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
