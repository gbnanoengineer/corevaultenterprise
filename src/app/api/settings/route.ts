import { NextResponse } from "next/server";
import { getActiveOrgContext, getOrganizationMembers } from "@/lib/auth";
import { db } from "@/lib/db";
import { isS3Configured, S3_BUCKET_NAME } from "@/lib/s3";

export async function GET() {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const partners = getOrganizationMembers(activeOrg.id);

    return NextResponse.json({
      orgName: activeOrg.name,
      defaultCurrency: activeOrg.currency || "USD",
      organizationId: activeOrg.id,
      role: activeOrg.role,
      partners,
      storage: {
        isS3Configured,
        bucketName: isS3Configured ? S3_BUCKET_NAME : "Local Storage Volume (./data/uploads)",
        compressionEngine: "Sharp WebP Engine (Active)",
        onDeleteCleanup: "Enabled (Automatic S3 & Disk Purge)",
        fileExpiryEngine: "Active (Auto-purge on expiration)",
      },
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg, isOwner, isAdmin } = context;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Only organization owners and admins can modify organization settings." }, { status: 403 });
    }

    const body = await req.json();
    const { orgName, defaultCurrency } = body;

    if (orgName) {
      db.prepare("UPDATE organizations SET name = ? WHERE id = ?").run(orgName.trim(), activeOrg.id);
    }
    if (defaultCurrency) {
      db.prepare("UPDATE organizations SET currency = ? WHERE id = ?").run(defaultCurrency, activeOrg.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
