import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const orgId = activeOrg.id;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const paidBy = searchParams.get("paidBy");
    const search = searchParams.get("search");
    const month = searchParams.get("month"); // YYYY-MM

    let query = `
      SELECT e.*, u.display_name as paid_by_name, u.avatar_color as paid_by_color,
             f.name as receipt_name, f.original_name as receipt_orig_name
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      LEFT JOIN files f ON e.receipt_file_id = f.id
      WHERE e.organization_id = ?
    `;
    const params: any[] = [orgId];

    if (category && category !== "all") {
      query += ` AND e.category = ?`;
      params.push(category);
    }
    if (paidBy && paidBy !== "all") {
      query += ` AND e.paid_by_user_id = ?`;
      params.push(paidBy);
    }
    if (search) {
      query += ` AND (e.title LIKE ? OR e.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (month) {
      query += ` AND e.date LIKE ?`;
      params.push(`${month}%`);
    }

    query += ` ORDER BY e.date DESC, e.created_at DESC`;

    const expenses = db.prepare(query).all(...params);

    // Compute summaries strictly for active organization
    const totalsByCategory = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE organization_id = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(orgId);

    const totalsByPartner = db.prepare(`
      SELECT u.id, u.display_name, SUM(e.amount) as total
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      WHERE e.organization_id = ?
      GROUP BY u.id
    `).all(orgId);

    const overallTotal = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE organization_id = ?`).get(orgId) as { total: number | null };

    return NextResponse.json({
      expenses,
      summary: {
        overallTotal: overallTotal?.total || 0,
        totalsByCategory,
        totalsByPartner,
      },
    });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { user, activeOrg } = context;
    const orgId = activeOrg.id;

    const body = await req.json();
    const {
      title,
      category,
      amount,
      currency = activeOrg.currency || "USD",
      date = new Date().toISOString().split("T")[0],
      paid_by_user_id = user.id,
      payment_method = "Company Card",
      split_type = "equal",
      notes = "",
      receipt_file_id = null,
      status = "settled",
    } = body;

    if (!title || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "Valid title and numeric amount required" }, { status: 400 });
    }

    const payerMember = db.prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?").get(orgId, paid_by_user_id);
    if (!payerMember) {
      return NextResponse.json({ error: "The designated payer is not a member of this organization." }, { status: 400 });
    }

    if (receipt_file_id) {
      const fileCheck = db.prepare("SELECT id FROM files WHERE id = ? AND organization_id = ?").get(receipt_file_id, orgId);
      if (!fileCheck) {
        return NextResponse.json({ error: "Receipt file not found or access denied in this organization." }, { status: 400 });
      }
    }

    const id = "exp_" + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO expenses (id, title, category, amount, currency, date, paid_by_user_id, payment_method, split_type, notes, receipt_file_id, status, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      category || "General",
      parseFloat(amount),
      currency,
      date,
      paid_by_user_id,
      payment_method,
      split_type,
      notes,
      receipt_file_id,
      status,
      orgId
    );

    const created = db.prepare(`
      SELECT e.*, u.display_name as paid_by_name, u.avatar_color as paid_by_color
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      WHERE e.id = ? AND e.organization_id = ?
    `).get(id, orgId);

    return NextResponse.json({ success: true, expense: created });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
