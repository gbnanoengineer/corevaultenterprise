"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  RefreshCw,
  Scale,
  FolderLock,
  Settings,
  LogOut,
  Layers,
  Building,
  ChevronDown,
  Plus,
  Check
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: any;
  organizations: any[];
  activeOrganization: any;
  onSwitchOrganization: (orgId: string) => void;
  onOpenCreateOrgModal: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  currentUser,
  organizations = [],
  activeOrganization,
  onSwitchOrganization,
  onOpenCreateOrgModal,
  onLogout,
}: NavbarProps) {
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "income", label: "Income & Inflows", icon: TrendingUp },
    { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    { id: "settlements", label: "Settlements", icon: Scale },
    { id: "documents", label: "Document Vault", icon: FolderLock },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        {/* Brand & Organization Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
                CoreVault
              </span>
              <span style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
                color: "#38bdf8",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 4,
                border: "1px solid rgba(56, 189, 248, 0.3)"
              }}>
                WORKSPACE OS
              </span>
            </div>

            {/* Organization Dropdown Trigger */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                id="btn-org-switcher"
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: "0.78rem"
                }}
              >
                <Building size={13} color="#818cf8" />
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  {activeOrganization?.name || "My Organization"}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                  ({activeOrganization?.currency || "USD"})
                </span>
                <ChevronDown size={13} color="var(--text-muted)" />
              </button>

              {/* Organization Popover Menu */}
              {showOrgDropdown && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: 260,
                  background: "rgba(15, 23, 42, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: 12,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)",
                  zIndex: 100,
                  padding: "8px 0"
                }}>
                  <div style={{ padding: "8px 14px", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                    Your Organizations
                  </div>

                  {organizations.map((org) => {
                    const isActive = activeOrganization?.id === org.id;
                    return (
                      <button
                        key={org.id}
                        id={`btn-select-org-${org.id}`}
                        onClick={() => {
                          onSwitchOrganization(org.id);
                          setShowOrgDropdown(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 14px",
                          background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          color: "#ffffff",
                          fontSize: "0.84rem",
                          transition: "background 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Building size={15} color={isActive ? "#818cf8" : "#64748b"} />
                          <div>
                            <div style={{ fontWeight: isActive ? 700 : 500 }}>{org.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              {org.currency} &bull; {org.role || "member"}
                            </div>
                          </div>
                        </div>
                        {isActive && <Check size={15} color="#818cf8" />}
                      </button>
                    );
                  })}

                  <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "6px 0" }} />

                  <button
                    id="btn-create-new-org-nav"
                    onClick={() => {
                      setShowOrgDropdown(false);
                      onOpenCreateOrgModal();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "#38bdf8",
                      fontSize: "0.82rem",
                      fontWeight: 600
                    }}
                  >
                    <Plus size={15} />
                    <span>Create New Organization</span>
                  </button>
                </div>
              )}
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
                {currentUser?.email || "Active"}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={onLogout}
            title="Sign Out"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              color: "#fb7185",
              cursor: "pointer"
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
