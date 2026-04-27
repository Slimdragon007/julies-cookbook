import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Hoisted: replace the @supabase/supabase-js module before the route imports it.
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import { POST } from "../signup/route";

const VALID_INVITE = "secret-invite-code";

function makeRequest(body: unknown): NextRequest {
  const req = new Request("http://localhost/api/signup", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  // The route only calls req.json(); plain Request is structurally compatible.
  return req as unknown as NextRequest;
}

describe("POST /api/signup", () => {
  let createUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createUser = vi.fn();
    vi.mocked(createClient).mockReturnValue({
      auth: { admin: { createUser } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.stubEnv("INVITE_CODE", VALID_INVITE);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 503 when INVITE_CODE env var is unset", async () => {
    vi.stubEnv("INVITE_CODE", "");
    const res = await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: "anything",
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Signup is not configured. Contact the admin.",
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 403 when inviteCode is missing from body", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", password: "secret123" }),
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "Invalid invite code. Ask a family member for the code.",
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 403 when inviteCode does not match", async () => {
    const res = await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: "wrong-code",
      }),
    );
    expect(res.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 403 when inviteCode is the right length but wrong content (timing-safe compare)", async () => {
    // Same length as VALID_INVITE so we hit the HMAC compare, not the length short-circuit.
    const sameLengthDecoy = "x".repeat(VALID_INVITE.length);
    const res = await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: sameLengthDecoy,
      }),
    );
    expect(res.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(
      makeRequest({ password: "secret123", inviteCode: VALID_INVITE }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Email and password (min 6 chars) are required",
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", inviteCode: VALID_INVITE }),
    );
    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 400 when password is shorter than 6 characters", async () => {
    const res = await POST(
      makeRequest({
        email: "a@b.com",
        password: "12345",
        inviteCode: VALID_INVITE,
      }),
    );
    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("maps Supabase 'already registered' error to a safe user-facing message", async () => {
    createUser.mockResolvedValue({
      error: { message: "User already registered with this email" },
    });
    const res = await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: VALID_INVITE,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "An account with this email already exists",
    });
  });

  it("masks unexpected Supabase errors with a generic message", async () => {
    createUser.mockResolvedValue({
      error: {
        message:
          "Internal database error: connection pool exhausted at host db.example.com",
      },
    });
    const res = await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: VALID_INVITE,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Could not create account. Please try again.",
    });
  });

  it("creates a user and returns 200 on the happy path", async () => {
    createUser.mockResolvedValue({ error: null });
    const res = await POST(
      makeRequest({
        email: "julie@example.com",
        password: "verysecret",
        inviteCode: VALID_INVITE,
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(createUser).toHaveBeenCalledWith({
      email: "julie@example.com",
      password: "verysecret",
      email_confirm: true,
      user_metadata: { display_name: undefined },
    });
  });

  it("trims whitespace and clamps displayName to 50 characters", async () => {
    createUser.mockResolvedValue({ error: null });
    const padded = "   " + "x".repeat(80) + "   ";
    await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: VALID_INVITE,
        displayName: padded,
      }),
    );
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        user_metadata: { display_name: "x".repeat(50) },
      }),
    );
  });

  it("ignores non-string displayName values", async () => {
    createUser.mockResolvedValue({ error: null });
    await POST(
      makeRequest({
        email: "a@b.com",
        password: "secret123",
        inviteCode: VALID_INVITE,
        displayName: 12345,
      }),
    );
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        user_metadata: { display_name: undefined },
      }),
    );
  });

  it("returns 500 when the request body is not valid JSON", async () => {
    const res = await POST(makeRequest("this is not json"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Something went wrong. Please try again.",
    });
    expect(createUser).not.toHaveBeenCalled();
  });
});
