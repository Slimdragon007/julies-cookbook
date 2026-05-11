import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/supabase/admin", () => ({
  supabase: { from: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(),
}));

import { supabase } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { POST, GET } from "../log-meal/route";

function postRequest(body: unknown): NextRequest {
  const req = new Request("http://localhost/api/log-meal", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return req as unknown as NextRequest;
}

function getRequest(query: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost/api/log-meal");
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const req = new Request(url, { method: "GET" });
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

interface FromCall {
  table: string;
  eqs: Array<[string, unknown]>;
  gtes: Array<[string, unknown]>;
  ltes: Array<[string, unknown]>;
  orders: Array<[string, unknown]>;
  insertPayload?: Record<string, unknown>;
}

type Response = { data?: unknown; error?: unknown };

function makeSupabase(response: Response = { data: null, error: null }) {
  const calls: FromCall[] = [];

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    const call: FromCall = {
      table,
      eqs: [],
      gtes: [],
      ltes: [],
      orders: [],
    };
    calls.push(call);

    const builder: Record<string, unknown> = {};
    builder.select = () => builder;
    builder.insert = (payload: Record<string, unknown>) => {
      call.insertPayload = payload;
      return builder;
    };
    builder.eq = (col: string, val: unknown) => {
      call.eqs.push([col, val]);
      return builder;
    };
    builder.gte = (col: string, val: unknown) => {
      call.gtes.push([col, val]);
      return builder;
    };
    builder.lte = (col: string, val: unknown) => {
      call.ltes.push([col, val]);
      return builder;
    };
    builder.order = (col: string, opts: unknown) => {
      call.orders.push([col, opts]);
      return builder;
    };
    builder.single = async () => response;
    // Awaiting the builder (terminal in the GET path) resolves the response.
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(response).then(resolve);
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

describe("POST /api/log-meal", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuthedUser(null);
    makeSupabase();
    const res = await POST(
      postRequest({ recipe_id: "r1", meal: "lunch", portion_g: 100 }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when recipe_id is missing", async () => {
    mockAuthedUser("user-1");
    makeSupabase();
    const res = await POST(postRequest({ meal: "lunch", portion_g: 100 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "recipe_id, meal, and a portion are required",
    });
  });

  it("returns 400 when meal is missing", async () => {
    mockAuthedUser("user-1");
    makeSupabase();
    const res = await POST(postRequest({ recipe_id: "r1", portion_g: 100 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when both portion_g and portion_amount are missing", async () => {
    mockAuthedUser("user-1");
    makeSupabase();
    const res = await POST(postRequest({ recipe_id: "r1", meal: "lunch" }));
    expect(res.status).toBe(400);
  });

  it("accepts a portion_amount with no portion_g (unit-picker path)", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({
      data: { id: "entry-1" },
      error: null,
    });

    const res = await POST(
      postRequest({
        recipe_id: "r1",
        meal: "dinner",
        portion_amount: 1.5,
        portion_unit: "/cup",
        calories: 350,
        protein_g: 25,
        carbs_g: 40,
        fat_g: 10,
      }),
    );

    expect(res.status).toBe(200);
    const insert = calls.find((c) => c.insertPayload);
    expect(insert?.insertPayload).toMatchObject({
      user_id: "user-1",
      recipe_id: "r1",
      meal: "dinner",
      portion_g: 0, // default when only amount+unit supplied
      portion_amount: 1.5,
      portion_unit: "/cup",
      calories: 350,
      protein_g: 25,
      carbs_g: 40,
      fat_g: 10,
    });
  });

  it("defaults log_date to today (YYYY-MM-DD) when not provided", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({ data: { id: "entry-1" }, error: null });

    await POST(
      postRequest({ recipe_id: "r1", meal: "lunch", portion_g: 100 }),
    );

    const insert = calls.find((c) => c.insertPayload);
    const today = new Date().toISOString().split("T")[0];
    expect(insert?.insertPayload?.log_date).toBe(today);
  });

  it("preserves a caller-provided log_date and notes", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({ data: { id: "entry-1" }, error: null });

    await POST(
      postRequest({
        recipe_id: "r1",
        meal: "breakfast",
        portion_g: 200,
        log_date: "2026-01-15",
        notes: "extra cheese",
      }),
    );

    const insert = calls.find((c) => c.insertPayload);
    expect(insert?.insertPayload).toMatchObject({
      log_date: "2026-01-15",
      notes: "extra cheese",
    });
  });

  it("scopes the inserted row to the authenticated user_id", async () => {
    // Critical authz invariant: the route must never trust a client-supplied
    // user_id. Even if the request body included one, the insert payload
    // must reflect the session user.
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({ data: { id: "entry-1" }, error: null });

    await POST(
      postRequest({
        recipe_id: "r1",
        meal: "lunch",
        portion_g: 100,
        user_id: "attacker-id", // ignored
      }),
    );

    const insert = calls.find((c) => c.insertPayload);
    expect(insert?.insertPayload?.user_id).toBe("user-1");
  });

  it("returns 500 when the insert fails", async () => {
    mockAuthedUser("user-1");
    makeSupabase({ data: null, error: { message: "db offline" } });
    const res = await POST(
      postRequest({ recipe_id: "r1", meal: "lunch", portion_g: 100 }),
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db offline" });
  });
});

describe("GET /api/log-meal", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuthedUser(null);
    makeSupabase();
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it("defaults to a single-day window for today", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({ data: [], error: null });

    await GET(getRequest());

    const today = new Date().toISOString().split("T")[0];
    const call = calls[0];
    expect(call.eqs).toContainEqual(["user_id", "user-1"]);
    expect(call.gtes).toContainEqual(["log_date", today]);
    expect(call.ltes).toContainEqual(["log_date", today]);
  });

  it("widens the window when days is supplied (7-day rolling)", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({ data: [], error: null });

    await GET(getRequest({ date: "2026-05-10", days: "7" }));

    const call = calls[0];
    // days=7 ending on 2026-05-10 → start is 6 days earlier = 2026-05-04.
    expect(call.gtes).toContainEqual(["log_date", "2026-05-04"]);
    expect(call.ltes).toContainEqual(["log_date", "2026-05-10"]);
  });

  it("orders by log_date then created_at descending", async () => {
    mockAuthedUser("user-1");
    const { calls } = makeSupabase({ data: [], error: null });

    await GET(getRequest());

    const call = calls[0];
    expect(call.orders).toEqual([
      ["log_date", { ascending: false }],
      ["created_at", { ascending: false }],
    ]);
  });

  it("returns 500 when the query fails", async () => {
    mockAuthedUser("user-1");
    makeSupabase({ data: null, error: { message: "timeout" } });
    const res = await GET(getRequest());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "timeout" });
  });
});
