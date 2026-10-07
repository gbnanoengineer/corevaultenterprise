"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  KeyRound,
  Building,
  Shield,
  Copy,
  Check,
  Save,
  Users,
  Database,
  Lock
} from "lucide-react";

interface SettingsViewProps {
  currentUser: any;
  onRefreshAuth: () => void;
}

export default function SettingsView({ currentUser, onRefreshAuth }: SettingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [masterRecoveryKey, setMasterRecoveryKey] = useState("");
  const [partners, setPartners] = useState<any[]>([]);

  // Change PIN form
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  const [copiedKey, setCopiedKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        const data = await res.json();
        setOrgName(data.orgName || "");
        setDefaultCurrency(data.defaultCurrency || "USD");
        setMasterRecoveryKey(data.masterRecoveryKey || "");
        setPartners(data.partners || []);
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
          partners,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefreshAuth();
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || !newPin || newPin.length < 4) {
      setPinMessage("Please provide your current PIN and a new 4-6 digit PIN.");
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPin,
          newPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinMessage(data.error || "Failed to update PIN");
      } else {
        setPinMessage("Your PIN was successfully updated!");
        setCurrentPin("");
        setNewPin("");
        setTimeout(() => setPinMessage(""), 3000);
      }
    } catch {
      setPinMessage("Network error updating PIN");
    }
  };

  const handleCopyRecoveryKey = () => {
    navigator.clipboard.writeText(masterRecoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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
          Settings & Partner Access
        </h1>
        <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
          Manage your organization name, currencies, PIN security, and partner profiles.
        </p>
      </div>

      {/* General Settings Form */}
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
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>

        {/* Partner Profiles */}
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", display: "block", marginBottom: 10 }}>
            Partner Profiles
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {partners.map((p, idx) => (
              <div key={p.id} style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: p.avatar_color,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem"
                  }}>
                    {p.display_name.charAt(0)}
                  </div>
                  <div>
                    <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#ffffff" }}>
                      Partner {idx + 1}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                      ID: {p.id}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={p.display_name}
                    onChange={(e) => {
                      const updated = [...partners];
                      updated[idx].display_name = e.target.value;
                      setPartners(updated);
                    }}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Avatar Color
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          const updated = [...partners];
                          updated[idx].avatar_color = col;
                          setPartners(updated);
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: col,
                          border: p.avatar_color === col ? "2px solid #ffffff" : "none",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          {saveSuccess && (
            <span style={{ color: "#34d399", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={16} /> Settings saved successfully!
            </span>
          )}
          <button id="btn-save-settings" type="submit" className="btn-primary" style={{ padding: "9px 20px" }}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Change PIN Card */}
      <form onSubmit={handleChangePin} className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <Lock size={20} color="#fbbf24" />
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Change Your PIN</h2>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
              Updating PIN for {currentUser?.display_name}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Current PIN
            </label>
            <input
              id="input-current-pin"
              type="password"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="input-field"
              placeholder="••••••"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              New 6-Digit PIN
            </label>
            <input
              id="input-update-pin"
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="input-field"
              placeholder="••••••"
              required
            />
          </div>
        </div>

        {pinMessage && (
          <div style={{
            fontSize: "0.82rem",
            color: pinMessage.includes("success") ? "#34d399" : "#fb7185",
            background: pinMessage.includes("success") ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)",
            padding: "8px 12px",
            borderRadius: 8
          }}>
            {pinMessage}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button id="btn-update-pin" type="submit" className="btn-secondary" style={{ padding: "9px 18px" }}>
            Update PIN
          </button>
        </div>
      </form>

      {/* Master Recovery Key Card */}
      <div className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} color="#38bdf8" />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
            Emergency Master Recovery Key
          </h2>
        </div>

        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
          Store this key in your password manager. In the event that either partner forgets their 6-digit PIN, this master key allows an instant PIN reset from the lock screen.
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#080b12",
          border: "1px solid var(--border-medium)",
          borderRadius: 10,
          padding: "10px 16px",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "#38bdf8", fontWeight: 600 }}>
            {masterRecoveryKey}
          </span>
          <button
            id="btn-copy-recovery-key"
            onClick={handleCopyRecoveryKey}
            className="btn-secondary"
            style={{ fontSize: "0.78rem", padding: "6px 12px" }}
          >
            {copiedKey ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copiedKey ? "Copied" : "Copy Key"}</span>
          </button>
        </div>
      </div>

      {/* Docker Storage Status Info */}
      <div className="glass-card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <Database size={22} color="#10b981" />
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
            Self-Hosted Docker Persistent Storage
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
            Database and document assets are persisted in the <code style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>./data/</code> volume mount.
          </div>
        </div>
      </div>
    </div>
  );
}
