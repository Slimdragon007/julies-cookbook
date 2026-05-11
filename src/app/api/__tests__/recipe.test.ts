import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Hoisted module mocks. The route imports the `supabase` admin client and
// `createSupabaseServer` directly; we replace them at the module boundary so
// the route's chain-builder calls land on our fakes.
vi.mock("@/lib/supabase/admin", () => ({
  supabase: { from: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { supabase } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PATCH, DELETE } from "../recipe/route";

function makeRequest(body: unknown, method: "PATCH" | "DELETE" = "PATCH"): NextRequest {
  const req = new Request("http://localhost/api/recipe", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return req as unknown as NextRequest;
}

function mockAuthedUser(userId: string | null) {
  vi.mocked(createSupabaseServer).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

/**
 * Chainable Supabase mock. Records every `from(table)`, `.eq(col, val)`, and
 * payload passed to `.update()` / `.insert()` so tests can assert ownership
 * filters and update payloads. Terminal `.single()` and the awaited builder
 * itself resolve to whatever the test seeded via the `responses` map.
 */
type Response = { data?: unknown; error?: unknown };
type Seed = {
  // Keyed by call order within a table (0 = first call against that table)
  [table: string]: Response[];
};

interface FromCall {
  table: string;
  eqs: Array<[string, unknown]>;
  updatePayload?: Record<string, unknown>;
  insertPayload?: Record<string, unknown>;
  deleted?: boolean;
}

function makeSupabase(seed: Seed) {
  const calls: FromCall[] = [];
  const counters: Record<string, number> = {};

  function nextResponse(table: string): Response {
    const i = counters[table] ?? 0;
    counters[table] = i + 1;
    return seed[table]?.[i] ?? { data: null, error: null };
  }

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    const call: FromCall = { table, eqs: [] };
    calls.push(call);

    const builder: Record<string, unknown> = {};
    builder.select = () => builder;
    builder.eq = (col: string, val: unknown) => {
      call.eqs.push([col, val]);
      return builder;
    };
    builder.single = async () => nextResponse(table);
    builder.update = (payload: Record<string, unknown>) => {
      call.updatePayload = payload;
      return builder;
    };
    builder.insert = (payload: Record<string, unknown>) => {
      call.insertPayload = payload;
      return builder;
    };
    builder.delete = () => {
      call.deleted = true;
      return builder;
    };
    // Awaiting the builder (e.g. for update/delete without .single()) drains
    // the next seeded response for this table.
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(nextResponse(table)).then(resolve);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return builder as any;
  });

  return { calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PATCH /api/recipe", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuthedUser(null);
    makeSupabase({});
    const res = await PATCH(makeRequest({ id: "r1", name: "x" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when the recipe id is missing", async () => {
    mockAuthedUser("user-1");
    makeSupabase({});
    const res = await PATCH(makeRequest({ name: "x" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Recipe ID required" });
  });

  it("returns 400 when no updatable fields are provided", async () => {
    mockAuthedUser("user-1");
    makeSupabase({});
    const res = await PATCH(makeRequest({ id: "r1", unknownField: "x" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No fields to update" });
  });

  it("returns 404 when the recipe does not belong to the user", async () => {
    mockAuthedUser("user-1");
    // Ownership check returns no row — simulates either a missing recipe or
    // one owned by another user (the RLS-equivalent guard at the app layer).
    makeSupabase({
      recipes: [{ data: null, error: null }],
    });
    const res = await PATCH(makeRequest({ id: "r1", name: "new" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Recipe not found" });
  });

  it("scopes the ownership check to the caller's user_id", async () => {
    mockAuthedUser("user-1");
    // Seed: ownership check finds the row, update succeeds.
    const { calls } = makeSupabase({
      recipes: [
        { data: { id: "r1" }, error: null }, // ownership SELECT
        { data: null, error: null }, // UPDATE
      ],
    });

    await PATCH(makeRequest({ id: "r1", name: "new" }));

    // Both the SELECT and the UPDATE must be filtered by user_id, otherwise
    // a malicious actor could PATCH another user's recipe by guessing the id.
    const recipeCalls = calls.filter((c) => c.table === "recipes");
    expect(recipeCalls).toHaveLength(2);
    for (const call of recipeCalls) {
      expect(call.eqs).toContainEqual(["user_id", "user-1"]);
    }
  });

  it("maps camelCase API fields to snake_case DB columns", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({
      recipes: [
        { data: { id: "r1" }, error: null },
        { data: null, error: null },
      ],
    });

    await PATCH(
      makeRequest({
        id: "r1",
        name: "Best Goulash",
        servings: 6,
        prepTime: 20,
        cookTime: 90,
        cuisineTag: "Hungarian",
        dietaryTags: ["comfort food"],
      }),
    );

    const updateCall = calls.find((c) => c.updatePayload);
    expect(updateCall?.updatePayload).toEqual({
      name: "Best Goulash",
      servings: 6,
      prep_time_minutes: 20,
      cook_time_minutes: 90,
      cuisine_tag: "Hungarian",
      dietary_tags: ["comfort food"],
    });
  });

  it("returns 500 when the UPDATE itself fails", async () => {
    mockAuthedUser("user-1");
    makeSupabase({
      recipes: [
        { data: { id: "r1" }, error: null }, // ownership pass
        { data: null, error: { message: "constraint violation" } }, // UPDATE fail
      ],
    });
    const res = await PATCH(makeRequest({ id: "r1", name: "x" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "constraint violation" });
  });
});

describe("DELETE /api/recipe", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuthedUser(null);
    makeSupabase({});
    const res = await DELETE(makeRequest({ id: "r1" }, "DELETE"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when the recipe id is missing", async () => {
    mockAuthedUser("user-1");
    makeSupabase({});
    const res = await DELETE(makeRequest({}, "DELETE"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Recipe ID required" });
  });

  it("returns 404 when the recipe does not belong to the user", async () => {
    mockAuthedUser("user-1");
    makeSupabase({ recipes: [{ data: null, error: null }] });
    const res = await DELETE(makeRequest({ id: "r1" }, "DELETE"));
    expect(res.status).toBe(404);
  });

  it("deletes related rows before the recipe row (food_log + ingredients first)", async () => {
    // Orphaned food_log entries would point at a missing recipe; orphaned
    // ingredients would survive a hard delete if rows referenced the recipe.
    // Both must be removed before the recipe itself.
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({
      recipes: [
        { data: { id: "r1" }, error: null }, // ownership SELECT
        { data: null, error: null }, // recipe DELETE
      ],
      food_log: [{ data: null, error: null }],
      ingredients: [{ data: null, error: null }],
    });

    const res = await DELETE(makeRequest({ id: "r1" }, "DELETE"));
    expect(res.status).toBe(200);

    const order = calls.map((c) => c.table);
    const foodLogIdx = order.indexOf("food_log");
    const ingredientsIdx = order.indexOf("ingredients");
    const recipeDeleteIdx = order.lastIndexOf("recipes");
    expect(foodLogIdx).toBeGreaterThan(-1);
    expect(ingredientsIdx).toBeGreaterThan(-1);
    expect(foodLogIdx).toBeLessThan(recipeDeleteIdx);
    expect(ingredientsIdx).toBeLessThan(recipeDeleteIdx);
  });

  it("returns 500 when the final recipe DELETE fails", async () => {
    mockAuthedUser("user-1");
    makeSupabase({
      recipes: [
        { data: { id: "r1" }, error: null },
        { data: null, error: { message: "db offline" } },
      ],
      food_log: [{ data: null, error: null }],
      ingredients: [{ data: null, error: null }],
    });
    const res = await DELETE(makeRequest({ id: "r1" }, "DELETE"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db offline" });
  });
});
