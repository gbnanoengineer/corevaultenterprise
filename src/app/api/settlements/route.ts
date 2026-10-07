import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const orgId = activeOrg.id;

    // Organization members
    const partners = db.prepare(`
      SELECT u.id, u.display_name, u.avatar_color, om.role
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ?
    `).all(orgId) as any[];

    const p1 = partners[0];
    const p2 = partners[1];

    // Get organization expenses
    const expenses = db.prepare(`
      SELECT e.*, u.display_name as paid_by_name
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      WHERE e.organization_id = ?
    `).all(orgId) as any[];

    // Get organization settlements
    const settlements = db.prepare(`
      SELECT s.*,
             u1.display_name as from_user_name, u1.avatar_color as from_user_color,
             u2.display_name as to_user_name, u2.avatar_color as to_user_color
      FROM settlements s
      JOIN users u1 ON s.from_user_id = u1.id
      JOIN users u2 ON s.to_user_id = u2.id
      WHERE s.organization_id = ?
      ORDER BY s.date DESC, s.created_at DESC
    `).all(orgId) as any[];

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

    // Factor in settlement payments already made within organization
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

    // Net balance calculation
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
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const body = await req.json();
    const { from_user_id, to_user_id, amount, currency = activeOrg.currency || "USD", date = new Date().toISOString().split("T")[0], notes = "" } = body;

    if (!from_user_id || !to_user_id || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "Sender, recipient, and positive amount required" }, { status: 400 });
    }

    const senderMember = db.prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?").get(activeOrg.id, from_user_id);
    const recipientMember = db.prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?").get(activeOrg.id, to_user_id);
    if (!senderMember || !recipientMember) {
      return NextResponse.json({ error: "Both sender and recipient must be members of the active organization" }, { status: 400 });
    }

    const id = "set_" + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO settlements (id, from_user_id, to_user_id, amount, currency, date, notes, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, from_user_id, to_user_id, parseFloat(amount), currency, date, notes, activeOrg.id);

    const created = db.prepare(`
      SELECT s.*,
             u1.display_name as from_user_name, u1.avatar_color as from_user_color,
             u2.display_name as to_user_name, u2.avatar_color as to_user_color
      FROM settlements s
      JOIN users u1 ON s.from_user_id = u1.id
      JOIN users u2 ON s.to_user_id = u2.id
      WHERE s.id = ? AND s.organization_id = ?
    `).get(id, activeOrg.id);

    return NextResponse.json({ success: true, settlement: created });
  } catch (error) {
    console.error("Settlements POST error:", error);
    return NextResponse.json({ error: "Failed to log settlement" }, { status: 500 });
  }
}
