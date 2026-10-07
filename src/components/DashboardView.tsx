"use client";

import React from "react";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Scale,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from "lucide-react";

interface DashboardViewProps {
  data: any;
  currency: string;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenUploadModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export default function DashboardView({
  data,
  currency,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenSubscriptionModal,
  onOpenUploadModal,
  onNavigateTab,
}: DashboardViewProps) {
  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
        Loading command center metrics...
      </div>
    );
  }

  const { metrics, settlementStatus, categoryBreakdown, partnerSpend, upcomingRenewals, recentExpenses, recentIncomes, recentFiles } = data;

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Welcome & Quick Actions Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Financial Command Center
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Real-time partner cash flows, SaaS subscriptions, settlements, and asset vault.
          </p>
        </div>

        {/* Quick Action Triggers */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            id="btn-quick-expense"
            onClick={onOpenExpenseModal}
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Plus size={16} />
            <span>Log Expense</span>
          </button>

          <button
            id="btn-quick-income"
            onClick={onOpenIncomeModal}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <ArrowDownLeft size={16} color="#10b981" />
            <span>Record Income</span>
          </button>

          <button
            id="btn-quick-upload"
            onClick={onOpenUploadModal}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <FileText size={16} color="#6366f1" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Partner Settlement Banner */}
      <div style={{
        background: settlementStatus.isSettled
          ? "linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)"
          : "linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)",
        border: settlementStatus.isSettled
          ? "1px solid rgba(16, 185, 129, 0.3)"
          : "1px solid rgba(245, 158, 11, 0.35)",
        borderRadius: 16,
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: settlementStatus.isSettled ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: settlementStatus.isSettled ? "#34d399" : "#fbbf24"
          }}>
            <Scale size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: settlementStatus.isSettled ? "#34d399" : "#fbbf24" }}>
              Partner Settlement Balance
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
              {settlementStatus.text}
            </div>
          </div>
        </div>

        <button
          id="btn-banner-settlements"
          onClick={() => onNavigateTab("settlements")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--border-medium)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "#ffffff"
          }}
        >
          <span>View Settlement Ledger</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* 4 Core Financial Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* Net Cash Balance */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Net Cash Position</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: metrics.netBalance >= 0 ? "#ffffff" : "#fb7185", letterSpacing: "-0.01em" }}>
            {formatCurr(metrics.netBalance)}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>Revenue minus all recorded expenses</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total Logged Expenses</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb7185" }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            {formatCurr(metrics.totalExpenses)}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#fb7185", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            {metrics.pendingPayables > 0 ? (
              <span>Includes {formatCurr(metrics.pendingPayables)} pending payables</span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>All expense items logged</span>
            )}
          </div>
        </div>

        {/* Total Income */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total Inflows Received</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            {formatCurr(metrics.totalIncome)}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#34d399", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            {metrics.pendingReceivables > 0 ? (
              <span>+{formatCurr(metrics.pendingReceivables)} pending client invoices</span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Cleared to company accounts</span>
            )}
          </div>
        </div>

        {/* Subscriptions Burn Rate */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Monthly SaaS Burn</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(14, 165, 233, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
              <RefreshCw size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            {formatCurr(metrics.monthlySubscriptionBurn)}<span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>/mo</span>
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{metrics.activeSubscriptionsCount} active recurring subscriptions</span>
          </div>
        </div>
      </div>

      {/* Grid: Spend by Category + Partner Spend Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        {/* Category Breakdown */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
              Expenses by Category
            </h2>
            <button
              id="btn-dash-view-all-expenses"
              onClick={() => onNavigateTab("expenses")}
              style={{ fontSize: "0.78rem", color: "#818cf8" }}
            >
              View All Expenses
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              categoryBreakdown.slice(0, 5).map((cat: any) => {
                const pct = metrics.totalExpenses > 0 ? Math.round((cat.total / metrics.totalExpenses) * 100) : 0;
                return (
                  <div key={cat.category}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", marginBottom: 5 }}>
                      <span style={{ fontWeight: 500, color: "#e2e8f0" }}>{cat.category}</span>
                      <span style={{ fontWeight: 600, color: "#ffffff" }}>
                        {formatCurr(cat.total)} <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255, 255, 255, 0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "16px 0" }}>
                No expense category data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Partner Spend Split & Upcoming Renewals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Partner Spend Contribution */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: 14 }}>
              Partner Out-of-Pocket Spend
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {partnerSpend && partnerSpend.map((p: any) => (
                <div key={p.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: p.avatar_color || "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#ffffff"
                    }}>
                      {p.display_name.charAt(0)}
                    </div>
                    <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>{p.display_name}</span>
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>
                    {formatCurr(p.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Subscriptions Alerts */}
          <div className="glass-card" style={{ padding: 22, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color="#38bdf8" />
                <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#ffffff" }}>
                  Upcoming Renewals
                </h3>
              </div>
              <button
                id="btn-dash-view-subs"
                onClick={() => onNavigateTab("subscriptions")}
                style={{ fontSize: "0.76rem", color: "#38bdf8" }}
              >
                View all
              </button>
            </div>

            {upcomingRenewals && upcomingRenewals.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingRenewals.map((sub: any) => (
                  <div key={sub.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(14, 165, 233, 0.08)",
                    border: "1px solid rgba(14, 165, 233, 0.2)"
                  }}>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ffffff" }}>{sub.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Due: {sub.next_renewal_date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#38bdf8" }}>{formatCurr(sub.cost)}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{sub.billing_cycle}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "10px 0" }}>
                No renewals due in next 14 days.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Recent Expenses & Recent Files */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Expenses List */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>Recent Expenses</h3>
            <button
              id="btn-dash-more-expenses"
              onClick={() => onNavigateTab("expenses")}
              style={{ fontSize: "0.76rem", color: "#818cf8" }}
            >
              See all
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentExpenses && recentExpenses.length > 0 ? (
              recentExpenses.map((exp: any) => (
                <div key={exp.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "#ffffff" }}>{exp.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", gap: 8, marginTop: 2 }}>
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>Paid by {exp.paid_by_name}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fb7185" }}>
                    -{formatCurr(exp.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No expenses logged yet.</div>
            )}
          </div>
        </div>

        {/* Recent Documents in Vault */}
        <div className="glass-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>Recent Vault Documents</h3>
            <button
              id="btn-dash-more-docs"
              onClick={() => onNavigateTab("documents")}
              style={{ fontSize: "0.76rem", color: "#818cf8" }}
            >
              Open Vault
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentFiles && recentFiles.length > 0 ? (
              recentFiles.map((f: any) => (
                <div key={f.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(99, 102, 241, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#818cf8"
                    }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#ffffff" }}>{f.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {(f.file_size / 1024).toFixed(1)} KB • {f.uploaded_by_name || "Partner"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab("documents")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.74rem",
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No documents in vault yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
