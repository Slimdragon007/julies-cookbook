"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookHeart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, InputLabel } from "@/components/ui/Input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
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
      body: JSON.stringify({
        email,
        password,
        inviteCode,
        displayName: displayName.trim(),
      }),
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
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center text-center animate-drift-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-ink mb-6">
            <Sparkles size={28} aria-hidden />
          </div>
          <h1 className="font-display text-h1 text-ink mb-3">
            Welcome to the family.
          </h1>
          <p className="font-sans text-base text-ink-soft leading-relaxed max-w-[280px]">
            Your account is ready. Redirecting you to sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-ink mb-6">
          <BookHeart size={28} aria-hidden />
        </div>

        <h1 className="font-display text-h1 sm:text-display-mobile text-ink text-center mb-3">
          Join the Cookbook
        </h1>
        <p className="font-sans text-base text-ink-soft leading-relaxed text-center max-w-[320px] mb-10">
          Create your account with an invite code.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="space-y-1.5">
            <InputLabel htmlFor="invite" className="text-accent">
              Invite Code
            </InputLabel>
            <Input
              id="invite"
              type="text"
              required
              autoFocus
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="border-accent/40 focus:border-accent focus:ring-accent/15"
            />
          </div>

          <div className="space-y-1.5">
            <InputLabel htmlFor="displayName">Your Name</InputLabel>
            <Input
              id="displayName"
              type="text"
              required
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="First and last name"
            />
          </div>

          <div className="space-y-1.5">
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <InputLabel htmlFor="password">Password</InputLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="space-y-1.5">
            <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded border border-accent-ink/40 bg-accent-soft px-4 py-3 font-sans text-sm text-ink-soft"
            >
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign Up
          </Button>
        </form>

        <p className="font-sans text-sm text-ink-mute mt-8 text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-sans font-medium text-accent hover:text-accent-ink transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
