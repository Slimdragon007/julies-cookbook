"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import {
  BookHeart,
  ArrowRight,
  Mail,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createSupabaseBrowser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/update-password`;
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    setLoading(false);

    if (authError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-amber-100/15 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center relative z-10">
        <div className="relative mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-amber-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_12px_32px_rgba(196,149,46,0.25)] border-4 border-white relative z-10">
            <BookHeart className="text-white w-10 h-10" />
          </div>
          <div className="absolute inset-[-12px] bg-amber-100/50 rounded-[3rem] blur-xl" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">
            Reset password
          </h1>
          <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            Enter your email and we&apos;ll send you a link to set a new
            password.
          </p>
        </div>

        <div className="w-full glass-strong p-8 sm:p-10 rounded-[3rem] relative overflow-hidden">
          {sent ? (
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800">
                Check your email
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                If an account exists for {email}, a reset link is on its way.
                The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="space-y-2">
                <label
                  className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1"
                  htmlFor="email"
                >
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
                    Send reset link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-10">
          <Link
            href="/login"
            className="text-[13px] font-bold text-amber-700 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
