import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  try {
    const INVITE_CODE = process.env.INVITE_CODE;
    if (!INVITE_CODE) {
      return NextResponse.json(
        { error: "Signup is not configured. Contact the admin." },
        { status: 503 }
      );
    }

    const { email, password, inviteCode } = await req.json();

    if (!inviteCode || !safeCompare(inviteCode, INVITE_CODE)) {
      return NextResponse.json(
        { error: "Invalid invite code. Ask a family member for the code." },
        { status: 403 }
      );
    }

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email and password (min 6 chars) are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Signup error:", error.message);
      const safeMessage = error.message.includes("already registered")
        ? "An account with this email already exists"
        : "Could not create account. Please try again.";
      return NextResponse.json({ error: safeMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
