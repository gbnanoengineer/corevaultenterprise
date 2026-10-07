import { NextResponse } from "next/server";
import { getCurrentUser, inviteUserToOrganization, getActiveOrganization } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role = "member" } = body;
    let { organizationId } = body;

    if (!organizationId) {
      const activeOrg = getActiveOrganization(user.id);
      organizationId = activeOrg?.id;
    }

    if (!organizationId) {
      return NextResponse.json({ error: "No organization specified." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address to invite." }, { status: 400 });
    }

    const origin = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

    const result = await inviteUserToOrganization(user.id, organizationId, email, role, baseUrl);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send invitation." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation email sent to ${email} via Resend!`,
      token: result.token,
    });
  } catch (error) {
    console.error("Invite user error:", error);
    return NextResponse.json({ error: "Failed to send invitation." }, { status: 500 });
  }
}
