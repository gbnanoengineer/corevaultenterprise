"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  CreditCard,
  User,
  Calendar,
  Tag,
  CheckCircle,
  X
} from "lucide-react";

interface ExpensesViewProps {
  currentUser: any;
  partners: any[];
  currency: string;
  isAddModalOpenInitially?: boolean;
}

const CATEGORIES = [
  "Software & SaaS",
  "Cloud & Hosting",
  "Hardware & Equipment",
  "Legal & Accounting",
  "Marketing & Ads",
  "Freelancers & Contractors",
  "Meals & Entertainment",
  "Office & Rent",
  "Travel",
  "Utilities",
  "Miscellaneous"
];

const PAYMENT_METHODS = [
  "Company Credit Card",
  "Bank Wire / Transfer",
  "Partner 1 Personal Card",
  "Partner 2 Personal Card",
  "Cash"
];

export default function ExpensesView({
  currentUser,
  partners,
  currency,
  isAddModalOpenInitially = false,
}: ExpensesViewProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPaidBy, setSelectedPaidBy] = useState("all");

  // Modal state
  const [showModal, setShowModal] = useState(isAddModalOpenInitially);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Software & SaaS",
    amount: "",
    currency: currency || "USD",
    date: new Date().toISOString().split("T")[0],
    paid_by_user_id: currentUser?.id || "user_1",
    payment_method: "Company Credit Card",
    split_type: "equal",
    notes: "",
    status: "settled",
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedPaidBy !== "all") params.set("paidBy", selectedPaidBy);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Fetch expenses error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, selectedCategory, selectedPaidBy]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      title: "",
      category: "Software & SaaS",
      amount: "",
      currency: currency || "USD",
      date: new Date().toISOString().split("T")[0],
      paid_by_user_id: currentUser?.id || "user_1",
      payment_method: "Company Credit Card",
      split_type: "equal",
      notes: "",
      status: "settled",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (exp: any) => {
    setEditingExpense(exp);
    setFormData({
      title: exp.title,
      category: exp.category,
      amount: exp.amount.toString(),
      currency: exp.currency || currency || "USD",
      date: exp.date,
      paid_by_user_id: exp.paid_by_user_id,
      payment_method: exp.payment_method,
      split_type: exp.split_type,
      notes: exp.notes || "",
      status: exp.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    try {
      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      console.error("Save expense error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      fetchExpenses();
    } catch (err) {
      console.error("Delete expense error:", err);
    }
  };

  const exportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ["ID", "Title", "Category", "Amount", "Currency", "Date", "Paid By", "Payment Method", "Split Type", "Status", "Notes"];
    const rows = expenses.map((e) => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      e.currency,
      e.date,
      `"${e.paid_by_name}"`,
      `"${e.payment_method}"`,
      e.split_type,
      e.status,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header & Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Expense Management
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Log, track, and split business operating expenditures across partners.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            id="btn-export-expenses-csv"
            onClick={exportCSV}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-add-expense-modal"
            onClick={handleOpenAdd}
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              id="input-search-expenses"
              type="text"
              placeholder="Search expenses, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, height: 38 }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            id="select-filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
            style={{ height: 38, width: "auto", minWidth: 150 }}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Paid By Filter */}
          <select
            id="select-filter-paidby"
            value={selectedPaidBy}
            onChange={(e) => setSelectedPaidBy(e.target.value)}
            className="input-field"
            style={{ height: 38, width: "auto", minWidth: 140 }}
          >
            <option value="all">All Payers</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
        </div>

        {summary && (
          <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Total Filtered: <strong style={{ color: "#ffffff", fontSize: "0.98rem" }}>{formatCurr(summary.overallTotal)}</strong> ({expenses.length} records)
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "14px 18px" }}>Expense Item</th>
                <th style={{ padding: "14px 16px" }}>Category</th>
                <th style={{ padding: "14px 16px" }}>Date</th>
                <th style={{ padding: "14px 16px" }}>Paid By</th>
                <th style={{ padding: "14px 16px" }}>Method & Split</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    No expenses found matching the selected filters.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Title & Notes */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>{exp.title}</div>
                      {exp.notes && (
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 2 }}>
                          {exp.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td style={{ padding: "14px 16px" }}>
                      <span className="badge badge-indigo" style={{ fontSize: "0.72rem" }}>
                        {exp.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {exp.date}
                    </td>

                    {/* Paid By */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: exp.paid_by_color || "#3b82f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#ffffff"
                        }}>
                          {exp.paid_by_name?.charAt(0) || "P"}
                        </div>
                        <span style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>{exp.paid_by_name}</span>
                      </div>
                    </td>

                    {/* Method & Split */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>{exp.payment_method}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {exp.split_type === "equal" ? "Split 50/50" : "100% Company Expense"}
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.98rem", color: "#ffffff" }}>
                        {formatCurr(exp.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          title="Edit"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            color: "var(--text-secondary)",
                            background: "rgba(255, 255, 255, 0.04)"
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            color: "#fb7185",
                            background: "rgba(244, 63, 94, 0.1)"
                          }}
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

      {/* Add / Edit Expense Modal */}
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
            maxWidth: 520,
            background: "#0f172a",
            border: "1px solid var(--border-medium)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
                  <Receipt size={18} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                  {editingExpense ? "Edit Expense Entry" : "Log New Expense"}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Expense Description *
                </label>
                <input
                  id="input-expense-title"
                  type="text"
                  placeholder="e.g. AWS Production Database Cluster"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Amount *
                  </label>
                  <input
                    id="input-expense-amount"
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
                    Category
                  </label>
                  <select
                    id="input-expense-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    id="input-expense-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Paid By Partner *
                  </label>
                  <select
                    id="input-expense-paidby"
                    value={formData.paid_by_user_id}
                    onChange={(e) => setFormData({ ...formData, paid_by_user_id: e.target.value })}
                    className="input-field"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Payment Method
                  </label>
                  <select
                    id="input-expense-payment-method"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input-field"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Settlement Split
                  </label>
                  <select
                    id="input-expense-split"
                    value={formData.split_type}
                    onChange={(e) => setFormData({ ...formData, split_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="equal">50/50 Equal Split between Partners</option>
                    <option value="company">100% Company Account (No Partner Debt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Notes & Details (Optional)
                </label>
                <textarea
                  id="input-expense-notes"
                  rows={2}
                  placeholder="Additional context or invoice reference..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-expense"
                  type="submit"
                  className="btn-primary"
                >
                  {editingExpense ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
