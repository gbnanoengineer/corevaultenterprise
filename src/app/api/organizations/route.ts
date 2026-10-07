import { NextResponse } from "next/server";
import {
  getCurrentUser,
  getUserOrganizations,
  getActiveOrganization,
  createOrganization,
  getOrganizationMembers,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = getUserOrganizations(user.id);
    const activeOrg = getActiveOrganization(user.id);
    const members = activeOrg ? getOrganizationMembers(activeOrg.id) : [];

    return NextResponse.json({
      organizations,
      activeOrganization: activeOrg,
      members,
    });
  } catch (error) {
    console.error("Organizations GET error:", error);
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, currency = "USD" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
    }

    const { organization } = createOrganization(user.id, name.trim(), currency);

    return NextResponse.json({
      success: true,
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
