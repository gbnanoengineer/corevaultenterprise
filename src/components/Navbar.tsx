"use client";

import React from "react";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  RefreshCw,
  Scale,
  FolderLock,
  Settings,
  LogOut,
  Shield,
  Layers
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: any;
  orgName: string;
  onLogout: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  currentUser,
  orgName,
  onLogout,
}: NavbarProps) {
  const tabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "income", label: "Income & Inflows", icon: TrendingUp },
    { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    { id: "settlements", label: "Settlements", icon: Scale },
    { id: "documents", label: "Document Vault", icon: FolderLock },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header style={{
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(9, 13, 22, 0.85)",
      backdropFilter: "blur(20px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "0 24px"
    }}>
      <div style={{
        maxWidth: 1440,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 68
      }}>
        {/* Brand & Organization */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)"
          }}>
            <Layers size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: "1.08rem", letterSpacing: "-0.01em", color: "#ffffff" }}>
                ExpenseTracker
              </span>
              <span style={{
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                border: "1px solid rgba(99, 102, 241, 0.3)"
              }}>
                VAULT
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{orgName}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ color: "#34d399", fontSize: "0.72rem" }}>Self-Hosted Docker</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: "0.88rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  border: isActive ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                  transition: "all 0.18s ease"
                }}
              >
                <Icon size={16} color={isActive ? "#818cf8" : "currentColor"} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Active User Chip */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "5px 14px 5px 6px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 30
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: currentUser?.avatar_color || "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#ffffff"
            }}>
              {currentUser?.display_name?.charAt(0) || "U"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.2 }}>
                {currentUser?.display_name || "User"}
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                {currentUser?.email || currentUser?.role || "Active Account"}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={onLogout}
            title="Lock & Sign Out"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              color: "#fb7185"
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
