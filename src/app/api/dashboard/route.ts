import { NextResponse } from "next/server";
import { getCurrentUser, getAllUsers } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partners = getAllUsers();
    const p1 = partners[0];
    const p2 = partners[1];

    // Total income
    const incomeStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END) as totalReceived,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as totalPending,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount
      FROM incomes
    `).get() as any;

    // Total expenses
    const expenseStats = db.prepare(`
      SELECT 
        SUM(amount) as totalExpenses,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingExpenses,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingExpensesCount
      FROM expenses
    `).get() as any;

    const totalIncome = incomeStats?.totalReceived || 0;
    const totalExpenses = expenseStats?.totalExpenses || 0;
    const netBalance = totalIncome - totalExpenses;

    // Active subscriptions & monthly burn
    const subs = db.prepare("SELECT * FROM subscriptions WHERE active = 1").all() as any[];
    let monthlyBurn = 0;
    subs.forEach((s) => {
      if (s.billing_cycle === "monthly") monthlyBurn += s.cost;
      else if (s.billing_cycle === "annual") monthlyBurn += s.cost / 12;
      else if (s.billing_cycle === "quarterly") monthlyBurn += s.cost / 3;
    });

    // Upcoming renewal alert in next 10 days
    const upcomingRenewals = db.prepare(`
      SELECT * FROM subscriptions
      WHERE active = 1 AND date(next_renewal_date) <= date('now', '+14 days')
      ORDER BY next_renewal_date ASC
      LIMIT 3
    `).all();

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `).all();

    // Partner spend split
    const partnerSpend = db.prepare(`
      SELECT u.id, u.display_name, u.avatar_color, SUM(e.amount) as total
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      GROUP BY u.id
    `).all();

    // Recent expenses
    const recentExpenses = db.prepare(`
      SELECT e.*, u.display_name as paid_by_name, u.avatar_color as paid_by_color
      FROM expenses e
      JOIN users u ON e.paid_by_user_id = u.id
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT 5
    `).all();

    // Recent incomes
    const recentIncomes = db.prepare(`
      SELECT i.*, u.display_name as received_by_name
      FROM incomes i
      JOIN users u ON i.received_by_user_id = u.id
      ORDER BY i.date DESC, i.created_at DESC
      LIMIT 5
    `).all();

    // Recent files
    const recentFiles = db.prepare(`
      SELECT f.*, u.display_name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE (f.is_private = 0 OR f.uploaded_by_user_id = ?)
      ORDER BY f.created_at DESC
      LIMIT 5
    `).all(user.id);

    // Compute settlement debt
    let p2OwesP1 = 0;
    let p1OwesP2 = 0;
    const allExpenses = db.prepare("SELECT * FROM expenses").all() as any[];
    allExpenses.forEach((exp) => {
      const isCompanyCard = (exp.payment_method || "").toLowerCase().includes("company");
      if (!isCompanyCard && exp.split_type === "equal") {
        if (p1 && exp.paid_by_user_id === p1.id) p2OwesP1 += exp.amount / 2;
        if (p2 && exp.paid_by_user_id === p2.id) p1OwesP2 += exp.amount / 2;
      }
    });

    const settlements = db.prepare("SELECT * FROM settlements").all() as any[];
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
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json({ error: "Failed to generate dashboard metrics" }, { status: 500 });
  }
}
