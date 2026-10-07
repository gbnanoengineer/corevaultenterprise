import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, purpose } = body;

    if (!email || !otp || !purpose) {
      return NextResponse.json({ error: "Email, code, and purpose are required." }, { status: 400 });
    }

    const result = verifyOtp(email, otp, purpose, false);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error || "Invalid code." }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify code." }, { status: 500 });
  }
}
