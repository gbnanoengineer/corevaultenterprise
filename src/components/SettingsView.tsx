"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Shield,
  Check,
  Save,
  Database,
  Lock,
  Mail,
  User,
  KeyRound,
  Send,
  AlertCircle
} from "lucide-react";

interface SettingsViewProps {
  currentUser: any;
  onRefreshAuth: () => void;
}

export default function SettingsView({ currentUser, onRefreshAuth }: SettingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        const data = await res.json();
        setOrgName(data.orgName || "");
        setDefaultCurrency(data.defaultCurrency || "USD");
      } catch (err) {
        console.error("Fetch settings error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          defaultCurrency,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefreshAuth();
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Please enter your current password and a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
      } else {
        setPasswordMessage("Your password was updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordMessage(""), 3500);
      }
    } catch {
      setPasswordError("Network error while updating password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
          Settings & Account Security
        </h1>
        <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
          Manage your organization name, default currency, authentication credentials, and cloud storage engine.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <User size={20} color="#818cf8" />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>My Account Profile</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255, 255, 255, 0.03)", padding: 16, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: currentUser?.avatar_color || "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "#ffffff"
          }}>
            {currentUser?.display_name?.charAt(0) || "U"}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
                {currentUser?.display_name || "User"}
              </span>
              <span style={{
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                textTransform: "uppercase"
              }}>
                {currentUser?.role || "Member"}
              </span>
            </div>
            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 2 }}>
              {currentUser?.email || "No email assigned"}
            </div>
          </div>
        </div>
      </div>

      {/* General Organization Settings */}
      <form onSubmit={handleSaveGeneral} className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <Building size={20} color="#818cf8" />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Organization & Currencies</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Organization / Company Name
            </label>
            <input
              id="input-settings-org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="input-field"
              placeholder="e.g. Acme Core Ventures"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Default Currency
            </label>
            <select
              id="select-settings-currency"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="input-field"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="INR">INR (₹)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          {saveSuccess && (
            <span style={{ color: "#34d399", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={16} /> Organization settings saved!
            </span>
          )}
          <button id="btn-save-settings" type="submit" className="btn-primary" style={{ padding: "9px 20px" }}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Change Password Card */}
      <form onSubmit={handleChangePassword} className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <Lock size={20} color="#fbbf24" />
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Change Account Password</h2>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
              Ensure your account is protected with a strong, unique password
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Current Password
            </label>
            <input
              id="input-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              New Password (min 6 chars)
            </label>
            <input
              id="input-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Confirm New Password
            </label>
            <input
              id="input-confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {passwordError && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.82rem",
            color: "#fb7185",
            background: "rgba(244, 63, 94, 0.1)",
            padding: "8px 12px",
            borderRadius: 8
          }}>
            <AlertCircle size={15} />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordMessage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.82rem",
            color: "#34d399",
            background: "rgba(16, 185, 129, 0.1)",
            padding: "8px 12px",
            borderRadius: 8
          }}>
            <Check size={15} />
            <span>{passwordMessage}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            id="btn-update-password"
            type="submit"
            disabled={passwordLoading}
            className="btn-secondary"
            style={{ padding: "9px 18px" }}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* Resend Email Configuration Card */}
      <div className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <Mail size={20} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
              Resend Transactional Email Engine
            </h2>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
              Powers password recovery, verification emails, and vault activity notifications
            </span>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 14, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block" }}>Provider</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>Resend.com API</span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 14, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block" }}>Sender Address</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#38bdf8" }}>
              no-reply@jioratech.com
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Buckets, Compression & Cleanup Card */}
      <div className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <Database size={20} color="#38bdf8" />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
            Cloud Storage Buckets & Asset Engine
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Cloud Bucket Status */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>S3-Compatible Bucket</span>
              <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>
                Connected
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Active storage bucket: <code style={{ color: "#38bdf8" }}>expanse</code>. Assets uploaded to the Document Vault are mirrored directly to the S3 bucket.
            </p>
          </div>

          {/* Retention & Expiry */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>File Auto-Expiry Engine</span>
              <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>Active</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Upload files with custom retention periods (24 hours, 7 days, 30 days, 90 days). Expired files are automatically purged from both the S3 bucket and disk storage.
            </p>
          </div>
        </div>

        {/* On-Delete Cleanup Policy */}
        <div style={{
          background: "rgba(16, 185, 129, 0.06)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          alignItems: "flex-start",
          gap: 12
        }}>
          <Check size={18} color="#34d399" style={{ marginTop: 2 }} />
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
              Automated Cascading On-Delete Cleanup (Active)
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
              When a document, receipt, or folder is deleted, the system automatically purges the corresponding physical files and subfolders from both the S3 cloud storage bucket and host disk to prevent orphaned files or runaway bucket costs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
