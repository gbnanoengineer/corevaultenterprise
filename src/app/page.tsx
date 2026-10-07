"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import PinLogin from "@/components/PinLogin";
import DashboardView from "@/components/DashboardView";
import ExpensesView from "@/components/ExpensesView";
import IncomesView from "@/components/IncomesView";
import SubscriptionsView from "@/components/SubscriptionsView";
import SettlementsView from "@/components/SettlementsView";
import DocumentsView from "@/components/DocumentsView";
import SettingsView from "@/components/SettingsView";

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [orgName, setOrgName] = useState("Acme Core Ventures");
  const [currency, setCurrency] = useState("USD");

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Quick action triggers from dashboard
  const [expenseModalTrigger, setExpenseModalTrigger] = useState(false);
  const [incomeModalTrigger, setIncomeModalTrigger] = useState(false);
  const [subscriptionModalTrigger, setSubscriptionModalTrigger] = useState(false);
  const [uploadModalTrigger, setUploadModalTrigger] = useState(false);

  // Fetch authentication status
  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
      setPartners(data.partners || []);
      if (data.orgName) setOrgName(data.orgName);
      if (data.currency) setCurrency(data.currency);
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
  }, [currentUser, currentTab]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      setCurrentUser(null);
      setCurrentTab("dashboard");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSwitchUser = async (targetUserId: string) => {
    // Log out current session and let user enter PIN for the other partner profile
    await handleLogout();
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

  // If not logged in, render PIN Login screen
  if (!currentUser) {
    return (
      <PinLogin
        partners={partners}
        orgName={orgName}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
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
        partners={partners}
        orgName={orgName}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px", width: "100%", flex: 1 }}>
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
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
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
          {orgName} • ExpenseTracker & AssetVault
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Docker Ready</span>
          <span>•</span>
          <span>SQLite WAL Persistent</span>
          <span>•</span>
          <span style={{ color: "#34d399" }}>Connected</span>
        </div>
      </footer>
    </div>
  );
}
