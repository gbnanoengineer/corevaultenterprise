import { NextResponse } from "next/server";
import {
  getCurrentUser,
  inviteUserToOrganization,
  getActiveOrganization,
  getInvitationDetails,
  revokeOrganizationInvitation,
  generateAndSendOtp,
} from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const autoSend = url.searchParams.get("autoSend") === "true";

    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const details = getInvitationDetails(token);
    if (!details.valid) {
      return NextResponse.json({ error: details.error || "Invalid invitation token." }, { status: 404 });
    }

    let otpDispatched = false;
    let debugOtp: string | undefined = undefined;

    // If user does not yet exist and autoSend is requested, dispatch OTP immediately so user doesn't need to type anything
    if (autoSend && !details.userExists && details.email) {
      const otpRes = await generateAndSendOtp(details.email, "signup");
      otpDispatched = otpRes.success;
      debugOtp = otpRes.otp;
    }

    return NextResponse.json({
      valid: true,
      email: details.email,
      role: details.role,
      orgName: details.orgName,
      userExists: details.userExists,
      otpDispatched,
      debugOtp,
    });
  } catch (error) {
    console.error("Invite GET error:", error);
    return NextResponse.json({ error: "Failed to verify invitation." }, { status: 500 });
  }
}

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

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const queryId = url.searchParams.get("id");

    let invitationId = queryId;
    if (!invitationId) {
      try {
        const body = await req.json();
        invitationId = body?.invitationId || body?.id;
      } catch {
        // no body
      }
    }

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required." }, { status: 400 });
    }

    const result = revokeOrganizationInvitation(user.id, invitationId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to revoke invitation." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Invitation revoked successfully." });
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return NextResponse.json({ error: "Failed to revoke invitation." }, { status: 500 });
  }
}
