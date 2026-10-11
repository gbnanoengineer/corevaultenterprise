import { NextResponse } from "next/server";
import { checkEmailExists, generateAndSendOtp } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const exists = checkEmailExists(cleanEmail);

    // If new email (register), automatically send OTP to verify email right away!
    if (!exists) {
      await generateAndSendOtp(cleanEmail, "signup");
    }

    return NextResponse.json({
      success: true,
      exists,
      email: cleanEmail,
      otpSent: !exists,
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json({ error: "Failed to verify email address." }, { status: 500 });
  }
}
