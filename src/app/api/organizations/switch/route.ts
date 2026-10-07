import { NextResponse } from "next/server";
import { getCurrentUser, switchActiveOrganization } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const success = switchActiveOrganization(user.id, organizationId);
    if (!success) {
      return NextResponse.json({ error: "You are not a member of this organization." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Switch organization error:", error);
    return NextResponse.json({ error: "Failed to switch organization" }, { status: 500 });
  }
}
