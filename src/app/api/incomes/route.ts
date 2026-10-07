import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = `
      SELECT i.*, u.display_name as received_by_name, u.avatar_color as received_by_color,
             f.name as invoice_name
      FROM incomes i
      JOIN users u ON i.received_by_user_id = u.id
      LEFT JOIN files f ON i.invoice_file_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== "all") {
      query += ` AND i.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (i.title LIKE ? OR i.client_name LIKE ? OR i.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY i.date DESC, i.created_at DESC`;

    const incomes = db.prepare(query).all(...params);

    const totalReceived = db.prepare(`SELECT SUM(amount) as total FROM incomes WHERE status = 'received'`).get() as { total: number | null };
    const totalPending = db.prepare(`SELECT SUM(amount) as total FROM incomes WHERE status = 'pending'`).get() as { total: number | null };

    return NextResponse.json({
      incomes,
      summary: {
        totalReceived: totalReceived?.total || 0,
        totalPending: totalPending?.total || 0,
      },
    });
  } catch (error) {
    console.error("Incomes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch incomes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      client_name,
      amount,
      currency = "USD",
      date = new Date().toISOString().split("T")[0],
      received_by_user_id = user.id,
      status = "received",
      notes = "",
      invoice_file_id = null,
    } = body;

    if (!title || !client_name || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "Valid title, client name, and amount required" }, { status: 400 });
    }

    const id = "inc_" + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO incomes (id, title, client_name, amount, currency, date, received_by_user_id, status, notes, invoice_file_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      client_name.trim(),
      parseFloat(amount),
      currency,
      date,
      received_by_user_id,
      status,
      notes,
      invoice_file_id
    );

    const created = db.prepare(`
      SELECT i.*, u.display_name as received_by_name, u.avatar_color as received_by_color
      FROM incomes i
      JOIN users u ON i.received_by_user_id = u.id
      WHERE i.id = ?
    `).get(id);

    return NextResponse.json({ success: true, income: created });
  } catch (error) {
    console.error("Incomes POST error:", error);
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
  }
}
