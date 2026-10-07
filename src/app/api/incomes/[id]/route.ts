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
    const { title, client_name, amount, currency, date, received_by_user_id, status, notes } = body;

    db.prepare(`
      UPDATE incomes
      SET title = ?, client_name = ?, amount = ?, currency = ?, date = ?,
          received_by_user_id = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(
      title,
      client_name,
      parseFloat(amount),
      currency || "USD",
      date,
      received_by_user_id,
      status,
      notes,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Incomes PUT error:", error);
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    db.prepare("DELETE FROM incomes WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Incomes DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
  }
}
