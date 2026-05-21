"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, BookHeart, Check, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  email: string;
  displayName: string;
  recipeCount: number;
}

export default function ProfileForm({
  email,
  displayName,
  recipeCount,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim().slice(0, 50) },
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (name || email.charAt(0)).charAt(0).toUpperCase();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Profile card */}
      <div className="bg-card border border-rule rounded-lg shadow-lift p-8 mb-8 text-center relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-40 h-40 bg-accent-soft/60 rounded-full blur-[60px] pointer-events-none"
          aria-hidden
        />

        <div className="relative mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-accent-on font-display text-[40px] leading-none shadow-lift">
            {initial}
          </div>
        </div>

        <h1 className="font-display text-[32px] text-ink mb-1 leading-tight">
          {name || email.split("@")[0]}
        </h1>
        <p className="font-sans text-sm text-ink-soft mb-6">{email}</p>

        <div className="flex gap-3 justify-center">
          <div className="px-4 py-2 bg-accent-soft border border-accent-soft rounded-pill font-sans text-[11px] font-semibold text-accent-ink uppercase tracking-[0.08em] inline-flex items-center gap-1.5">
            <BookHeart className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{recipeCount}</span>
            recipes
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-card border border-rule rounded shadow-lift-sm p-6 mb-6">
        <h2 className="font-sans text-sm font-semibold text-ink mb-6 flex items-center gap-2">
          <User className="w-4 h-4 text-accent" />
          Profile settings
        </h2>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-accent pl-1">
              Display name
            </label>
            <div className="flex gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                className="flex-1 h-12 px-4 rounded bg-paper border border-rule font-sans text-[15px] text-ink placeholder:text-ink-mute outline-none transition-colors hover:border-accent/30 focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || name === displayName}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-accent pl-1">
              Email address
            </label>
            <div className="flex items-center gap-3 h-12 px-4 rounded bg-paper border border-rule font-sans text-ink-soft">
              <Mail className="w-4 h-4 text-ink-mute" />
              {email}
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-card border border-rule rounded shadow-lift-sm p-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded font-sans text-sm font-semibold text-accent-ink hover:bg-accent-soft active:scale-[0.98] transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
