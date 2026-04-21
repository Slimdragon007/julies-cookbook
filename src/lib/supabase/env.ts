// Centralized Supabase env var resolution.
// Vercel Marketplace provisions prefixed names (Juliescookbook_*);
// falls back to generic names for local dev or non-Marketplace setups.

function requireEnv(
  name: string,
  ...candidates: (string | undefined)[]
): string {
  const value = candidates.find((v) => v !== undefined && v !== "");
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const SUPABASE_URL = requireEnv(
  "SUPABASE_URL",
  process.env.NEXT_PUBLIC_Juliescookbook_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = requireEnv(
  "SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_Juliescookbook_SUPABASE_ANON_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// Server-side only. Never import in client components.
// Evaluated lazily (at request time) to avoid build-time failures when the
// secret is only available in the edge runtime, not in the Next.js build process.
export function getSupabaseServiceRoleKey(): string {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.Juliescookbook_SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
