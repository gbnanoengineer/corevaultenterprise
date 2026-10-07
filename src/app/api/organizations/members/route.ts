import { NextResponse } from "next/server";
import { getCurrentUser, getActiveOrganization, removeOrganizationMember } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    let organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      const activeOrg = getActiveOrganization(user.id);
      organizationId = activeOrg?.id || null;
    }

    if (!organizationId || !userId) {
      return NextResponse.json({ error: "User ID and Organization ID are required." }, { status: 400 });
    }

    const result = removeOrganizationMember(user.id, organizationId, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to remove member." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Member removed from organization." });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member." }, { status: 500 });
  }
}
