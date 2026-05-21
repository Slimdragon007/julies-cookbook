// TASK-026 PR B: preferences data access for the tweaks panel.
//
// Server-side fetch reads from public.user_preferences (Supabase, RLS-scoped
// per-user via auth.uid() = user_id). If no row exists, returns the documented
// defaults; callers don't need to handle the null case.
//
// Client-side write upserts a row. Server-side write path is not exposed
// because the server only reads in the (main)/layout.tsx fetch.
//
// CHECK constraints in the migration enforce the value sets at the DB level;
// the Preferences union below is the TypeScript mirror.

import { createSupabaseServer } from "@/lib/supabase/server";
import {
  DEFAULT_PREFERENCES,
  IMAGERY_VALUES,
  PALETTE_VALUES,
  PAPER_VALUES,
  VOICE_VALUES,
  type Preferences,
} from "@/lib/preferences-contract";

export {
  DEFAULT_PREFERENCES,
  IMAGERY_VALUES,
  PALETTE_VALUES,
  PAPER_VALUES,
  VOICE_VALUES,
  type Imagery,
  type Palette,
  type Paper,
  type Preferences,
  type Voice,
} from "@/lib/preferences-contract";

function coerce<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

export async function getPreferences(userId: string): Promise<Preferences> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("voice, imagery, paper, palette")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_PREFERENCES;

  // Coerce in case stored values fall outside the current enum (e.g. a future
  // value was removed between writes). Defensive but cheap.
  return {
    voice: coerce(data.voice, VOICE_VALUES, DEFAULT_PREFERENCES.voice),
    imagery: coerce(data.imagery, IMAGERY_VALUES, DEFAULT_PREFERENCES.imagery),
    paper: coerce(data.paper, PAPER_VALUES, DEFAULT_PREFERENCES.paper),
    palette: coerce(data.palette, PALETTE_VALUES, DEFAULT_PREFERENCES.palette),
  };
}
