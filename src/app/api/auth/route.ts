import { NextResponse } from "next/server";
import { getCurrentUser, authenticateWithPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const systemSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'org_name'").get() as { value: string } | undefined;
    const currencySetting = db.prepare("SELECT value FROM system_settings WHERE key = 'default_currency'").get() as { value: string } | undefined;

    return NextResponse.json({
      authenticated: !!user,
      user,
      orgName: systemSetting?.value || "Acme Core Ventures",
      currency: currencySetting?.value || "USD",
    });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await authenticateWithPassword(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSessionCookie(user.id);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Auth Login POST error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
