import { NextResponse } from "next/server";
import { createUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const result = await createUser({ name, email, password });
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || "Failed to create account" }, { status: 400 });
    }

    // Automatically log in the user upon sign up
    await setSessionCookie(result.user.id);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: result.user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
