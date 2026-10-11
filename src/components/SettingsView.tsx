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
  Plus,
  Send,
  AlertCircle,
  Users,
  CheckCircle2,
  Copy,
  Download,
  HardDrive,
  FileCode,
  UserMinus,
  Trash2
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface SettingsViewProps {
  currentUser: any;
  onRefreshAuth: () => void;
  onOpenCreateOrgModal?: () => void;
}

export default function SettingsView({
  currentUser,
  onRefreshAuth,
  onOpenCreateOrgModal,
}: SettingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Organizations, Members & Invitations
  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");

  // Custom Modal dialog state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirmModal = (props: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }) => {
    setConfirmModalState({
      isOpen: true,
      title: props.title,
      message: props.message,
      confirmText: props.confirmText || "Confirm",
      cancelText: props.cancelText !== undefined ? props.cancelText : "Cancel",
      variant: props.variant || "danger",
      onConfirm: () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        props.onConfirm();
      },
    });
  };

  const showAlertModal = (title: string, message: string, variant: "danger" | "warning" | "info" | "success" = "danger") => {
    setConfirmModalState({
      isOpen: true,
      title,
      message,
      confirmText: "OK",
      cancelText: "",
      variant,
      onConfirm: () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRevokeInvite = (inviteId: string) => {
    showConfirmModal({
      title: "Revoke Team Invitation",
      message: "Are you sure you want to revoke this pending invitation? The invitation link will immediately stop working.",
      confirmText: "Revoke Invite",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/organizations/invite?id=${encodeURIComponent(inviteId)}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to revoke invitation");
          fetchSettingsAndOrg();
        } catch (err: any) {
          showAlertModal("Action Failed", err.message || "Failed to revoke invitation", "danger");
        }
      },
    });
  };

  const handleRemoveMember = (memberUserId: string, memberName: string) => {
    showConfirmModal({
      title: "Remove Team Member",
      message: `Are you sure you want to remove ${memberName} from this organization? They will immediately lose access to all shared expenses, invoices, and documents.`,
      confirmText: "Remove Member",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/organizations/members?userId=${encodeURIComponent(memberUserId)}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to remove member");
          fetchSettingsAndOrg();
        } catch (err: any) {
          showAlertModal("Action Failed", err.message || "Failed to remove member", "danger");
        }
      },
    });
  };

  // Change Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchSettingsAndOrg = async () => {
    try {
      setLoading(true);
      const [settingsRes, orgsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/organizations"),
      ]);

      const settingsData = await settingsRes.json();
      const orgsData = await orgsRes.json();

      setOrgName(settingsData.orgName || "");
      setDefaultCurrency(settingsData.defaultCurrency || "USD");

      if (orgsData.activeOrganization) {
        setActiveOrg(orgsData.activeOrganization);
        setMembers(orgsData.members || []);
        setInvitations(orgsData.invitations || []);
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndOrg();
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
      fetchSettingsAndOrg();
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSuccess("");
    setInviteError("");
    setGeneratedInviteLink("");

    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch("/api/organizations/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrg?.id,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invitation.");
      } else {
        setInviteSuccess(data.message || `Invitation sent to ${inviteEmail}!`);
        if (data.token) {
          const origin = window.location.origin;
          setGeneratedInviteLink(`${origin}/?inviteToken=${data.token}`);
        }
        setInviteEmail("");
      }
    } catch {
      setInviteError("Network error while sending invitation.");
    } finally {
      setInviteLoading(false);
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
          Settings & Organization Workspace
        </h1>
        <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
          Manage your organization name, team invitations, security credentials, and storage engines.
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

      {/* Organization Members & Team Invitations Card */}
      <div className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={20} color="#34d399" />
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
                Organization Team & Invitations
              </h2>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                Active: <strong>{activeOrg?.name || orgName}</strong>
              </span>
            </div>
          </div>

          {onOpenCreateOrgModal && (
            <button
              id="btn-create-another-org"
              type="button"
              onClick={onOpenCreateOrgModal}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} />
              <span>+ Create Another Organization</span>
            </button>
          )}
        </div>

        {/* Invite Colleague Form */}
        <form onSubmit={handleSendInvite} style={{
          display: "flex",
          gap: 12,
          background: "rgba(255, 255, 255, 0.03)",
          padding: 16,
          borderRadius: 12,
          border: "1px solid var(--border-subtle)",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Invite Colleague by Email (Dispatches via Resend)
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="#64748b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                id="input-invite-email"
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div style={{ width: 130 }}>
            <label style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input-field"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            id="btn-send-invite"
            type="submit"
            disabled={inviteLoading}
            className="btn-primary"
            style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 6 }}
          >
            {inviteLoading ? "Sending..." : "Send Invite"}
            {!inviteLoading && <Send size={15} />}
          </button>
        </form>

        {inviteError && (
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
            <span>{inviteError}</span>
          </div>
        )}

        {inviteSuccess && (
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
            <CheckCircle2 size={15} />
            <span>{inviteSuccess}</span>
          </div>
        )}

        {generatedInviteLink && (
          <div style={{
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px dashed rgba(56, 189, 248, 0.35)",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "0.74rem", color: "#38bdf8", display: "block", fontWeight: 600 }}>1-Click Invite Link:</span>
              <code style={{ fontSize: "0.78rem", color: "#e2e8f0" }}>{generatedInviteLink}</code>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedInviteLink);
                setInviteLinkCopied(true);
                setTimeout(() => setInviteLinkCopied(false), 2000);
              }}
              className="btn-secondary"
              style={{ fontSize: "0.76rem", padding: "6px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
            >
              {inviteLinkCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              <span>{inviteLinkCopied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>
        )}

        {/* Current Members List */}
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Current Members ({members.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "10px 14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: m.avatar_color || "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#ffffff"
                  }}>
                    {m.display_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
                      {m.display_name} {m.id === currentUser?.id ? "(You)" : ""}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      {m.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: m.role === "owner" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    color: m.role === "owner" ? "#818cf8" : "var(--text-secondary)",
                    border: m.role === "owner" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid var(--border-subtle)"
                  }}>
                    {m.role}
                  </span>

                  {/* Admin can remove members (except owner or self) */}
                  {m.id !== currentUser?.id && m.role !== "owner" && (activeOrg?.role === "owner" || activeOrg?.role === "admin") && (
                    <button
                      id={`btn-remove-member-${m.id}`}
                      onClick={() => handleRemoveMember(m.id, m.display_name)}
                      title={`Remove ${m.display_name} from organization`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "rgba(244, 63, 94, 0.1)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                        color: "#fb7185",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <UserMinus size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations Section */}
        {invitations.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Pending Invitations ({invitations.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(255, 255, 255, 0.14)",
                    borderRadius: 10,
                    padding: "10px 14px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#fbbf24",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Mail size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
                        {inv.invitee_email}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Role: {inv.role} &bull; Expires: {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.72rem", color: "#fbbf24", background: "rgba(245, 158, 11, 0.1)", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(245, 158, 11, 0.25)", textTransform: "uppercase", fontWeight: 700 }}>
                      Pending
                    </span>
                    <button
                      id={`btn-revoke-invite-${inv.id}`}
                      onClick={() => handleRevokeInvite(inv.id)}
                      title="Revoke this invitation"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "rgba(244, 63, 94, 0.1)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                        color: "#fb7185",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Organization Settings */}
      <form onSubmit={handleSaveGeneral} className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <Building size={20} color="#818cf8" />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>Organization & Currencies</h2>
        </div>

        <div className="responsive-grid-2col">
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

        <div className="responsive-grid-3col">
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

      {/* Data Export & Offline Archival */}
      <div className="glass-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
          <HardDrive size={20} color="#818cf8" />
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              Data Export & Offline Archival
            </h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Download complete database snapshots or SQL schemas for offline backup
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <a
            href="/api/admin/database?action=download_sql"
            download
            className="btn-secondary"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              color: "#38bdf8",
              borderColor: "rgba(56, 189, 248, 0.3)",
              background: "rgba(56, 189, 248, 0.05)"
            }}
          >
            <FileCode size={16} />
            <span>Export SQL Dump (.sql)</span>
          </a>

          <a
            href="/api/admin/database?action=download_db"
            download
            className="btn-secondary"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none"
            }}
          >
            <Download size={16} />
            <span>Download Database (.db)</span>
          </a>
        </div>
      </div>

      {/* Custom Confirmation / Alert Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        variant={confirmModalState.variant}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
