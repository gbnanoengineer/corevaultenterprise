import { NextResponse } from "next/server";
import { verifyResetToken, resetPasswordWithToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Missing reset token" }, { status: 400 });
    }

    const verification = verifyResetToken(token);
    if (!verification.valid || !verification.user) {
      return NextResponse.json({ valid: false, error: verification.error || "Invalid or expired token" });
    }

    return NextResponse.json({
      valid: true,
      email: verification.user.email,
      name: verification.user.display_name,
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    return NextResponse.json({ valid: false, error: "Failed to verify token" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Reset token and new password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const result = await resetPasswordWithToken(token, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to reset password" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
