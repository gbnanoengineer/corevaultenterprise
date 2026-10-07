import { NextResponse } from "next/server";
import { getCurrentUser, getAllUsers } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partners = getAllUsers();
    const p1 = partners[0];
    const p2 = partners[1];

    // Get all expenses
    const expenses = db.prepare(`
      SELECT e.*, u.display_name as paid_by_name
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
    `).all() as any[];

    // Get all past settlements
    const settlements = db.prepare(`
      SELECT s.*,
             u1.display_name as from_user_name, u1.avatar_color as from_user_color,
             u2.display_name as to_user_name, u2.avatar_color as to_user_color
      FROM settlements s
      JOIN users u1 ON s.from_user_id = u1.id
      JOIN users u2 ON s.to_user_id = u2.id
      ORDER BY s.date DESC, s.created_at DESC
    `).all() as any[];

    let p1PaidOutPocket = 0;
    let p2PaidOutPocket = 0;
    let companyPaid = 0;

    let p2OwesP1FromExpenses = 0;
    let p1OwesP2FromExpenses = 0;

    expenses.forEach((exp) => {
      const isCompanyCard = (exp.payment_method || "").toLowerCase().includes("company");
      if (isCompanyCard) {
        companyPaid += exp.amount;
        return;
      }

      if (p1 && exp.paid_by_user_id === p1.id) {
        p1PaidOutPocket += exp.amount;
        if (exp.split_type === "equal") {
          p2OwesP1FromExpenses += exp.amount / 2;
        }
      } else if (p2 && exp.paid_by_user_id === p2.id) {
        p2PaidOutPocket += exp.amount;
        if (exp.split_type === "equal") {
          p1OwesP2FromExpenses += exp.amount / 2;
        }
      }
    });

    // Factor in settlement payments already made
    let p2PaidToP1InSettlement = 0;
    let p1PaidToP2InSettlement = 0;

    settlements.forEach((st) => {
      if (p1 && p2) {
        if (st.from_user_id === p2.id && st.to_user_id === p1.id) {
          p2PaidToP1InSettlement += st.amount;
        } else if (st.from_user_id === p1.id && st.to_user_id === p2.id) {
          p1PaidToP2InSettlement += st.amount;
        }
      }
    });

    // Net balance calculation: positive means P2 owes P1; negative means P1 owes P2
    const netP2OwesP1 = (p2OwesP1FromExpenses - p2PaidToP1InSettlement) - (p1OwesP2FromExpenses - p1PaidToP2InSettlement);

    let summaryText = "All balances are settled!";
    let debtor = null;
    let creditor = null;
    let netOwedAmount = 0;

    if (p1 && p2) {
      if (netP2OwesP1 > 0.01) {
        debtor = p2;
        creditor = p1;
        netOwedAmount = Math.round(netP2OwesP1 * 100) / 100;
        summaryText = `${p2.display_name} owes ${p1.display_name} $${netOwedAmount.toFixed(2)}`;
      } else if (netP2OwesP1 < -0.01) {
        debtor = p1;
        creditor = p2;
        netOwedAmount = Math.round(Math.abs(netP2OwesP1) * 100) / 100;
        summaryText = `${p1.display_name} owes ${p2.display_name} $${netOwedAmount.toFixed(2)}`;
      }
    }

    return NextResponse.json({
      settlements,
      balances: {
        p1PaidOutPocket,
        p2PaidOutPocket,
        companyPaid,
        netOwedAmount,
        debtor,
        creditor,
        summaryText,
        isSettled: Math.abs(netP2OwesP1) <= 0.01,
      },
      partners,
    });
  } catch (error) {
    console.error("Settlements GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settlements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { from_user_id, to_user_id, amount, currency = "USD", date = new Date().toISOString().split("T")[0], notes = "" } = body;

    if (!from_user_id || !to_user_id || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "Sender, recipient, and positive amount required" }, { status: 400 });
    }

    const id = "set_" + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO settlements (id, from_user_id, to_user_id, amount, currency, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, from_user_id, to_user_id, parseFloat(amount), currency, date, notes);

    const created = db.prepare(`
      SELECT s.*,
             u1.display_name as from_user_name, u1.avatar_color as from_user_color,
             u2.display_name as to_user_name, u2.avatar_color as to_user_color
      FROM settlements s
      JOIN users u1 ON s.from_user_id = u1.id
      JOIN users u2 ON s.to_user_id = u2.id
      WHERE s.id = ?
    `).get(id);

    return NextResponse.json({ success: true, settlement: created });
  } catch (error) {
    console.error("Settlements POST error:", error);
    return NextResponse.json({ error: "Failed to log settlement" }, { status: 500 });
  }
}
