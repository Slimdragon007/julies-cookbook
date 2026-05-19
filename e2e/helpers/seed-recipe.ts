import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Test user identity must match e2e/helpers/auth.ts.
const TEST_USER_EMAIL = "e2e-test@julies-cookbook.test";

export interface SeededRecipe {
  id: string;
  slug: string;
  name: string;
  servings: number;
  ingredientCount: number;
  hasImage: boolean;
  cuisineTag: string;
  cleanup: () => Promise<void>;
}

let adminClient: SupabaseClient | undefined;
function getAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      "seedRecipe needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. " +
        "Put them in .env.local (repo root or parent) before running e2e tests.",
    );
  }
  adminClient = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

let cachedUserId: string | undefined;
async function getTestUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const admin = getAdmin();
  // Walk listUsers pages until we find the test account. The test user is the
  // only seeded e2e identity, so it's nearly always on page 1.
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email === TEST_USER_EMAIL);
    if (match) {
      cachedUserId = match.id;
      return match.id;
    }
    if (data.users.length < 200) break;
  }
  throw new Error(
    `Test user ${TEST_USER_EMAIL} not found in Supabase Auth. ` +
      "Create it (see e2e/helpers/auth.ts) before running e2e tests.",
  );
}

/**
 * Insert a fixture recipe owned by the e2e test user. Returns a cleanup
 * function that deletes the row (and cascade-deletes any ingredients).
 * Slug includes a random suffix so parallel/repeat runs don't collide on the
 * (user_id, slug) uniqueness pair.
 */
export async function seedRecipe(): Promise<SeededRecipe> {
  const admin = getAdmin();
  const userId = await getTestUserId();
  const suffix = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const fixture = {
    user_id: userId,
    slug: `e2e-mock-goulash-${suffix}`,
    name: `E2E Mock Goulash ${suffix}`,
    servings: 4,
    cook_time_minutes: 45,
    prep_time_minutes: 15,
    source_url: `https://cooking.nytimes.com/recipes/example-${suffix}`,
    cuisine_tag: "Hungarian",
    image_url:
      "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    preparation: "1. Brown the beef.\n2. Simmer with paprika.\n3. Serve.",
  };

  const { data, error } = await admin
    .from("recipes")
    .insert(fixture)
    .select("id, slug, name, servings, image_url, cuisine_tag")
    .single();

  if (error || !data) {
    throw new Error(`seedRecipe insert failed: ${error?.message ?? "no data"}`);
  }

  const id = data.id as string;
  return {
    id,
    slug: data.slug as string,
    name: data.name as string,
    servings: data.servings as number,
    ingredientCount: 0,
    hasImage: !!data.image_url,
    cuisineTag: (data.cuisine_tag as string) ?? "Hungarian",
    cleanup: async () => {
      const { error: delErr } = await admin
        .from("recipes")
        .delete()
        .eq("id", id);
      if (delErr) {
        // Tests shouldn't fail because of cleanup, but surface it so leaked
        // fixtures are visible.
        console.warn(
          `[seedRecipe] cleanup failed for ${id}: ${delErr.message}`,
        );
      }
    },
  };
}
