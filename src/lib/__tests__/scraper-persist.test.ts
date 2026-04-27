import { describe, expect, it } from "vitest";
import { DuplicateRecipeError, persistRecipe } from "../scraper/persist";
import type { NormalizedRecipe } from "../scraper/extract";

// Minimal fake Supabase client tailored to persistRecipe's call patterns:
// `from(table).select(...).eq(...).limit(...)` then awaited (dup check), and
// `from(table).insert(row).select(...).single()` (insert path). Tracks every
// inserted row so tests can assert what was actually written.
function makeSupabase(opts: {
  dupRecipes?: Array<{ id: string; name: string }>;
  insertError?: { code: string; message: string } | null;
  insertedRow?: { id: string; slug: string };
}) {
  const insertedRows: Array<{ table: string; row: Record<string, unknown> }> =
    [];

  function selectChain(data: unknown) {
    // Chainable builder: every method returns `builder` so `.select().eq().limit().eq()`
    // works in any order. The terminal await goes through `.then`, mirroring how
    // the real PostgREST client behaves.
    const builder: Record<string, unknown> = {};
    builder.select = () => builder;
    builder.eq = () => builder;
    builder.limit = () => builder;
    builder.single = async () => ({ data, error: null });
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve);
    return builder;
  }

  return {
    _insertedRows: insertedRows,
    from(table: string) {
      return {
        select: () => selectChain(opts.dupRecipes ?? []),
        insert: (row: Record<string, unknown>) => {
          insertedRows.push({ table, row });
          if (table === "recipes") {
            return {
              select: () => ({
                single: async () =>
                  opts.insertError
                    ? { data: null, error: opts.insertError }
                    : {
                        data: opts.insertedRow ?? {
                          id: "new-id",
                          slug: "test-recipe",
                        },
                        error: null,
                      },
              }),
            };
          }
          if (table === "ingredients") {
            return Promise.resolve({ error: null });
          }
          return Promise.resolve({ error: null });
        },
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    },
  };
}

const SAMPLE_RECIPE: NormalizedRecipe = {
  name: "Test Recipe",
  preparation: "1. Cook.",
  servings: 4,
  cookTime: 30,
  prepTime: 10,
  cuisineTag: "American",
  dietaryTags: [],
  ingredients: [],
};

describe("persistRecipe", () => {
  it("converts a 23505 (unique_violation) on insert into DuplicateRecipeError — the TOCTOU concurrent-write path", async () => {
    // Simulates: two concurrent scrapes, both pass the dup check (no rows
    // returned by the SELECT), the first insert wins, the second insert
    // fails with Postgres' unique_violation. The DB constraint added by
    // migration 20260427120000_recipe_uniqueness.sql is what makes this
    // possible in production.
    const supabase = makeSupabase({
      dupRecipes: [],
      insertError: {
        code: "23505",
        message:
          'duplicate key value violates unique constraint "recipes_user_source_url_uniq"',
      },
    });

    await expect(
      persistRecipe(SAMPLE_RECIPE, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: supabase as any,
        userScope: { userId: "u1" },
        sourceUrl: "https://example.com/recipe",
      }),
    ).rejects.toBeInstanceOf(DuplicateRecipeError);
  });

  it('persists "manual entry" sourceUrl as NULL so the partial UNIQUE index does not treat every text-paste recipe as a self-collision', async () => {
    const supabase = makeSupabase({});

    await persistRecipe(SAMPLE_RECIPE, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      userScope: { userId: "u1" },
      sourceUrl: "manual entry",
    });

    const inserted = supabase._insertedRows.find((r) => r.table === "recipes");
    expect(inserted).toBeDefined();
    expect(inserted!.row.source_url).toBeNull();
  });

  it("persists real source URLs unchanged", async () => {
    const supabase = makeSupabase({});

    await persistRecipe(SAMPLE_RECIPE, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      userScope: { userId: "u1" },
      sourceUrl: "https://example.com/recipe",
    });

    const inserted = supabase._insertedRows.find((r) => r.table === "recipes");
    expect(inserted!.row.source_url).toBe("https://example.com/recipe");
  });
});
