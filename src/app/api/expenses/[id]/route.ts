import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteAsset } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const { id } = await params;
    const body = await req.json();
    const { title, category, amount, currency, date, paid_by_user_id, payment_method, split_type, notes, status } = body;

    if (paid_by_user_id) {
      const payerMember = db.prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?").get(activeOrg.id, paid_by_user_id);
      if (!payerMember) {
        return NextResponse.json({ error: "The designated payer is not a member of this organization." }, { status: 400 });
      }
    }

    const result = db.prepare(`
      UPDATE expenses
      SET title = ?, category = ?, amount = ?, currency = ?, date = ?,
          paid_by_user_id = ?, payment_method = ?, split_type = ?, notes = ?, status = ?
      WHERE id = ? AND organization_id = ?
    `).run(
      title,
      category,
      parseFloat(amount),
      currency || activeOrg.currency || "USD",
      date,
      paid_by_user_id,
      payment_method,
      split_type,
      notes,
      status,
      id,
      activeOrg.id
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "Expense not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expenses PUT error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
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
    const exp = db.prepare("SELECT receipt_file_id FROM expenses WHERE id = ? AND organization_id = ?").get(id, activeOrg.id) as any;

    if (!exp) {
      return NextResponse.json({ error: "Expense not found or access denied." }, { status: 404 });
    }

    if (exp?.receipt_file_id) {
      const otherUse = db.prepare("SELECT COUNT(*) as c FROM expenses WHERE receipt_file_id = ? AND id != ?").get(exp.receipt_file_id, id) as any;
      if (otherUse?.c === 0) {
        const file = db.prepare("SELECT storage_path FROM files WHERE id = ? AND organization_id = ?").get(exp.receipt_file_id, activeOrg.id) as any;
        if (file?.storage_path) {
          await deleteAsset(file.storage_path);
        }
        db.prepare("DELETE FROM files WHERE id = ? AND organization_id = ?").run(exp.receipt_file_id, activeOrg.id);
      }
    }

    db.prepare("DELETE FROM expenses WHERE id = ? AND organization_id = ?").run(id, activeOrg.id);

    return NextResponse.json({ success: true, message: "Expense and associated receipt cleaned up" });
  } catch (error) {
    console.error("Expenses DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
