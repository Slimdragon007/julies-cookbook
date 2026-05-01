"use client";

import { useState } from "react";
import Link from "next/link";
import { BookHeart, Mail } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, InputLabel } from "@/components/ui/Input";

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
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linen text-brown mb-6">
          <BookHeart size={28} aria-hidden />
        </div>

        <h1 className="font-display font-semibold text-h1 sm:text-display-mobile text-ink text-center mb-3">
          Reset password
        </h1>
        <p className="font-serif text-base text-ink-soft leading-relaxed text-center max-w-[320px] mb-10">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>

        {sent ? (
          <div className="w-full flex flex-col items-center text-center animate-drift-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-linen text-leaf mb-5">
              <Mail size={24} aria-hidden />
            </div>
            <h2 className="font-display font-semibold text-h2 text-ink mb-3">
              Check your email
            </h2>
            <p className="font-serif text-base text-ink-soft leading-relaxed max-w-[320px]">
              If an account exists for {email}, a reset link is on its way. The
              link expires in 1 hour.
            </p>
          </div>
        ) : (
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

            {error && (
              <div
                role="alert"
                className="rounded border border-rust bg-rust/[0.06] px-4 py-3 font-serif text-sm text-ink-soft"
              >
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Send reset link
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="font-sans text-sm font-medium text-brown hover:text-brown-deep transition-colors mt-8"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
