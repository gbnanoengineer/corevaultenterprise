import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteAsset } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, category, amount, currency, date, paid_by_user_id, payment_method, split_type, notes, status } = body;

    db.prepare(`
      UPDATE expenses
      SET title = ?, category = ?, amount = ?, currency = ?, date = ?,
          paid_by_user_id = ?, payment_method = ?, split_type = ?, notes = ?, status = ?
      WHERE id = ?
    `).run(
      title,
      category,
      parseFloat(amount),
      currency || "USD",
      date,
      paid_by_user_id,
      payment_method,
      split_type,
      notes,
      status,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expenses PUT error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const exp = db.prepare("SELECT receipt_file_id FROM expenses WHERE id = ?").get(id) as any;

    if (exp?.receipt_file_id) {
      // Check if any other expense uses this receipt
      const otherUse = db.prepare("SELECT COUNT(*) as c FROM expenses WHERE receipt_file_id = ? AND id != ?").get(exp.receipt_file_id, id) as any;
      if (otherUse?.c === 0) {
        const file = db.prepare("SELECT storage_path FROM files WHERE id = ?").get(exp.receipt_file_id) as any;
        if (file?.storage_path) {
          await deleteAsset(file.storage_path);
        }
        db.prepare("DELETE FROM files WHERE id = ?").run(exp.receipt_file_id);
      }
    }

    db.prepare("DELETE FROM expenses WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Expense and associated receipt cleaned up" });
  } catch (error) {
    console.error("Expenses DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
