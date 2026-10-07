import { NextResponse } from "next/server";
import { getCurrentUser, getAllUsers } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgName = (db.prepare("SELECT value FROM system_settings WHERE key = 'org_name'").get() as any)?.value || "Acme Core Ventures";
    const defaultCurrency = (db.prepare("SELECT value FROM system_settings WHERE key = 'default_currency'").get() as any)?.value || "USD";
    const masterRecoveryKey = (db.prepare("SELECT value FROM system_settings WHERE key = 'master_recovery_key'").get() as any)?.value || "MASTER-RESTORE-KEY";

    const partners = getAllUsers();

    return NextResponse.json({
      orgName,
      defaultCurrency,
      masterRecoveryKey,
      partners,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orgName, defaultCurrency, partners } = body;

    if (orgName) {
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('org_name', ?)").run(orgName.trim());
    }
    if (defaultCurrency) {
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('default_currency', ?)").run(defaultCurrency);
    }

    if (Array.isArray(partners)) {
      partners.forEach((p: any) => {
        if (p.id && p.display_name) {
          db.prepare("UPDATE users SET display_name = ?, avatar_color = ? WHERE id = ?").run(
            p.display_name.trim(),
            p.avatar_color || "#3b82f6",
            p.id
          );
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
