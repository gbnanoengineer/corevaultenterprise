"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AuthView from "@/components/AuthView";
import DashboardView from "@/components/DashboardView";
import ExpensesView from "@/components/ExpensesView";
import IncomesView from "@/components/IncomesView";
import SubscriptionsView from "@/components/SubscriptionsView";
import SettlementsView from "@/components/SettlementsView";
import DocumentsView from "@/components/DocumentsView";
import SettingsView from "@/components/SettingsView";
import { Building, X, ArrowRight } from "lucide-react";

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<any>(null);
  const [orgName, setOrgName] = useState("Acme Core Ventures");
  const [currency, setCurrency] = useState("USD");

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Quick action triggers from dashboard
  const [expenseModalTrigger, setExpenseModalTrigger] = useState(false);
  const [incomeModalTrigger, setIncomeModalTrigger] = useState(false);
  const [subscriptionModalTrigger, setSubscriptionModalTrigger] = useState(false);
  const [uploadModalTrigger, setUploadModalTrigger] = useState(false);

  // Create Organization Modal
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [modalOrgName, setModalOrgName] = useState("");
  const [modalOrgCurrency, setModalOrgCurrency] = useState("USD");
  const [createOrgLoading, setCreateOrgLoading] = useState(false);
  const [createOrgError, setCreateOrgError] = useState("");

  // Fetch authentication & organization status
  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setOrganizations(data.organizations || []);
        setActiveOrganization(data.activeOrganization || null);
        if (data.activeOrganization?.name) setOrgName(data.activeOrganization.name);
        if (data.activeOrganization?.currency) setCurrency(data.activeOrganization.currency);
      } else {
        setCurrentUser(null);
        setOrganizations([]);
        setActiveOrganization(null);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardMetrics();
    }
  }, [currentUser, currentTab, activeOrganization]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      setCurrentUser(null);
      setOrganizations([]);
      setActiveOrganization(null);
      setCurrentTab("dashboard");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await fetch("/api/organizations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      await checkAuth();
    } catch (err) {
      console.error("Switch org error:", err);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateOrgError("");

    if (!modalOrgName.trim()) {
      setCreateOrgError("Please enter an organization name.");
      return;
    }

    setCreateOrgLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modalOrgName.trim(),
          currency: modalOrgCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateOrgError(data.error || "Failed to create organization.");
      } else {
        setCreateOrgModalOpen(false);
        setModalOrgName("");
        await checkAuth();
      }
    } catch {
      setCreateOrgError("Network error creating organization.");
    } finally {
      setCreateOrgLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090d16",
        color: "var(--text-secondary)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>
            Initializing Expense Vault...
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Connecting to local SQLite database</p>
        </div>
      </div>
    );
  }

  // If not logged in, render Email & Password Auth screen (with Single-textbox OTP & Signup)
  if (!currentUser) {
    return (
      <AuthView
        orgName={orgName}
        onLoginSuccess={(user, activeOrg) => {
          setCurrentUser(user);
          if (activeOrg) setActiveOrganization(activeOrg);
          checkAuth();
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#090d16", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setExpenseModalTrigger(false);
          setIncomeModalTrigger(false);
          setSubscriptionModalTrigger(false);
          setUploadModalTrigger(false);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        organizations={organizations}
        activeOrganization={activeOrganization}
        onSwitchOrganization={handleSwitchOrganization}
        onOpenCreateOrgModal={() => setCreateOrgModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="mobile-main-content" style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px", width: "100%", flex: 1 }}>
        {currentTab === "dashboard" && (
          <DashboardView
            data={dashboardData}
            currency={currency}
            onOpenExpenseModal={() => {
              setExpenseModalTrigger(true);
              setCurrentTab("expenses");
            }}
            onOpenIncomeModal={() => {
              setIncomeModalTrigger(true);
              setCurrentTab("income");
            }}
            onOpenSubscriptionModal={() => {
              setSubscriptionModalTrigger(true);
              setCurrentTab("subscriptions");
            }}
            onOpenUploadModal={() => {
              setUploadModalTrigger(true);
              setCurrentTab("documents");
            }}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === "expenses" && (
          <ExpensesView
            currentUser={currentUser}
            partners={partners}
            currency={currency}
            isAddModalOpenInitially={expenseModalTrigger}
          />
        )}

        {currentTab === "income" && (
          <IncomesView
            currentUser={currentUser}
            partners={partners}
            currency={currency}
            isAddModalOpenInitially={incomeModalTrigger}
          />
        )}

        {currentTab === "subscriptions" && (
          <SubscriptionsView
            currency={currency}
            isAddModalOpenInitially={subscriptionModalTrigger}
          />
        )}

        {currentTab === "settlements" && (
          <SettlementsView
            currentUser={currentUser}
            partners={partners}
            currency={currency}
          />
        )}

        {currentTab === "documents" && (
          <DocumentsView
            currentUser={currentUser}
            partners={partners}
            isUploadModalOpenInitially={uploadModalTrigger}
          />
        )}

        {currentTab === "settings" && (
          <SettingsView
            currentUser={currentUser}
            onRefreshAuth={checkAuth}
            onOpenCreateOrgModal={() => setCreateOrgModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="desktop-only" style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "16px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.78rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%"
      }}>
        <div>
          {activeOrganization?.name || orgName} &bull; ExpenseTracker & AssetVault
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Docker Ready</span>
          <span>&bull;</span>
          <span>SQLite WAL Persistent</span>
          <span>&bull;</span>
          <span style={{ color: "#34d399" }}>Connected</span>
        </div>
      </footer>

      {/* Create Organization Modal */}
      {createOrgModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            width: "100%",
            maxWidth: 440,
            background: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 18,
            padding: 28,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            position: "relative"
          }}>
            <button
              onClick={() => setCreateOrgModalOpen(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(99, 102, 241, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Building size={20} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Create New Organization
                </h2>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  Start a new shared budget or project workspace
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateOrganization} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Organization Name
                </label>
                <input
                  id="input-modal-org-name"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Acme Studio, Nexus Ventures"
                  value={modalOrgName}
                  onChange={(e) => setModalOrgName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Default Currency
                </label>
                <select
                  id="select-modal-org-currency"
                  value={modalOrgCurrency}
                  onChange={(e) => setModalOrgCurrency(e.target.value)}
                  className="input-field"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="USD" style={{ background: "#0f172a", color: "#ffffff" }}>USD ($)</option>
                  <option value="EUR" style={{ background: "#0f172a", color: "#ffffff" }}>EUR (€)</option>
                  <option value="GBP" style={{ background: "#0f172a", color: "#ffffff" }}>GBP (£)</option>
                  <option value="CAD" style={{ background: "#0f172a", color: "#ffffff" }}>CAD (C$)</option>
                  <option value="AUD" style={{ background: "#0f172a", color: "#ffffff" }}>AUD (A$)</option>
                  <option value="INR" style={{ background: "#0f172a", color: "#ffffff" }}>INR (₹)</option>
                  <option value="SGD" style={{ background: "#0f172a", color: "#ffffff" }}>SGD (S$)</option>
                  <option value="JPY" style={{ background: "#0f172a", color: "#ffffff" }}>JPY (¥)</option>
                </select>
              </div>

              {createOrgError && (
                <div style={{ fontSize: "0.82rem", color: "#fb7185", background: "rgba(244, 63, 94, 0.1)", padding: "8px 12px", borderRadius: 8 }}>
                  {createOrgError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setCreateOrgModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: "9px 16px" }}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-modal-create-org"
                  type="submit"
                  disabled={createOrgLoading}
                  className="btn-primary"
                  style={{ padding: "9px 20px", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {createOrgLoading ? "Creating..." : "Create Organization"}
                  {!createOrgLoading && <ArrowRight size={15} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
