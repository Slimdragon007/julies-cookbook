"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, BookHeart, Check, Loader2, LogOut } from "lucide-react";

interface Props {
  email: string;
  displayName: string;
  recipeCount: number;
}

export default function ProfileForm({ email, displayName, recipeCount }: Props) {
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
    <div>
      {/* Profile card */}
      <div className="glass-strong rounded-[2.5rem] p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-200/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-600 to-amber-700 p-1.5 shadow-lg">
            <div className="w-full h-full rounded-[1.75rem] bg-white flex items-center justify-center text-amber-600 text-3xl font-black">
              {initial}
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          {name || email.split("@")[0]}
        </h1>
        <p className="text-slate-500 text-sm font-medium mb-6">{email}</p>

        <div className="flex gap-3 justify-center">
          <div className="px-4 py-2 bg-amber-50 rounded-xl text-[11px] font-bold text-amber-700 uppercase border border-amber-200">
            <BookHeart className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            {recipeCount} Recipes
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="glass rounded-[2rem] p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-600" />
          Profile Settings
        </h2>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Display Name
            </label>
            <div className="flex gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                className="flex-1 h-12 px-4 rounded-xl glass-input text-slate-800 font-bold placeholder:text-slate-300"
              />
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || name === displayName}
                className="px-5 h-12 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Email Address
            </label>
            <div className="flex items-center gap-3 h-12 px-4 rounded-xl glass text-slate-500 font-medium">
              <Mail className="w-4 h-4 text-slate-400" />
              {email}
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="glass rounded-[2rem] p-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-500 font-bold hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
