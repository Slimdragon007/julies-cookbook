export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Timing-safe string comparison using Web Crypto HMAC (edge-compatible).
// Signs both strings with the same random key and XOR-compares the 32-byte
// digests in a constant-time loop — equivalent to Node's timingSafeEqual.
async function safeCompare(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, enc.encode(a)),
    crypto.subtle.sign("HMAC", key, enc.encode(b)),
  ]);
  const aArr = new Uint8Array(sigA);
  const bArr = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < aArr.length; i++) diff |= aArr[i] ^ bArr[i];
  return diff === 0 && a.length === b.length;
}

export async function POST(req: NextRequest) {
  try {
    const INVITE_CODE = process.env.INVITE_CODE;
    if (!INVITE_CODE) {
      return NextResponse.json(
        { error: "Signup is not configured. Contact the admin." },
        { status: 503 },
      );
    }

    const { email, password, inviteCode, displayName } = await req.json();

    if (!inviteCode || !(await safeCompare(inviteCode, INVITE_CODE))) {
      return NextResponse.json(
        { error: "Invalid invite code. Ask a family member for the code." },
        { status: 403 },
      );
    }

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email and password (min 6 chars) are required" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name:
          typeof displayName === "string"
            ? displayName.trim().slice(0, 50)
            : undefined,
      },
    });

    if (error) {
      console.error("Signup error:", error.message);
      const safeMessage = error.message.includes("already registered")
        ? "An account with this email already exists"
        : "Could not create account. Please try again.";
      return NextResponse.json({ error: safeMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
