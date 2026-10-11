"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Plus,
  ExternalLink,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Search,
  Filter,
  Download,
  RotateCcw
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { BrandIcon, AI_SUBSCRIPTION_PRESETS } from "./AiBrandIcons";

interface SubscriptionsViewProps {
  currency: string;
  isAddModalOpenInitially?: boolean;
}

export default function SubscriptionsView({
  currency,
  isAddModalOpenInitially = false,
}: SubscriptionsViewProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(isAddModalOpenInitially);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Dev Tools",
    cost: "",
    currency: currency || "USD",
    billing_cycle: "monthly",
    next_renewal_date: new Date().toISOString().split("T")[0],
    payment_method: "Company Credit Card",
    auto_renew: 1,
    active: 1,
    notes: "",
    url: "",
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({
      name: "",
      category: "Dev Tools",
      cost: "",
      currency: currency || "USD",
      billing_cycle: "monthly",
      next_renewal_date: new Date().toISOString().split("T")[0],
      payment_method: "Company Credit Card",
      auto_renew: 1,
      active: 1,
      notes: "",
      url: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sub: any) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      category: sub.category,
      cost: sub.cost.toString(),
      currency: sub.currency || currency || "USD",
      billing_cycle: sub.billing_cycle,
      next_renewal_date: sub.next_renewal_date,
      payment_method: sub.payment_method,
      auto_renew: sub.auto_renew,
      active: sub.active,
      notes: sub.notes || "",
      url: sub.url || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cost) return;

    try {
      if (editingSub) {
        await fetch(`/api/subscriptions/${editingSub.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchSubscriptions();
    } catch (err) {
      console.error("Save subscription error:", err);
    }
  };

  const toggleActive = async (sub: any) => {
    try {
      await fetch(`/api/subscriptions/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sub,
          active: sub.active ? 0 : 1,
        }),
      });
      fetchSubscriptions();
    } catch (err) {
      console.error("Toggle subscription active error:", err);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`/api/subscriptions/${deleteConfirmId}`, { method: "DELETE" });
      setDeleteConfirmId(null);
      fetchSubscriptions();
    } catch (err) {
      console.error("Delete subscription error:", err);
    }
  };

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const getDaysUntilRenewal = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(dateStr);
    const diffTime = renewal.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const categoriesList = Array.from(new Set(subscriptions.map((s) => s.category).filter(Boolean)));

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (sub.name || "").toLowerCase().includes(q);
      const matchCategory = (sub.category || "").toLowerCase().includes(q);
      const matchPayment = (sub.payment_method || "").toLowerCase().includes(q);
      const matchNotes = (sub.notes || "").toLowerCase().includes(q);
      if (!matchName && !matchCategory && !matchPayment && !matchNotes) return false;
    }
    if (categoryFilter !== "all" && sub.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (cycleFilter !== "all" && sub.billing_cycle?.toLowerCase() !== cycleFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter === "active" && !sub.active) return false;
    if (statusFilter === "paused" && sub.active) return false;
    if (statusFilter === "renewing_soon") {
      const days = getDaysUntilRenewal(sub.next_renewal_date);
      if (days < 0 || days > 7) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setCycleFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = Boolean(search) || categoryFilter !== "all" || cycleFilter !== "all" || statusFilter !== "all";

  const exportCSV = () => {
    if (subscriptions.length === 0) return;
    const headers = ["Tool Name", "Category", "Cost", "Currency", "Billing Cycle", "Next Renewal", "Payment Method", "Status", "Notes", "URL"];
    const rows = filteredSubscriptions.map((s) => [
      `"${(s.name || "").replace(/"/g, '""')}"`,
      `"${(s.category || "").replace(/"/g, '""')}"`,
      s.cost,
      s.currency || currency || "USD",
      s.billing_cycle,
      s.next_renewal_date,
      `"${(s.payment_method || "").replace(/"/g, '""')}"`,
      s.active ? "Active" : "Paused",
      `"${(s.notes || "").replace(/"/g, '""')}"`,
      `"${(s.url || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscriptions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            SaaS & Infrastructure Subscriptions
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Monitor recurring software tools, infrastructure costs, and renewal alerts.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            id="btn-export-sub-csv"
            onClick={exportCSV}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-add-subscription-modal"
            onClick={handleOpenAdd}
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Plus size={16} />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* Burn Rate Cards */}
      {summary && (
        <div className="responsive-stats-grid">
          <div className="glass-card" style={{ padding: 18, borderLeft: "4px solid #38bdf8" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Monthly Recurring Burn</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>
              {formatCurr(summary.monthlyBurn)}<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/mo</span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: 18, borderLeft: "4px solid #818cf8" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Annualized Burn Run-Rate</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#818cf8", marginTop: 4 }}>
              {formatCurr(summary.monthlyBurn * 12)}<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/yr</span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: 18, borderLeft: "4px solid #34d399" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Active Tools Count</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: 4 }}>
              {summary.activeCount} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>of {summary.totalSubscriptions} tools</span>
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
              id="input-search-subscriptions"
              type="text"
              placeholder="Search tool name, category, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, height: 40 }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            id="select-filter-sub-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 140, flex: "1 1 120px" }}
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat: any) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Billing Cycle Filter */}
          <select
            id="select-filter-sub-cycle"
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 130, flex: "1 1 110px" }}
          >
            <option value="all">All Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>

          {/* Status Filter */}
          <select
            id="select-filter-sub-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 140, flex: "1 1 120px" }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="renewing_soon">Renewing Soon (&le; 7d)</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              id="btn-reset-sub-filters"
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
          Showing: <strong className="tabular-nums" style={{ color: "#ffffff", fontSize: "0.96rem" }}>{filteredSubscriptions.length}</strong> of {subscriptions.length} tools
        </div>
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>No subscriptions match your filters</p>
          <p style={{ fontSize: "0.84rem", margin: "0 0 16px 0" }}>Try adjusting your search query, category, or cycle filters.</p>
          {hasActiveFilters && (
            <button onClick={handleResetFilters} className="btn-secondary" style={{ fontSize: "0.84rem", margin: "0 auto" }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
          {filteredSubscriptions.map((sub) => {
          const daysLeft = getDaysUntilRenewal(sub.next_renewal_date);
          const isUrgent = daysLeft >= 0 && daysLeft <= 7;
          return (
            <div
              key={sub.id}
              className="glass-card"
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: sub.active ? 1 : 0.65,
                border: isUrgent ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <BrandIcon name={sub.name} size={34} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>{sub.name}</h3>
                        {sub.url && (
                          <a href={sub.url} target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)" }}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <span className="badge badge-indigo" style={{ fontSize: "0.68rem", marginTop: 4 }}>
                        {sub.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff" }}>
                      {formatCurr(sub.cost)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      every {sub.billing_cycle}
                    </div>
                  </div>
                </div>

                {sub.notes && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                    {sub.notes}
                  </p>
                )}

                {/* Renewal & Payment Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.78rem", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={13} /> Next Renewal:
                    </span>
                    <span style={{
                      fontWeight: 600,
                      color: isUrgent ? "#fbbf24" : daysLeft < 0 ? "#fb7185" : "#e2e8f0",
                    }}>
                      {sub.next_renewal_date} ({daysLeft >= 0 ? `${daysLeft} days` : "Past due"})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <CreditCard size={13} /> Paid via:
                    </span>
                    <span style={{ color: "#cbd5e1" }}>{sub.payment_method}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => toggleActive(sub)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.76rem",
                    color: sub.active ? "#34d399" : "var(--text-muted)",
                  }}
                >
                  {sub.active ? <CheckCircle2 size={14} /> : <PauseCircle size={14} />}
                  <span>{sub.active ? "Active" : "Paused"}</span>
                </button>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    style={{ padding: 6, borderRadius: 6, color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.04)" }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    style={{ padding: 6, borderRadius: 6, color: "#fb7185", background: "rgba(244, 63, 94, 0.1)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 500 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                {editingSub ? "Edit Subscription" : "Add Recurring SaaS Tool"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Quick AI Presets */}
              {!editingSub && (
                <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: 12, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.74rem", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                    <Sparkles size={13} />
                    <span>Popular AI Subscriptions (1-Click Auto-Fill)</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {AI_SUBSCRIPTION_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            name: preset.name,
                            category: preset.category,
                            cost: preset.cost,
                            billing_cycle: preset.billing_cycle,
                            url: preset.url,
                          });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 10px",
                          borderRadius: 8,
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--border-subtle)",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        <BrandIcon name={preset.name} size={14} />
                        <span>{preset.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Tool / Service Name *
                </label>
                <input
                  id="input-sub-name"
                  type="text"
                  placeholder="e.g. GitHub Enterprise"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="responsive-grid-equal">
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Cost *
                  </label>
                  <input
                    id="input-sub-cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Billing Cycle
                  </label>
                  <select
                    id="input-sub-cycle"
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="input-field"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="responsive-grid-equal">
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Category
                  </label>
                  <input
                    id="input-sub-category"
                    type="text"
                    placeholder="e.g. Hosting, Design, AI"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Next Renewal Date
                  </label>
                  <input
                    id="input-sub-renewal-date"
                    type="date"
                    value={formData.next_renewal_date}
                    onChange={(e) => setFormData({ ...formData, next_renewal_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Payment Method
                </label>
                <input
                  id="input-sub-payment-method"
                  type="text"
                  placeholder="e.g. Company Credit Card, Partner Card"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Dashboard or Portal URL
                </label>
                <input
                  id="input-sub-url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button id="btn-save-sub" type="submit" className="btn-primary">
                  {editingSub ? "Update Subscription" : "Save Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete SaaS Subscription"
        message="Are you sure you want to delete this subscription? This will update your monthly recurring burn rate calculation."
        confirmText="Delete Subscription"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
