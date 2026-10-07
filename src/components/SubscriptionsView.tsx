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
  X
} from "lucide-react";

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
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

      {/* Burn Rate Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
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

      {/* Subscriptions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {subscriptions.map((sub) => {
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

      {/* Add / Edit Subscription Modal */}
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
                {editingSub ? "Edit Subscription" : "Add Recurring SaaS Tool"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
    </div>
  );
}
