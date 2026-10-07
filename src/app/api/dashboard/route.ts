import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { user, activeOrg } = context;
    const orgId = activeOrg.id;

    // Organization Members
    const members = db.prepare(`
      SELECT u.id, u.display_name, u.avatar_color, om.role
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ?
    `).all(orgId) as any[];

    const p1 = members[0];
    const p2 = members[1];

    // Total income for active organization
    const incomeStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END) as totalReceived,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as totalPending,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount
      FROM incomes
      WHERE organization_id = ?
    `).get(orgId) as any;

    // Total expenses for active organization
    const expenseStats = db.prepare(`
      SELECT 
        SUM(amount) as totalExpenses,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingExpenses,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingExpensesCount
      FROM expenses
      WHERE organization_id = ?
    `).get(orgId) as any;

    const totalIncome = incomeStats?.totalReceived || 0;
    const totalExpenses = expenseStats?.totalExpenses || 0;
    const netBalance = totalIncome - totalExpenses;

    // Active subscriptions & monthly burn for active organization
    const subs = db.prepare("SELECT * FROM subscriptions WHERE active = 1 AND organization_id = ?").all(orgId) as any[];
    let monthlyBurn = 0;
    subs.forEach((s) => {
      if (s.billing_cycle === "monthly") monthlyBurn += s.cost;
      else if (s.billing_cycle === "annual") monthlyBurn += s.cost / 12;
      else if (s.billing_cycle === "quarterly") monthlyBurn += s.cost / 3;
    });

    // Upcoming renewal alert in next 14 days
    const upcomingRenewals = db.prepare(`
      SELECT * FROM subscriptions
      WHERE active = 1 AND organization_id = ? AND date(next_renewal_date) <= date('now', '+14 days')
      ORDER BY next_renewal_date ASC
      LIMIT 3
    `).all(orgId);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      WHERE organization_id = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(orgId);

    // Member spend split
    const partnerSpend = db.prepare(`
      SELECT u.id, u.display_name, u.avatar_color, SUM(e.amount) as total
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      WHERE e.organization_id = ?
      GROUP BY u.id
    `).all(orgId);

    // Recent expenses
    const recentExpenses = db.prepare(`
      SELECT e.*, u.display_name as paid_by_name, u.avatar_color as paid_by_color
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      WHERE e.organization_id = ?
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT 5
    `).all(orgId);

    // Recent incomes
    const recentIncomes = db.prepare(`
      SELECT i.*, u.display_name as received_by_name
      FROM incomes i
      JOIN users u ON i.received_by_user_id = u.id
      WHERE i.organization_id = ?
      ORDER BY i.date DESC, i.created_at DESC
      LIMIT 5
    `).all(orgId);

    // Recent files
    const recentFiles = db.prepare(`
      SELECT f.*, u.display_name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE f.organization_id = ? AND (f.is_private = 0 OR f.uploaded_by_user_id = ?)
      ORDER BY f.created_at DESC
      LIMIT 5
    `).all(orgId, user.id);

    // Compute settlement debt within organization
    let p2OwesP1 = 0;
    let p1OwesP2 = 0;
    const allExpenses = db.prepare("SELECT * FROM expenses WHERE organization_id = ?").all(orgId) as any[];
    allExpenses.forEach((exp) => {
      const isCompanyCard = (exp.payment_method || "").toLowerCase().includes("company");
      if (!isCompanyCard && exp.split_type === "equal") {
        if (p1 && exp.paid_by_user_id === p1.id) p2OwesP1 += exp.amount / 2;
        if (p2 && exp.paid_by_user_id === p2.id) p1OwesP2 += exp.amount / 2;
      }
    });

    const settlements = db.prepare("SELECT * FROM settlements WHERE organization_id = ?").all(orgId) as any[];
    settlements.forEach((st) => {
      if (p1 && p2) {
        if (st.from_user_id === p2.id && st.to_user_id === p1.id) p2OwesP1 -= st.amount;
        if (st.from_user_id === p1.id && st.to_user_id === p2.id) p1OwesP2 -= st.amount;
      }
    });

    const netOwed = p2OwesP1 - p1OwesP2;
    let settlementStatus = {
      isSettled: Math.abs(netOwed) <= 0.01,
      text: "Partner balances are even",
      amount: Math.round(Math.abs(netOwed) * 100) / 100,
      debtorName: netOwed > 0.01 ? p2?.display_name : p1?.display_name,
      creditorName: netOwed > 0.01 ? p1?.display_name : p2?.display_name,
    };
    if (Math.abs(netOwed) > 0.01) {
      settlementStatus.text = `${settlementStatus.debtorName} owes ${settlementStatus.creditorName} $${settlementStatus.amount.toFixed(2)}`;
    }

    return NextResponse.json({
      metrics: {
        totalIncome,
        totalExpenses,
        netBalance,
        pendingReceivables: incomeStats?.totalPending || 0,
        pendingReceivablesCount: incomeStats?.pendingCount || 0,
        pendingPayables: expenseStats?.pendingExpenses || 0,
        activeSubscriptionsCount: subs.length,
        monthlySubscriptionBurn: Math.round(monthlyBurn * 100) / 100,
      },
      settlementStatus,
      categoryBreakdown,
      partnerSpend,
      upcomingRenewals,
      recentExpenses,
      recentIncomes,
      recentFiles,
      organization: {
        id: activeOrg.id,
        name: activeOrg.name,
        currency: activeOrg.currency,
        role: activeOrg.role,
      },
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json({ error: "Failed to generate dashboard metrics" }, { status: 500 });
  }
}
