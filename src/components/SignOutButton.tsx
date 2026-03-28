"use client";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      aria-label="Sign out"
      className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-3.5 rounded-xl lg:rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all lg:w-full group"
    >
      <LogOut className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 group-hover:scale-110 transition-transform" />
      <span className="hidden xl:block text-[14px] font-semibold">Sign Out</span>
    </button>
  );
}
