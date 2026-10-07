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
  Check,
  MoreHorizontal,
  X,
  ChevronRight,
  Database,
  CreditCard,
  User
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const primaryTabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "income", label: "Income", icon: TrendingUp },
    { id: "documents", label: "Vault", icon: FolderLock },
  ];

  const secondaryTabs = [
    { id: "subscriptions", label: "Subscriptions & SaaS", icon: RefreshCw, desc: "Recurring software & burn rate" },
    { id: "settlements", label: "Partner Settlements", icon: Scale, desc: "Expense splits & ledger balance" },
    { id: "settings", label: "Settings & System", icon: Settings, desc: "Organization details & database dump" },
  ];

  const allTabs = [
    ...primaryTabs,
    { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    { id: "settlements", label: "Settlements", icon: Scale },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isMoreActive = ["subscriptions", "settlements", "settings"].includes(currentTab);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  return (
    <>
      {/* =========================================================================
          DESKTOP TOP NAVBAR (Visible >= 900px)
         ========================================================================= */}
      <header
        className="desktop-only"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(9, 13, 22, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "0 24px"
        }}
      >
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
                    width: 270,
                    background: "rgba(15, 23, 42, 0.98)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
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

          {/* Navigation Tabs (Desktop) */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {allTabs.map((tab) => {
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

      {/* =========================================================================
          NATIVE MOBILE TOP APP BAR (Visible < 900px)
         ========================================================================= */}
      <header
        className="mobile-only"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(9, 13, 22, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        {/* Brand Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 14px rgba(99, 102, 241, 0.4)"
          }}>
            <Layers size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "#ffffff", letterSpacing: "-0.01em" }}>
                CoreVault
              </span>
              <span style={{
                background: "rgba(99, 102, 241, 0.2)",
                color: "#38bdf8",
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 4,
                border: "1px solid rgba(56, 189, 248, 0.25)"
              }}>
                ENTERPRISE
              </span>
            </div>
          </div>
        </div>

        {/* Right Action: Org Switcher Pill + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            id="btn-mobile-org-pill"
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-medium)",
              padding: "5px 10px",
              borderRadius: 20,
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 600,
              maxWidth: 140,
            }}
          >
            <Building size={12} color="#818cf8" />
            <span style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {activeOrganization?.name || "Workspace"}
            </span>
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>

          {/* User Avatar Circle */}
          <button
            id="btn-mobile-user-avatar"
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: currentUser?.avatar_color || "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#ffffff",
              border: "1.5px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            {currentUser?.display_name?.charAt(0) || "U"}
          </button>
        </div>
      </header>

      {/* =========================================================================
          NATIVE MOBILE FIXED BOTTOM NAVIGATION BAR (Visible < 900px)
         ========================================================================= */}
      <nav
        className="mobile-only"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: "rgba(10, 15, 28, 0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: 6,
          paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
          boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center"
        }}
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`btn-bottom-nav-${tab.id}`}
              onClick={() => {
                setMobileDrawerOpen(false);
                setCurrentTab(tab.id);
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "4px 0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#38bdf8" : "var(--text-muted)",
                transition: "all 0.18s ease",
                position: "relative"
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: -6,
                  width: 24,
                  height: 3,
                  borderRadius: "0 0 3px 3px",
                  background: "linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)",
                  boxShadow: "0 2px 8px rgba(56, 189, 248, 0.6)"
                }} />
              )}
              <div style={{
                width: 32,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive ? "rgba(56, 189, 248, 0.12)" : "transparent",
                transition: "all 0.18s ease"
              }}>
                <Icon size={19} color={isActive ? "#38bdf8" : "currentColor"} />
              </div>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.01em",
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Touch Button */}
        <button
          id="btn-bottom-nav-more"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "4px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: isMoreActive || mobileDrawerOpen ? "#38bdf8" : "var(--text-muted)",
            transition: "all 0.18s ease",
            position: "relative"
          }}
        >
          {(isMoreActive || mobileDrawerOpen) && (
            <div style={{
              position: "absolute",
              top: -6,
              width: 24,
              height: 3,
              borderRadius: "0 0 3px 3px",
              background: "linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)",
              boxShadow: "0 2px 8px rgba(56, 189, 248, 0.6)"
            }} />
          )}
          <div style={{
            width: 32,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isMoreActive || mobileDrawerOpen ? "rgba(56, 189, 248, 0.12)" : "transparent",
            transition: "all 0.18s ease"
          }}>
            <MoreHorizontal size={19} color={isMoreActive || mobileDrawerOpen ? "#38bdf8" : "currentColor"} />
          </div>
          <span style={{
            fontSize: "0.68rem",
            fontWeight: isMoreActive || mobileDrawerOpen ? 700 : 500,
            letterSpacing: "-0.01em",
          }}>
            More
          </span>
        </button>
      </nav>

      {/* =========================================================================
          NATIVE MOBILE SLIDE-UP BOTTOM SHEET / DRAWER (Visible on More/Org click)
         ========================================================================= */}
      {mobileDrawerOpen && (
        <div
          className="mobile-only"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileDrawerOpen(false);
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              background: "#0c1222",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "24px 24px 0 0",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "16px 20px calc(24px + env(safe-area-inset-bottom, 16px)) 20px",
              boxShadow: "0 -20px 50px rgba(0, 0, 0, 0.8)",
              position: "relative"
            }}
          >
            {/* Grab Handle */}
            <div style={{
              width: 38,
              height: 4,
              borderRadius: 9999,
              background: "rgba(255, 255, 255, 0.25)",
              margin: "0 auto 16px auto"
            }} />

            {/* Header / User Card */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: currentUser?.avatar_color || "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#ffffff"
                }}>
                  {currentUser?.display_name?.charAt(0) || "U"}
                </div>
                <div>
                  <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#ffffff" }}>
                    {currentUser?.display_name || "User"}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              <button
                id="btn-close-mobile-drawer"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Secondary Navigation Features */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 8 }}>
                Extended Workspaces
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`btn-mobile-sheet-${tab.id}`}
                      onClick={() => {
                        setCurrentTab(tab.id);
                        setMobileDrawerOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: isActive ? "rgba(99, 102, 241, 0.16)" : "rgba(255, 255, 255, 0.03)",
                        border: isActive ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isActive ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive ? "#818cf8" : "var(--text-secondary)"
                        }}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: isActive ? "#ffffff" : "#e2e8f0" }}>
                            {tab.label}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {tab.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Organizations Management Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8
              }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Switch Organization
                </span>
                <span style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 600 }}>
                  Active: {activeOrganization?.name}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {organizations.map((org) => {
                  const isActive = activeOrganization?.id === org.id;
                  return (
                    <button
                      key={org.id}
                      id={`btn-mobile-select-org-${org.id}`}
                      onClick={() => {
                        onSwitchOrganization(org.id);
                        setMobileDrawerOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: isActive ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        border: isActive ? "1px solid rgba(56, 189, 248, 0.35)" : "1px solid rgba(255, 255, 255, 0.05)",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Building size={16} color={isActive ? "#38bdf8" : "#64748b"} />
                        <div>
                          <div style={{ fontSize: "0.84rem", fontWeight: isActive ? 700 : 500, color: "#ffffff" }}>
                            {org.name}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                            {org.currency} &bull; {org.role || "member"}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check size={16} color="#38bdf8" />}
                    </button>
                  );
                })}

                <button
                  id="btn-mobile-create-org"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenCreateOrgModal();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px dashed rgba(56, 189, 248, 0.3)",
                    color: "#38bdf8",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 4
                  }}
                >
                  <Plus size={15} />
                  <span>Create New Organization</span>
                </button>
              </div>
            </div>

            {/* Logout Action */}
            <button
              id="btn-mobile-logout"
              onClick={() => {
                setMobileDrawerOpen(false);
                onLogout();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px",
                borderRadius: 12,
                background: "rgba(244, 63, 94, 0.12)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#fb7185",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <LogOut size={16} />
              <span>Sign Out of CoreVault</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
