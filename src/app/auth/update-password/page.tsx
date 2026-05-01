"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookHeart } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, InputLabel } from "@/components/ui/Input";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null,
  );
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        resolved = true;
        setHasRecoverySession(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (resolved) return;
      setHasRecoverySession(Boolean(data.session));
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (authError) {
      setError("Could not update password. The reset link may have expired.");
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

        <h1 className="font-display font-semibold text-h1 sm:text-display-mobile text-ink text-center mb-3">
          Set new password
        </h1>
        <p className="font-serif text-base text-ink-soft leading-relaxed text-center max-w-[320px] mb-10">
          Choose a password you&apos;ll remember.
        </p>

        {hasRecoverySession === false ? (
          <div className="w-full flex flex-col items-center text-center">
            <h2 className="font-display font-semibold text-h2 text-ink mb-3">
              Link expired or invalid
            </h2>
            <p className="font-serif text-base text-ink-soft leading-relaxed max-w-[320px] mb-6">
              Request a new password reset link.
            </p>
            <Link href="/auth/reset" className={buttonClass("secondary")}>
              Request new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="space-y-1.5">
              <InputLabel htmlFor="password">New password</InputLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <InputLabel htmlFor="confirm">Confirm password</InputLabel>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
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

            <Button
              type="submit"
              loading={loading}
              disabled={hasRecoverySession === null}
              className="w-full mt-2"
            >
              Update password
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
