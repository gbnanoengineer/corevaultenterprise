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
    const { title, client_name, amount, currency, date, received_by_user_id, status, notes } = body;

    if (received_by_user_id) {
      const recipientMember = db.prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?").get(activeOrg.id, received_by_user_id);
      if (!recipientMember) {
        return NextResponse.json({ error: "The designated recipient is not a member of this organization." }, { status: 400 });
      }
    }

    const result = db.prepare(`
      UPDATE incomes
      SET title = ?, client_name = ?, amount = ?, currency = ?, date = ?,
          received_by_user_id = ?, status = ?, notes = ?
      WHERE id = ? AND organization_id = ?
    `).run(
      title,
      client_name,
      parseFloat(amount),
      currency || activeOrg.currency || "USD",
      date,
      received_by_user_id,
      status,
      notes,
      id,
      activeOrg.id
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "Income not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Incomes PUT error:", error);
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 });
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
    const result = db.prepare("DELETE FROM incomes WHERE id = ? AND organization_id = ?").run(id, activeOrg.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Income not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Incomes DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
  }
}
