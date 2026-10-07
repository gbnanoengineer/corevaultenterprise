"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Download,
  X,
  Building2
} from "lucide-react";

interface IncomesViewProps {
  currentUser: any;
  partners: any[];
  currency: string;
  isAddModalOpenInitially?: boolean;
}

export default function IncomesView({
  currentUser,
  partners,
  currency,
  isAddModalOpenInitially = false,
}: IncomesViewProps) {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(isAddModalOpenInitially);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    client_name: "",
    amount: "",
    currency: currency || "USD",
    date: new Date().toISOString().split("T")[0],
    received_by_user_id: currentUser?.id || "user_1",
    status: "received",
    notes: "",
  });

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/incomes?${params.toString()}`);
      const data = await res.json();
      setIncomes(data.incomes || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Fetch incomes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingIncome(null);
    setFormData({
      title: "",
      client_name: "",
      amount: "",
      currency: currency || "USD",
      date: new Date().toISOString().split("T")[0],
      received_by_user_id: currentUser?.id || "user_1",
      status: "received",
      notes: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (inc: any) => {
    setEditingIncome(inc);
    setFormData({
      title: inc.title,
      client_name: inc.client_name,
      amount: inc.amount.toString(),
      currency: inc.currency || currency || "USD",
      date: inc.date,
      received_by_user_id: inc.received_by_user_id,
      status: inc.status,
      notes: inc.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.client_name || !formData.amount) return;

    try {
      if (editingIncome) {
        await fetch(`/api/incomes/${editingIncome.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchIncomes();
    } catch (err) {
      console.error("Save income error:", err);
    }
  };

  const toggleStatus = async (inc: any) => {
    const nextStatus = inc.status === "received" ? "pending" : "received";
    try {
      await fetch(`/api/incomes/${inc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inc,
          status: nextStatus,
        }),
      });
      fetchIncomes();
    } catch (err) {
      console.error("Update income status error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income record?")) return;
    try {
      await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      fetchIncomes();
    } catch (err) {
      console.error("Delete income error:", err);
    }
  };

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Income & Client Receivables
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Track client project retainers, milestone receipts, and pending receivables.
          </p>
        </div>

        <button
          id="btn-add-income-modal"
          onClick={handleOpenAdd}
          className="btn-primary"
          style={{ fontSize: "0.85rem", padding: "9px 14px" }}
        >
          <Plus size={16} />
          <span>Record Income</span>
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="glass-card" style={{ padding: 18, borderLeft: "4px solid #10b981" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Received to Date</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399", marginTop: 4 }}>
              {formatCurr(summary.totalReceived)}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 18, borderLeft: "4px solid #f59e0b" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Pending Client Invoices</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fbbf24", marginTop: 4 }}>
              {formatCurr(summary.totalPending)}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            id="input-search-income"
            type="text"
            placeholder="Search by client or milestone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36, height: 38 }}
          />
        </div>

        <select
          id="select-filter-income-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
          style={{ height: 38, width: "auto" }}
        >
          <option value="all">All Inflow Statuses</option>
          <option value="received">Received (Cleared)</option>
          <option value="pending">Pending Invoices</option>
        </select>
      </div>

      {/* Incomes Table */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 18px" }}>Source / Milestone</th>
                <th style={{ padding: "14px 16px" }}>Client Name</th>
                <th style={{ padding: "14px 16px" }}>Date</th>
                <th style={{ padding: "14px 16px" }}>Received By</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    Loading income records...
                  </td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    No income records found.
                  </td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr
                    key={inc.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>{inc.title}</div>
                      {inc.notes && <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{inc.notes}</div>}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#e2e8f0" }}>
                        <Building2 size={14} color="#94a3b8" />
                        <span>{inc.client_name}</span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      {inc.date}
                    </td>

                    <td style={{ padding: "14px 16px", color: "#e2e8f0" }}>
                      {inc.received_by_name}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => toggleStatus(inc)}
                        title="Click to toggle status"
                        className={`badge ${inc.status === "received" ? "badge-emerald" : "badge-amber"}`}
                        style={{ cursor: "pointer", border: "none" }}
                      >
                        {inc.status === "received" ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Received</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", color: inc.status === "received" ? "#34d399" : "#fbbf24" }}>
                        +{formatCurr(inc.amount)}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          style={{ padding: 6, borderRadius: 6, color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.04)" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(inc.id)}
                          style={{ padding: 6, borderRadius: 6, color: "#fb7185", background: "rgba(244, 63, 94, 0.1)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Income Modal */}
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
            maxWidth: 500,
            background: "#0f172a",
            border: "1px solid var(--border-medium)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                {editingIncome ? "Edit Inflow Entry" : "Record Client Inflow"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Income Description / Milestone *
                </label>
                <input
                  id="input-income-title"
                  type="text"
                  placeholder="e.g. Q4 Platform Retainer Milestone"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Client Name *
                  </label>
                  <input
                    id="input-income-client"
                    type="text"
                    placeholder="e.g. Apex Digital Corp"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Amount *
                  </label>
                  <input
                    id="input-income-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    id="input-income-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Status
                  </label>
                  <select
                    id="input-income-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="received">Received / Cleared</option>
                    <option value="pending">Pending Client Invoice</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Received By Partner
                </label>
                <select
                  id="input-income-partner"
                  value={formData.received_by_user_id}
                  onChange={(e) => setFormData({ ...formData, received_by_user_id: e.target.value })}
                  className="input-field"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Notes (Optional)
                </label>
                <textarea
                  id="input-income-notes"
                  rows={2}
                  placeholder="Wire reference, invoice number, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button id="btn-save-income" type="submit" className="btn-primary">
                  {editingIncome ? "Update Inflow" : "Record Inflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
