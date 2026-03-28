"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl text-warm-dark mb-4">
            Welcome to the family!
          </h1>
          <p className="font-body text-sm text-warm-light">
            Your account is ready. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-gold/[0.06] rounded-full blur-[80px] pointer-events-none" />
      <div className="w-full max-w-sm z-10">
        <div className="glass-strong rounded-2xl p-7 space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-warm-dark mb-2">
            Join the Cookbook
          </h1>
          <p className="font-body text-sm text-warm-light">
            Create your account with an invite code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="invite"
              className="block font-body text-sm text-warm-dark mb-1"
            >
              Invite Code
            </label>
            <input
              id="invite"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input font-body text-base text-warm-dark placeholder:text-warm-light/40 focus:outline-none"
              placeholder="Enter invite code"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-body text-sm text-warm-dark mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input font-body text-base text-warm-dark placeholder:text-warm-light/40 focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-body text-sm text-warm-dark mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input font-body text-base text-warm-dark placeholder:text-warm-light/40 focus:outline-none"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-body text-sm text-warm-dark mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input font-body text-base text-warm-dark placeholder:text-warm-light/40 focus:outline-none"
              placeholder="Confirm password"
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
            disabled={loading}
            className="w-full font-display text-sm px-6 py-3 rounded-xl bg-gold text-cream hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center font-body text-sm text-warm-light/50">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
