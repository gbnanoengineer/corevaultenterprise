import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, category, cost, currency, billing_cycle, next_renewal_date, payment_method, auto_renew, active, notes, url } = body;

    db.prepare(`
      UPDATE subscriptions
      SET name = ?, category = ?, cost = ?, currency = ?, billing_cycle = ?,
          next_renewal_date = ?, payment_method = ?, auto_renew = ?, active = ?, notes = ?, url = ?
      WHERE id = ?
    `).run(
      name,
      category,
      parseFloat(cost),
      currency || "USD",
      billing_cycle,
      next_renewal_date,
      payment_method,
      auto_renew ? 1 : 0,
      active ? 1 : 0,
      notes,
      url,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscriptions PUT error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    db.prepare("DELETE FROM subscriptions WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscriptions DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
