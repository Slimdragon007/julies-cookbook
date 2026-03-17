"use client";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
      className="font-body text-xs text-warm-light hover:text-warm-dark transition-colors"
    >
      Sign Out
    </button>
  );
}
