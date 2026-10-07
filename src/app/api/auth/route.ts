import { NextResponse } from "next/server";
import {
  getCurrentUser,
  authenticateWithPassword,
  setSessionCookie,
  clearSessionCookie,
  getUserOrganizations,
  getActiveOrganization,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        organizations: [],
        activeOrganization: null,
      });
    }

    const organizations = getUserOrganizations(user.id);
    const activeOrganization = getActiveOrganization(user.id);

    return NextResponse.json({
      authenticated: true,
      user,
      organizations,
      activeOrganization,
      orgName: activeOrganization?.name || "My Organization",
      currency: activeOrganization?.currency || "USD",
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

    const authResult = await authenticateWithPassword(email, password);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || "Invalid email or password" }, { status: 401 });
    }
    const user = authResult.user;

    await setSessionCookie(user.id);

    const organizations = getUserOrganizations(user.id);
    const activeOrganization = getActiveOrganization(user.id);

    return NextResponse.json({
      success: true,
      user,
      organizations,
      activeOrganization,
      needsOrgCreation: organizations.length === 0,
    });
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
