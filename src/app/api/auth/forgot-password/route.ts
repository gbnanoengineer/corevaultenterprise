import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const result = await createPasswordResetToken(email);

    // If user exists, send email via Resend
    if (result) {
      const origin = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
      const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;
      const resetUrl = `${baseUrl}/?resetToken=${result.token}`;

      const emailResult = await sendPasswordResetEmail({
        email: result.user.email,
        name: result.user.display_name,
        resetToken: result.token,
        resetUrl,
      });

      return NextResponse.json({
        success: true,
        message: "A password reset link and token have been sent to your email address.",
        // If Resend returned error or in dev mode without domain verification, provide preview
        debugToken: process.env.NODE_ENV !== "production" ? result.token : undefined,
        emailDelivery: emailResult.success ? "sent" : "fallback",
      });
    }

    // Security practice: Return success even if email not registered to avoid enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process password reset request." }, { status: 500 });
  }
}
