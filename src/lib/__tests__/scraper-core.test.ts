import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BlockedSiteError,
  DuplicateRecipeError,
  scrapeRecipe,
} from "../scraper/core";

// Minimal fake Supabase client. Returns a chainable thenable that resolves to
// `{ data, error }` so the scraper's various awaited queries work uniformly.
function makeSupabase(responses: {
  recipesSelect?: { data: unknown[]; error: null };
  recipesInsert?: { data: unknown; error: null | { message: string } };
  ingredientsInsert?: { error: null | { message: string } };
}) {
  type Row = Record<string, unknown>;
  const insertedRows: { table: string; rows: Row[] }[] = [];
  const queries: { table: string; filters: Row[] }[] = [];

  function makeBuilder(table: string, response: unknown) {
    const filters: Row[] = [];
    queries.push({ table, filters });
    const builder = {
      select: () => builder,
      eq: (k: string, v: unknown) => {
        filters.push({ [k]: v });
        return builder;
      },
      limit: () => builder,
      single: async () => response,
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(response).then(resolve),
    };
    return builder;
  }

  return {
    from(table: string) {
      return {
        select: () =>
          makeBuilder(
            table,
            responses.recipesSelect ?? { data: [], error: null },
          ),
        insert: (rows: Row | Row[]) => {
          insertedRows.push({
            table,
            rows: Array.isArray(rows) ? rows : [rows],
          });
          if (table === "recipes") {
            return makeBuilder(
              table,
              responses.recipesInsert ?? {
                data: { id: "recipe-id", slug: "test" },
                error: null,
              },
            );
          }
          if (table === "ingredients") {
            const r = responses.ingredientsInsert ?? { error: null };
            return Promise.resolve(r);
          }
          return Promise.resolve({ error: null });
        },
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    },
    _insertedRows: insertedRows,
    _queries: queries,
  };
}

function makeAnthropic(jsonText: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: jsonText }],
      }),
    },
  };
}

const SAMPLE_HTML = `<!DOCTYPE html><html><head><title>Test</title>
<script type="application/ld+json">${JSON.stringify({
  "@type": "Recipe",
  name: "Test Goulash",
  image: "https://example.com/goulash.jpg",
})}</script></head><body><p>Goulash recipe text here.</p></body></html>`;

const SAMPLE_RECIPE_JSON = JSON.stringify({
  name: "Test Goulash",
  preparation: "1. Brown beef. 2. Simmer.",
  servings: 4,
  cookTime: 30,
  prepTime: 10,
  cuisineTag: "American",
  dietaryTags: [],
  ingredients: [
    {
      name: "ground beef",
      quantity: 1,
      unit: "lb",
      category: "Meat",
      calories: 1152,
      protein_g: 77,
      carbs_g: 0,
      fat_g: 92,
    },
    {
      name: "onion",
      quantity: 1,
      unit: "each",
      category: "Produce",
      calories: 44,
      protein_g: 1,
      carbs_g: 10,
      fat_g: 0,
    },
  ],
});

describe("scrapeRecipe", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () => new Response(SAMPLE_HTML, { status: 200 }),
    ) as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("scrapes a URL end-to-end with mocked deps", async () => {
    const supabase = makeSupabase({});
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);

    const result = await scrapeRecipe(
      { kind: "url", url: "https://example.com/goulash" },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: supabase as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anthropic: anthropic as any,
        cloudinary: null,
      },
    );

    expect(result.name).toBe("Test Goulash");
    expect(result.ingredientCount).toBe(2);
    expect(result.cuisineTag).toBe("American");
    expect(result.servings).toBe(4);
    expect(result.ctx.method).toBe("direct");
    expect(result.ctx.contentFormat).toBe("json-ld");

    const recipeInsert = supabase._insertedRows.find(
      (r) => r.table === "recipes",
    );
    const ingInsert = supabase._insertedRows.find(
      (r) => r.table === "ingredients",
    );
    expect(recipeInsert?.rows[0]).toMatchObject({
      slug: "test-goulash",
      name: "Test Goulash",
      cuisine_tag: "American",
    });
    expect(ingInsert?.rows).toHaveLength(2);
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
  });

  it("scrapes pasted text without fetching", async () => {
    const supabase = makeSupabase({});
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof globalThis.fetch;

    const result = await scrapeRecipe(
      {
        kind: "text",
        text: "Pasted recipe content here, plenty of detail to extract a recipe.",
        sourceUrl: "manual entry",
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: supabase as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anthropic: anthropic as any,
        cloudinary: null,
      },
    );

    expect(result.ctx.method).toBe("text-paste");
    expect(result.ctx.contentFormat).toBe("user-pasted");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws BlockedSiteError when direct fetch returns 403 and no ScrapingBee key", async () => {
    const supabase = makeSupabase({});
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);
    globalThis.fetch = vi.fn(
      async () => new Response("", { status: 403 }),
    ) as typeof globalThis.fetch;

    await expect(
      scrapeRecipe(
        { kind: "url", url: "https://blocked.example/foo" },
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase: supabase as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          anthropic: anthropic as any,
          cloudinary: null,
        },
      ),
    ).rejects.toBeInstanceOf(BlockedSiteError);
  });

  it("persists source image_url when Cloudinary env is not configured", async () => {
    const supabase = makeSupabase({});
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);

    const result = await scrapeRecipe(
      { kind: "url", url: "https://example.com/goulash" },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: supabase as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anthropic: anthropic as any,
        cloudinary: null,
      },
    );

    expect(result.imageUrl).toBe("https://example.com/goulash.jpg");
    const recipeInsert = supabase._insertedRows.find(
      (r) => r.table === "recipes",
    );
    expect(recipeInsert?.rows[0]).toMatchObject({
      image_url: "https://example.com/goulash.jpg",
    });
  });

  it("persists Cloudinary URL when upload succeeds", async () => {
    const supabase = makeSupabase({});
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);

    const baseFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("api.cloudinary.com")) {
        return new Response(
          JSON.stringify({ secure_url: "https://res.cloudinary.com/x/y.jpg" }),
          { status: 200 },
        );
      }
      return baseFetch(input);
    }) as typeof globalThis.fetch;

    const result = await scrapeRecipe(
      { kind: "url", url: "https://example.com/goulash" },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: supabase as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anthropic: anthropic as any,
        cloudinary: {
          cloudName: "x",
          apiKey: "k",
          apiSecret: "s",
        },
      },
    );

    expect(result.imageUrl).toBe("https://res.cloudinary.com/x/y.jpg");
  });

  it("falls back to source image_url when Cloudinary upload returns null", async () => {
    const supabase = makeSupabase({});
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);

    const baseFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("api.cloudinary.com")) {
        return new Response("Internal error", { status: 500 });
      }
      return baseFetch(input);
    }) as typeof globalThis.fetch;

    const result = await scrapeRecipe(
      { kind: "url", url: "https://example.com/goulash" },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: supabase as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anthropic: anthropic as any,
        cloudinary: {
          cloudName: "x",
          apiKey: "k",
          apiSecret: "s",
        },
      },
    );

    expect(result.imageUrl).toBe("https://example.com/goulash.jpg");
  });

  it("throws DuplicateRecipeError on existing source_url", async () => {
    const supabase = makeSupabase({
      recipesSelect: {
        data: [{ id: "existing-id", name: "Old Goulash" }],
        error: null,
      },
    });
    const anthropic = makeAnthropic(SAMPLE_RECIPE_JSON);

    await expect(
      scrapeRecipe(
        { kind: "url", url: "https://example.com/goulash" },
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase: supabase as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          anthropic: anthropic as any,
          cloudinary: null,
        },
      ),
    ).rejects.toBeInstanceOf(DuplicateRecipeError);
  });
});
