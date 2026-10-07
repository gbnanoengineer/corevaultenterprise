import { NextResponse } from "next/server";
import { completeOtpSignup, setSessionCookie, getUserOrganizations } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, otp, inviteToken } = body;

    if (!name || !email || !password || !otp) {
      return NextResponse.json(
        { error: "Name, email, password, and verification code are required." },
        { status: 400 }
      );
    }

    const result = await completeOtpSignup({ name, email, password, otp, inviteToken });
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || "Failed to create account." }, { status: 400 });
    }

    // Automatically log in the user upon sign up
    await setSessionCookie(result.user.id);

    const userOrgs = getUserOrganizations(result.user.id);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: result.user,
      // If user joined via invite, they already have an org; if not, prompt them to create an organization
      needsOrgCreation: userOrgs.length === 0,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
