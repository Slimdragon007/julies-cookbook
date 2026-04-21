import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, getSupabaseServiceRoleKey } from "./env";

// Lazily-initialized singleton — evaluated on first request, not at module load.
// This prevents next build from throwing when SUPABASE_SERVICE_ROLE_KEY is only
// available in the edge runtime, not during next build's module evaluation phase.
let _client: SupabaseClient | undefined;

function getAdminClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, getSupabaseServiceRoleKey());
  }
  return _client;
}

// Proxy maintains the same `supabase` export name so all callers are unchanged.
// Using SupabaseClient (not ReturnType<typeof createClient>) preserves the
// generic types that .from() and other methods rely on for type inference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> = new Proxy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as SupabaseClient<any>,
  {
    get(_, prop, receiver) {
      const client = getAdminClient();
      const val = Reflect.get(client, prop, receiver);
      return typeof val === "function" ? val.bind(client) : val;
    },
  },
);
