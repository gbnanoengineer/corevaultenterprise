import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const { id } = await params;
    const body = await req.json();
    const { name, category, cost, currency, billing_cycle, next_renewal_date, payment_method, auto_renew, active, notes, url } = body;

    const result = db.prepare(`
      UPDATE subscriptions
      SET name = ?, category = ?, cost = ?, currency = ?, billing_cycle = ?,
          next_renewal_date = ?, payment_method = ?, auto_renew = ?, active = ?, notes = ?, url = ?
      WHERE id = ? AND organization_id = ?
    `).run(
      name,
      category,
      parseFloat(cost),
      currency || activeOrg.currency || "USD",
      billing_cycle,
      next_renewal_date,
      payment_method,
      auto_renew ? 1 : 0,
      active ? 1 : 0,
      notes,
      url,
      id,
      activeOrg.id
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "Subscription not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscriptions PUT error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const { id } = await params;
    const result = db.prepare("DELETE FROM subscriptions WHERE id = ? AND organization_id = ?").run(id, activeOrg.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Subscription not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscriptions DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
