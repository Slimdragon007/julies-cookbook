"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { BookHeart, ArrowRight, Lock, Loader2 } from "lucide-react";

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
    // The browser client auto-parses the recovery token from the URL hash on
    // mount (detectSessionInUrl: true). Wait for the PASSWORD_RECOVERY event
    // or check the existing session — whichever resolves first.
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
            Set new password
          </h1>
          <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            Choose a password you&apos;ll remember.
          </p>
        </div>

        <div className="w-full glass-strong p-8 sm:p-10 rounded-[3rem] relative overflow-hidden">
          {hasRecoverySession === false ? (
            <div className="relative z-10 text-center space-y-4">
              <h2 className="text-xl font-black text-slate-800">
                Link expired or invalid
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Request a new password reset link.
              </p>
              <Link
                href="/auth/reset"
                className="inline-block mt-2 text-[13px] font-bold text-amber-700 hover:underline"
              >
                Request new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="space-y-2">
                <label
                  className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1"
                  htmlFor="password"
                >
                  <Lock className="w-3 h-3" />
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-14 px-6 rounded-2xl glass-input text-slate-800 text-[15px] font-bold placeholder:text-slate-300 shadow-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label
                  className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1"
                  htmlFor="confirm"
                >
                  <Lock className="w-3 h-3" />
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
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
                disabled={loading || hasRecoverySession === null}
                className="w-full h-16 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-[1.75rem] font-bold text-[16px] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_12px_24px_rgba(196,149,46,0.3)] hover:shadow-[0_16px_32px_rgba(196,149,46,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Update password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
