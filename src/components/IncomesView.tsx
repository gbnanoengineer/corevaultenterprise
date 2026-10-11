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
  Building2,
  Filter,
  RotateCcw
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { getDynamicYears, FILTER_MONTHS } from "@/lib/filterConstants";

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

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [serverYears, setServerYears] = useState<string[]>([]);

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
      if (yearFilter !== "all") params.set("year", yearFilter);
      if (monthFilter !== "all") params.set("month", monthFilter);
      if (partnerFilter !== "all") params.set("receivedBy", partnerFilter);

      const res = await fetch(`/api/incomes?${params.toString()}`);
      const data = await res.json();
      setIncomes(data.incomes || []);
      if (data.availableYears) setServerYears(data.availableYears);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Fetch incomes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [search, statusFilter, yearFilter, monthFilter, partnerFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setYearFilter("all");
    setMonthFilter("all");
    setPartnerFilter("all");
  };

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    yearFilter !== "all" ||
    monthFilter !== "all" ||
    partnerFilter !== "all";

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

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`/api/incomes/${deleteConfirmId}`, { method: "DELETE" });
      setDeleteConfirmId(null);
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

  const exportCSV = () => {
    if (incomes.length === 0) return;
    const headers = ["Title", "Client Name", "Amount", "Currency", "Date", "Status", "Received By", "Notes"];
    const rows = incomes.map((i) => [
      `"${(i.title || "").replace(/"/g, '""')}"`,
      `"${(i.client_name || "").replace(/"/g, '""')}"`,
      i.amount,
      i.currency || currency || "USD",
      i.date,
      i.status,
      `"${(i.received_by_name || "").replace(/"/g, '""')}"`,
      `"${(i.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `incomes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dynamicYearOptions = getDynamicYears(incomes, serverYears);

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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            id="btn-export-income-csv"
            onClick={exportCSV}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

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
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="responsive-grid-equal">
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
      <div className="glass-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260, flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", width: "100%", maxWidth: 280, flex: "1 1 180px" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              id="input-search-income"
              type="text"
              placeholder="Search client, milestone, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, height: 40 }}
            />
          </div>

          {/* Year Filter */}
          <select
            id="select-filter-income-year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 110, flex: "1 1 100px" }}
          >
            {dynamicYearOptions.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            id="select-filter-income-month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 120, flex: "1 1 110px" }}
          >
            {FILTER_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Partner Filter */}
          <select
            id="select-filter-income-partner"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 130, flex: "1 1 120px" }}
          >
            <option value="all">All Receivers</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="select-filter-income-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 140, flex: "1 1 130px" }}
          >
            <option value="all">All Inflow Statuses</option>
            <option value="received">Received (Cleared)</option>
            <option value="pending">Pending Invoices</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              id="btn-reset-income-filters"
              onClick={handleResetFilters}
              className="btn-secondary"
              style={{
                height: 40,
                padding: "0 12px",
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "#f87171",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          Filtered: <strong className="tabular-nums" style={{ color: "#ffffff", fontSize: "0.96rem" }}>{incomes.length} records</strong>
        </div>
      </div>

      {/* Incomes Table (Desktop >= 900px) */}
      <div className="desktop-table-container">
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
      </div>

      {/* Incomes Mobile Card List (Visible < 900px) */}
      <div className="mobile-card-list">
        {loading ? (
          <div className="glass-card" style={{ padding: 30, textAlign: "center", color: "var(--text-secondary)" }}>
            Loading income records...
          </div>
        ) : incomes.length === 0 ? (
          <div className="glass-card" style={{ padding: 30, textAlign: "center", color: "var(--text-secondary)" }}>
            No income records found.
          </div>
        ) : (
          incomes.map((inc) => (
            <div
              key={inc.id}
              className="glass-card"
              style={{
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderLeft: `3px solid ${inc.status === "received" ? "#10b981" : "#f59e0b"}`,
              }}
            >
              {/* Row 1: Milestone Title + Amount */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.96rem", color: "#ffffff", lineHeight: 1.3 }}>
                    {inc.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", fontSize: "0.78rem", marginTop: 4 }}>
                    <Building2 size={13} color="#818cf8" />
                    <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{inc.client_name}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: inc.status === "received" ? "#34d399" : "#fbbf24" }}>
                    +{formatCurr(inc.amount)}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {inc.date}
                  </div>
                </div>
              </div>

              {inc.notes && (
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.02)", padding: "6px 10px", borderRadius: 6 }}>
                  {inc.notes}
                </div>
              )}

              {/* Row 2: Metadata Badges + Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => toggleStatus(inc)}
                    className={`badge ${inc.status === "received" ? "badge-emerald" : "badge-amber"}`}
                    style={{ cursor: "pointer", border: "none", fontSize: "0.72rem" }}
                  >
                    {inc.status === "received" ? (
                      <>
                        <CheckCircle2 size={11} />
                        <span>Received</span>
                      </>
                    ) : (
                      <>
                        <Clock size={11} />
                        <span>Pending</span>
                      </>
                    )}
                  </button>

                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    to {inc.received_by_name?.split(" ")[0]}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => handleOpenEdit(inc)}
                    className="btn-secondary"
                    style={{ padding: "6px 10px", fontSize: "0.76rem" }}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      color: "#fb7185",
                      background: "rgba(244, 63, 94, 0.1)",
                      border: "1px solid rgba(244, 63, 94, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.76rem"
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Income Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
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

              <div className="responsive-grid-equal">
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

              <div className="responsive-grid-equal">
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Income Record"
        message="Are you sure you want to delete this recorded income inflow? This will adjust your total revenue and cash balance."
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
