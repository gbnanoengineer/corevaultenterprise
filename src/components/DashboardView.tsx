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
  ExternalLink,
  PieChart,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight
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

const CATEGORY_COLORS = [
  { bg: "#6366f1", light: "rgba(99, 102, 241, 0.15)", text: "#818cf8" },
  { bg: "#06b6d4", light: "rgba(6, 182, 212, 0.15)", text: "#38bdf8" },
  { bg: "#10b981", light: "rgba(16, 185, 129, 0.15)", text: "#34d399" },
  { bg: "#f59e0b", light: "rgba(245, 158, 11, 0.15)", text: "#fbbf24" },
  { bg: "#ec4899", light: "rgba(236, 72, 153, 0.15)", text: "#f472b6" },
  { bg: "#8b5cf6", light: "rgba(139, 92, 246, 0.15)", text: "#a78bfa" },
];

export default function DashboardView({
  data,
  currency,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenSubscriptionModal,
  onOpenUploadModal,
  onNavigateTab,
}: DashboardViewProps) {
  if (!data || !data.metrics) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        color: "var(--text-secondary)",
        gap: 12
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(99, 102, 241, 0.1)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#818cf8"
        }}>
          <RefreshCw size={20} className="animate-spin" />
        </div>
        <span style={{ fontSize: "0.92rem", fontWeight: 500 }}>
          Synchronizing enterprise command center metrics...
        </span>
      </div>
    );
  }

  const {
    metrics,
    settlementStatus = { isSettled: true, text: "Partner balances are even", amount: 0 },
    categoryBreakdown = [],
    partnerSpend = [],
    upcomingRenewals = [],
    recentExpenses = [],
    recentIncomes = [],
    recentFiles = []
  } = data;

  const isSettled = settlementStatus?.isSettled ?? true;

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Helper for renewal due days
  const getDueBadge = (dateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dateStr);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) return { label: "Due Today", color: "#fb7185", bg: "rgba(244, 63, 94, 0.12)" };
      if (diffDays <= 3) return { label: `In ${diffDays} days`, color: "#fbbf24", bg: "rgba(245, 158, 11, 0.12)" };
      return { label: `In ${diffDays} days`, color: "#38bdf8", bg: "rgba(14, 165, 233, 0.12)" };
    } catch {
      return { label: dateStr, color: "#94a3b8", bg: "rgba(255, 255, 255, 0.06)" };
    }
  };

  // Total partner spend for proportion bar
  const totalPartnerSpend = partnerSpend.reduce((acc: number, p: any) => acc + (p.total || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* =========================================================================
          TOP COMMAND CENTER BAR & ACTIONS
         ========================================================================= */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        paddingBottom: 4
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.025em",
              lineHeight: 1.2
            }}>
              Financial Command Center
            </h1>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.22)",
              borderRadius: 20,
              padding: "3px 9px",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#34d399"
            }}>
              <span className="status-dot status-dot-active" />
              <span>Live Ledger</span>
            </div>
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Multi-partner expense reconciliation, cloud document vault, and SaaS runway management.
          </p>
        </div>

        {/* Quick Action Triggers */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            id="btn-quick-expense"
            onClick={onOpenExpenseModal}
            className="btn-primary"
            style={{ fontSize: "0.84rem", padding: "8px 15px" }}
          >
            <Plus size={15} />
            <span>Log Expense</span>
          </button>

          <button
            id="btn-quick-income"
            onClick={onOpenIncomeModal}
            className="btn-secondary"
            style={{ fontSize: "0.84rem", padding: "8px 14px" }}
          >
            <ArrowDownLeft size={15} color="#10b981" />
            <span>Record Inflow</span>
          </button>

          <button
            id="btn-quick-upload"
            onClick={onOpenUploadModal}
            className="btn-secondary"
            style={{ fontSize: "0.84rem", padding: "8px 14px" }}
          >
            <FileText size={15} color="#38bdf8" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          EXECUTIVE PARTNER SETTLEMENT BANNER
         ========================================================================= */}
      <div style={{
        background: isSettled
          ? "linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)"
          : "linear-gradient(90deg, rgba(245, 158, 11, 0.09) 0%, rgba(99, 102, 241, 0.06) 100%)",
        border: isSettled
          ? "1px solid rgba(16, 185, 129, 0.22)"
          : "1px solid rgba(245, 158, 11, 0.28)",
        boxShadow: isSettled
          ? "inset 0 1px 0 rgba(16, 185, 129, 0.15), 0 4px 16px rgba(0, 0, 0, 0.25)"
          : "inset 0 1px 0 rgba(245, 158, 11, 0.18), 0 4px 16px rgba(0, 0, 0, 0.25)",
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: isSettled ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
            border: isSettled ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isSettled ? "#34d399" : "#fbbf24",
            flexShrink: 0
          }}>
            <Scale size={20} />
          </div>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: isSettled ? "#34d399" : "#fbbf24"
            }}>
              <span>PARTNER LEDGER</span>
              <span>•</span>
              <span style={{ color: "var(--text-muted)" }}>50/50 OUT-OF-POCKET EXPENSE SPLIT</span>
            </div>
            <div style={{
              fontSize: "0.96rem",
              fontWeight: 700,
              color: "#ffffff",
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <span>{settlementStatus.text}</span>
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
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 7,
            padding: "7px 13px",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.09)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <span>View Settlement Ledger</span>
          <ArrowUpRight size={14} color="#818cf8" />
        </button>
      </div>

      {/* =========================================================================
          4 CORE EXECUTIVE FINANCIAL METRICS CARDS
         ========================================================================= */}
      <div className="responsive-stats-grid">
        {/* 1. Net Cash Position */}
        <div className="glass-card" style={{
          padding: 18,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: metrics.netBalance >= 0 ? "linear-gradient(90deg, #10b981, #06b6d4)" : "linear-gradient(90deg, #f43f5e, #fbbf24)"
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.02em" }}>
              Net Cash Position
            </span>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8"
            }}>
              <Wallet size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: metrics.netBalance >= 0 ? "#ffffff" : "#fb7185",
            letterSpacing: "-0.02em"
          }}>
            {formatCurr(metrics.netBalance)}
          </div>
          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: metrics.netBalance >= 0 ? "#34d399" : "#fb7185"
            }} />
            <span>Revenue minus recorded expenses</span>
          </div>
        </div>

        {/* 2. Total Logged Expenses */}
        <div className="glass-card" style={{
          padding: 18,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, #f43f5e, #ec4899)"
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.02em" }}>
              Total Logged Expenses
            </span>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(244, 63, 94, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fb7185"
            }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em"
          }}>
            {formatCurr(metrics.totalExpenses)}
          </div>
          <div style={{ fontSize: "0.73rem", color: metrics.pendingPayables > 0 ? "#fbbf24" : "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
            {metrics.pendingPayables > 0 ? (
              <span>Includes {formatCurr(metrics.pendingPayables)} pending payables</span>
            ) : (
              <span>All company expenses reconciled</span>
            )}
          </div>
        </div>

        {/* 3. Total Inflows Received */}
        <div className="glass-card" style={{
          padding: 18,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, #10b981, #06b6d4)"
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.02em" }}>
              Total Inflows Received
            </span>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(16, 185, 129, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34d399"
            }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em"
          }}>
            {formatCurr(metrics.totalIncome)}
          </div>
          <div style={{ fontSize: "0.73rem", color: "#34d399", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
            {metrics.pendingReceivables > 0 ? (
              <span>+{formatCurr(metrics.pendingReceivables)} pending client invoices</span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Cleared to company accounts</span>
            )}
          </div>
        </div>

        {/* 4. Monthly SaaS Burn Rate */}
        <div className="glass-card" style={{
          padding: 18,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, #0ea5e9, #6366f1)"
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.02em" }}>
              Monthly SaaS Burn
            </span>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(14, 165, 233, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8"
            }}>
              <RefreshCw size={16} />
            </div>
          </div>
          <div className="tabular-nums" style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em"
          }}>
            {formatCurr(metrics.monthlySubscriptionBurn)}
            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)" }}>/mo</span>
          </div>
          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <span>{metrics.activeSubscriptionsCount} active recurring subscriptions</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MIDDLE GRID: CATEGORY BREAKDOWN & PARTNER SPEND / RENEWALS
         ========================================================================= */}
      <div className="responsive-grid-2col">
        {/* Expenses by Category Card */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                Expenses by Category
              </h2>
              <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 2 }}>
                Portfolio capital distribution by category
              </div>
            </div>
            <button
              id="btn-dash-view-all-expenses"
              onClick={() => onNavigateTab("expenses")}
              style={{
                fontSize: "0.76rem",
                fontWeight: 600,
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Segmented Distribution Bar */}
          {categoryBreakdown && categoryBreakdown.length > 0 && metrics.totalExpenses > 0 && (
            <div style={{
              display: "flex",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 16,
              background: "rgba(255, 255, 255, 0.05)",
              gap: 2
            }}>
              {categoryBreakdown.slice(0, 5).map((cat: any, idx: number) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const pct = Math.max(1, Math.round((cat.total / metrics.totalExpenses) * 100));
                return (
                  <div
                    key={cat.category}
                    title={`${cat.category}: ${formatCurr(cat.total)} (${pct}%)`}
                    style={{
                      width: `${pct}%`,
                      background: color.bg,
                      borderRadius: 2
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Category Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              categoryBreakdown.slice(0, 5).map((cat: any, idx: number) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const pct = metrics.totalExpenses > 0 ? Math.round((cat.total / metrics.totalExpenses) * 100) : 0;
                return (
                  <div key={cat.category} style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color.bg,
                          boxShadow: `0 0 6px ${color.bg}`
                        }} />
                        <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.82rem" }}>
                          {cat.category}
                        </span>
                      </div>
                      <div className="tabular-nums" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#ffffff", fontSize: "0.86rem" }}>
                          {formatCurr(cat.total)}
                        </span>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: color.light,
                          color: color.text,
                          border: `1px solid ${color.text}33`
                        }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "rgba(255, 255, 255, 0.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: color.bg,
                          borderRadius: 2,
                          transition: "width 0.4s ease"
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", padding: "16px 0", textAlign: "center" }}>
                No expense category data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Stack: Partner Out-of-Pocket Spend + Upcoming Renewals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Partner Out-of-Pocket Spend */}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={16} color="#818cf8" />
                <h2 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Partner Out-of-Pocket Spend
                </h2>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Personal Cards
              </span>
            </div>

            {/* Split Bar */}
            {partnerSpend.length >= 2 && totalPartnerSpend > 0 && (
              <div style={{
                display: "flex",
                height: 6,
                borderRadius: 3,
                overflow: "hidden",
                marginBottom: 12,
                background: "rgba(255, 255, 255, 0.06)"
              }}>
                <div style={{
                  width: `${Math.round((partnerSpend[0].total / totalPartnerSpend) * 100)}%`,
                  background: partnerSpend[0].avatar_color || "#3b82f6"
                }} />
                <div style={{
                  width: `${Math.round((partnerSpend[1].total / totalPartnerSpend) * 100)}%`,
                  background: partnerSpend[1].avatar_color || "#10b981"
                }} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {partnerSpend && partnerSpend.map((p: any) => {
                const sharePct = totalPartnerSpend > 0 ? Math.round((p.total / totalPartnerSpend) * 100) : 0;
                return (
                  <div key={p.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.025)",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: p.avatar_color || "#3b82f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        color: "#ffffff",
                        boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.08)"
                      }}>
                        {p.display_name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ffffff" }}>
                          {p.display_name}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          {sharePct}% of personal outlays
                        </div>
                      </div>
                    </div>
                    <span className="tabular-nums" style={{ fontSize: "0.92rem", fontWeight: 700, color: "#ffffff" }}>
                      {formatCurr(p.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Subscriptions Alerts */}
          <div className="glass-card" style={{ padding: 18, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Calendar size={15} color="#38bdf8" />
                <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Upcoming Renewals
                </h3>
              </div>
              <button
                id="btn-dash-view-subs"
                onClick={() => onNavigateTab("subscriptions")}
                style={{ fontSize: "0.75rem", fontWeight: 600, color: "#38bdf8" }}
              >
                View all
              </button>
            </div>

            {upcomingRenewals && upcomingRenewals.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingRenewals.map((sub: any) => {
                  const badge = getDueBadge(sub.next_renewal_date);
                  return (
                    <div key={sub.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 11px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid rgba(255, 255, 255, 0.05)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "rgba(14, 165, 233, 0.12)",
                          border: "1px solid rgba(14, 165, 233, 0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#38bdf8",
                          fontSize: "0.74rem",
                          fontWeight: 700
                        }}>
                          {sub.name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ffffff" }}>
                            {sub.name}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                            <span>Due: {sub.next_renewal_date}</span>
                            <span>•</span>
                            <span style={{
                              color: badge.color,
                              fontWeight: 600
                            }}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="tabular-nums" style={{ fontSize: "0.86rem", fontWeight: 700, color: "#38bdf8" }}>
                          {formatCurr(sub.cost)}
                        </div>
                        <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                          {sub.billing_cycle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>
                No renewals due in next 14 days.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM GRID: RECENT EXPENSES & RECENT VAULT DOCUMENTS
         ========================================================================= */}
      <div className="responsive-grid-equal">
        {/* Recent Expenses List */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                Recent Expenses
              </h3>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                Latest verified expenditures across all payment methods
              </div>
            </div>
            <button
              id="btn-dash-more-expenses"
              onClick={() => onNavigateTab("expenses")}
              style={{
                fontSize: "0.76rem",
                fontWeight: 600,
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>See all</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentExpenses && recentExpenses.length > 0 ? (
              recentExpenses.map((exp: any) => (
                <div key={exp.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  transition: "all 0.15s ease",
                  gap: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: "rgba(244, 63, 94, 0.1)",
                      border: "1px solid rgba(244, 63, 94, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fb7185",
                      flexShrink: 0
                    }}>
                      <CreditCard size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {exp.title}
                      </div>
                      <div style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                        flexWrap: "wrap"
                      }}>
                        <span style={{ color: "var(--text-secondary)" }}>{exp.category}</span>
                        <span>•</span>
                        <span>Paid by {exp.paid_by_name}</span>
                        <span>•</span>
                        <span style={{ whiteSpace: "nowrap" }}>{exp.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="tabular-nums" style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fb7185", whiteSpace: "nowrap", flexShrink: 0 }}>
                    -{formatCurr(exp.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
                No expenses logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents in Vault */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                Recent Vault Documents
              </h3>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                Encrypted enterprise asset storage backed by S3
              </div>
            </div>
            <button
              id="btn-dash-more-docs"
              onClick={() => onNavigateTab("documents")}
              style={{
                fontSize: "0.76rem",
                fontWeight: 600,
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>Open Vault</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentFiles && recentFiles.length > 0 ? (
              recentFiles.map((f: any) => (
                <div key={f.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.04)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(99, 102, 241, 0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#818cf8",
                      flexShrink: 0
                    }}>
                      <FileText size={15} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: "0.83rem",
                        fontWeight: 600,
                        color: "#ffffff",
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {(f.file_size / 1024).toFixed(1)} KB • {f.uploaded_by_name || "Partner"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab("documents")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
                No documents in vault yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
