import { NextResponse } from "next/server";
import { getCurrentUser, acceptOrganizationInvitation } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in or sign up first to accept this invitation." }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Invitation token is required." }, { status: 400 });
    }

    const result = acceptOrganizationInvitation(user.id, token);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to accept invitation." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `You have successfully joined ${result.organization?.name}!`,
      organization: result.organization,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Failed to accept invitation." }, { status: 500 });
  }
}
