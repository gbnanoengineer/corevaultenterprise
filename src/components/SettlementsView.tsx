"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  X
} from "lucide-react";

interface SettlementsViewProps {
  currentUser: any;
  partners: any[];
  currency: string;
}

export default function SettlementsView({
  currentUser,
  partners,
  currency,
}: SettlementsViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    from_user_id: "",
    to_user_id: "",
    amount: "",
    currency: currency || "USD",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settlements");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Fetch settlements error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const p1 = partners[0];
  const p2 = partners[1];

  const handleOpenSettle = () => {
    if (data?.balances?.debtor && data?.balances?.creditor) {
      setFormData({
        from_user_id: data.balances.debtor.id,
        to_user_id: data.balances.creditor.id,
        amount: data.balances.netOwedAmount.toString(),
        currency: currency || "USD",
        date: new Date().toISOString().split("T")[0],
        notes: `Balance settlement between partners`,
      });
    } else {
      setFormData({
        from_user_id: p2?.id || "",
        to_user_id: p1?.id || "",
        amount: "",
        currency: currency || "USD",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from_user_id || !formData.to_user_id || !formData.amount) return;

    try {
      await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      fetchSettlements();
    } catch (err) {
      console.error("Log settlement error:", err);
    }
  };

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
        Calculating partner balances and settlement ledger...
      </div>
    );
  }

  const { balances, settlements } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Partner Settlement Ledger
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Transparent 50/50 balance settlement calculation and reimbursement records.
          </p>
        </div>

        <button
          id="btn-log-settlement-modal"
          onClick={handleOpenSettle}
          className="btn-primary"
          style={{ fontSize: "0.85rem", padding: "9px 14px" }}
        >
          <Scale size={16} />
          <span>Record Settlement Payout</span>
        </button>
      </div>

      {/* Main Settlement Highlight Spotlight */}
      <div
        className="glass-card"
        style={{
          padding: "28px 32px",
          background: balances.isSettled
            ? "radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 70%)"
            : "radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.9) 70%)",
          border: balances.isSettled
            ? "1px solid rgba(16, 185, 129, 0.35)"
            : "1px solid rgba(245, 158, 11, 0.4)",
          borderRadius: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: balances.isSettled ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
              color: balances.isSettled ? "#34d399" : "#fbbf24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: balances.isSettled ? "0 0 24px rgba(16, 185, 129, 0.3)" : "0 0 24px rgba(245, 158, 11, 0.3)",
            }}>
              <Scale size={30} />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: balances.isSettled ? "#34d399" : "#fbbf24" }}>
                Current Net Position
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
                {balances.summaryText}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 4 }}>
                {balances.isSettled
                  ? "Both partners have contributed equally to shared company expenditures."
                  : `A repayment of ${formatCurr(balances.netOwedAmount)} will square all shared expenses.`}
              </p>
            </div>
          </div>

          {!balances.isSettled && (
            <button
              id="btn-settle-now-action"
              onClick={handleOpenSettle}
              className="btn-primary"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
                padding: "12px 22px",
                fontSize: "0.95rem"
              }}
            >
              <span>Square Up {formatCurr(balances.netOwedAmount)}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Partner Comparison Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Partner 1 Card */}
        {p1 && (
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: p1.avatar_color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#ffffff"
              }}>
                {p1.display_name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>{p1.display_name}</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{p1.role}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.86rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Out-of-Pocket Covered:</span>
                <strong style={{ color: "#ffffff" }}>{formatCurr(balances.p1PaidOutPocket)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Partner Share (50%):</span>
                <span style={{ color: "var(--text-muted)" }}>{formatCurr(balances.p1PaidOutPocket / 2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Partner 2 Card */}
        {p2 && (
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: p2.avatar_color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#ffffff"
              }}>
                {p2.display_name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>{p2.display_name}</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{p2.role}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.86rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Out-of-Pocket Covered:</span>
                <strong style={{ color: "#ffffff" }}>{formatCurr(balances.p2PaidOutPocket)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Partner Share (50%):</span>
                <span style={{ color: "var(--text-muted)" }}>{formatCurr(balances.p2PaidOutPocket / 2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Settlements Audit Trail */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
            Settlement Payout History
          </h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 18px" }}>Date</th>
                <th style={{ padding: "12px 16px" }}>Paid From</th>
                <th style={{ padding: "12px 16px" }}>Paid To</th>
                <th style={{ padding: "12px 16px" }}>Notes / Memo</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Amount Settled</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    No settlements have been recorded yet.
                  </td>
                </tr>
              ) : (
                settlements.map((st: any) => (
                  <tr key={st.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>{st.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: st.from_user_color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "#fff", fontWeight: 700 }}>
                          {st.from_user_name?.charAt(0)}
                        </div>
                        <span style={{ color: "#fff" }}>{st.from_user_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: st.to_user_color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "#fff", fontWeight: 700 }}>
                          {st.to_user_name?.charAt(0)}
                        </div>
                        <span style={{ color: "#fff" }}>{st.to_user_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{st.notes || "—"}</td>
                    <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 700, color: "#34d399" }}>
                      {formatCurr(st.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Settlement Payout Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            width: "100%",
            maxWidth: 480,
            background: "#0f172a",
            border: "1px solid var(--border-medium)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                Record Settlement Transfer
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Sender (Paid By) *
                  </label>
                  <select
                    id="select-settle-sender"
                    value={formData.from_user_id}
                    onChange={(e) => setFormData({ ...formData, from_user_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Partner</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Receiver (Paid To) *
                  </label>
                  <select
                    id="select-settle-receiver"
                    value={formData.to_user_id}
                    onChange={(e) => setFormData({ ...formData, to_user_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Partner</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Settlement Amount *
                  </label>
                  <input
                    id="input-settle-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Transfer Date
                  </label>
                  <input
                    id="input-settle-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Memo / Note
                </label>
                <input
                  id="input-settle-memo"
                  type="text"
                  placeholder="e.g. Bank transfer, Venmo, Zelle confirmation"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button id="btn-save-settle" type="submit" className="btn-primary">
                  Save Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
