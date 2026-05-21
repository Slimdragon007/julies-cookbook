import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { Preferences } from "@/lib/preferences-contract";

export async function setPreferences(
  userId: string,
  partial: Partial<Preferences>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, ...partial });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
