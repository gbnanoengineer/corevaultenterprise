import { NextResponse } from "next/server";
import { generateAndSendOtp } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, purpose, name } = body;

    if (!email || !purpose) {
      return NextResponse.json({ error: "Email and purpose are required." }, { status: 400 });
    }

    if (!["signup", "login", "reset_password"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid purpose." }, { status: 400 });
    }

    const result = await generateAndSendOtp(email, purpose, name);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to dispatch verification code." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      debugOtp: process.env.NODE_ENV !== "production" ? result.otp : undefined,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}
