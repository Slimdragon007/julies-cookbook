"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookHeart, ArrowRight, Mail, Lock, KeyRound, Loader2, Sparkles } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, inviteCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-sky-100">
            <Sparkles className="w-8 h-8 text-sky-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">
            Welcome to the family!
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Your account is ready. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-4 relative overflow-hidden selection:bg-sky-100 selection:text-sky-900">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-sky-100/30 rounded-full blur-[120px] animate-[float1_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-blue-100/20 rounded-full blur-[140px] animate-[float2_12s_ease-in-out_infinite]" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-500 rounded-[2rem] flex items-center justify-center shadow-[0_12px_32px_rgba(0,166,244,0.25)] border-4 border-white">
              <BookHeart className="text-white w-8 h-8" />
            </div>
            <div className="absolute inset-[-10px] bg-sky-100/50 rounded-[2.5rem] blur-xl -z-10" />
          </div>
        </div>

        <div className="glass-strong rounded-[3rem] p-8 sm:p-10 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Join the Cookbook</h1>
            <p className="text-sm text-slate-500 font-medium">Create your account with an invite code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="invite" className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase tracking-[0.2em] pl-1">
                <KeyRound className="w-3 h-3" />
                Invite Code
              </label>
              <input
                id="invite"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
                placeholder="Enter invite code"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase tracking-[0.2em] pl-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase tracking-[0.2em] pl-1">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase tracking-[0.2em] pl-1">
                <Lock className="w-3 h-3" />
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
                placeholder="Confirm password"
                required
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
              className="w-full h-16 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-[1.75rem] font-bold text-[16px] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_12px_24px_rgba(0,166,244,0.3)] hover:shadow-[0_16px_32px_rgba(0,166,244,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
