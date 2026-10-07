import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, authenticateWithPin, getAllUsers, signToken, COOKIE_NAME } from "@/lib/auth";
import { db, hashPin } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const partners = getAllUsers();
    const systemSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'org_name'").get() as { value: string } | undefined;
    const currencySetting = db.prepare("SELECT value FROM system_settings WHERE key = 'default_currency'").get() as { value: string } | undefined;

    return NextResponse.json({
      authenticated: !!user,
      user,
      partners,
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
    const { userId, pin } = body;

    if (!userId || !pin) {
      return NextResponse.json({ error: "Partner ID and 6-digit PIN are required" }, { status: 400 });
    }

    const user = authenticateWithPin(userId, pin);
    if (!user) {
      return NextResponse.json({ error: "Invalid PIN for this profile" }, { status: 401 });
    }

    const token = signToken({ userId: user.id });
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, recoveryKey, newPin, currentPin } = body;

    if (!userId || !newPin || newPin.length < 4) {
      return NextResponse.json({ error: "Valid partner ID and new PIN (4-6 digits) required" }, { status: 400 });
    }

    // Verify either current PIN or Master Recovery Key
    let authorized = false;
    if (recoveryKey) {
      const masterKey = db.prepare("SELECT value FROM system_settings WHERE key = 'master_recovery_key'").get() as { value: string } | undefined;
      if (masterKey && masterKey.value === recoveryKey.trim()) {
        authorized = true;
      }
    } else if (currentPin) {
      const user = authenticateWithPin(userId, currentPin);
      if (user) authorized = true;
    }

    if (!authorized) {
      return NextResponse.json({ error: "Invalid current PIN or Recovery Key" }, { status: 403 });
    }

    const newPinHash = hashPin(newPin);
    db.prepare("UPDATE users SET pin_hash = ? WHERE id = ?").run(newPinHash, userId);

    return NextResponse.json({ success: true, message: "PIN updated successfully" });
  } catch (error) {
    console.error("Auth PATCH error:", error);
    return NextResponse.json({ error: "PIN update failed" }, { status: 500 });
  }
}
