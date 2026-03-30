// Centralized Supabase env var resolution.
// Vercel Marketplace provisions prefixed names (Juliescookbook_*);
// falls back to generic names for local dev or non-Marketplace setups.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_Juliescookbook_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_Juliescookbook_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.Juliescookbook_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
