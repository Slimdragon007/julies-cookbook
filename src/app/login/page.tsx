"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookHeart } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, InputLabel } from "@/components/ui/Input";

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
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linen text-brown mb-6">
          <BookHeart size={28} aria-hidden />
        </div>

        <h1 className="font-display font-semibold text-display-mobile sm:text-display text-ink text-center mb-3">
          Julie&apos;s Cookbook
        </h1>
        <p className="font-serif text-base text-ink-soft leading-relaxed text-center max-w-[320px] mb-10">
          A meditative space to organize your recipes and simplify your kitchen
          workflow.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="space-y-1.5">
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="julie@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <InputLabel htmlFor="password">Password</InputLabel>
              <Link
                href="/auth/reset"
                className="font-sans text-xs font-medium text-brown hover:text-brown-deep transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded border border-rust bg-rust/[0.06] px-4 py-3 font-serif text-sm text-ink-soft"
            >
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-linen-dim" />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
            New to Cookbook?
          </span>
          <div className="flex-1 h-px bg-linen-dim" />
        </div>

        <div className="w-full flex flex-col items-center gap-3">
          <Link href="/demo" className={buttonClass("secondary", "w-full")}>
            See How It Works
          </Link>
          <Link href="/signup" className={buttonClass("ghost")}>
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
