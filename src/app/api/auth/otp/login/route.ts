import { NextResponse } from "next/server";
import { authenticateWithOtp, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const result = await authenticateWithOtp(email, otp);
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || "Login failed." }, { status: 400 });
    }

    await setSessionCookie(result.user.id);

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error("OTP login error:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
