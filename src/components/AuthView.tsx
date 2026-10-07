"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Layers,
  Send,
  ArrowLeft
} from "lucide-react";

interface AuthViewProps {
  orgName?: string;
  onLoginSuccess: (user: any) => void;
}

type AuthMode = "login" | "signup" | "forgot" | "reset";

export default function AuthView({ orgName = "Acme Core Ventures", onLoginSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [debugToken, setDebugToken] = useState("");

  // Check if URL has ?resetToken=...
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("resetToken");
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setMode("reset");
      }
    }
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
    setDebugToken("");
  };

  // 1. Sign In (Login)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setError("Please provide both your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
      } else {
        onLoginSuccess(data.user);
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Sign Up (Create Account)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        onLoginSuccess(data.user);
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password (Dispatches Resend Email)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process reset request.");
      } else {
        setSuccessMessage(data.message || "Password reset email sent! Check your inbox.");
        if (data.debugToken) {
          setDebugToken(data.debugToken);
          setResetToken(data.debugToken);
        }
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password with Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetToken) {
      setError("Please enter your password reset token.");
      return;
    }

    if (password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password. Token may be expired.");
      } else {
        setSuccessMessage("Password reset successfully! You can now log in with your new password.");
        setPassword("");
        setConfirmPassword("");
        setResetToken("");
        setTimeout(() => {
          setMode("login");
          clearMessages();
        }, 2000);
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 65%, #05070c 100%)",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Ambient background glow accents */}
      <div style={{
        position: "absolute",
        top: "-15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: 440,
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 20,
        padding: "36px 32px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)"
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(99, 102, 241, 0.45)",
            marginBottom: 16
          }}>
            <Layers size={28} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 6px 0" }}>
            ExpenseTracker <span style={{ color: "#818cf8" }}>Vault</span>
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", margin: 0 }}>
            {orgName} &bull; Secure Financial Operations
          </p>
        </div>

        {/* Mode Navigation Tabs (Login vs Signup) */}
        {(mode === "login" || mode === "signup") && (
          <div style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            padding: 4,
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: 24
          }}>
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => { setMode("login"); clearMessages(); }}
              style={{
                flex: 1,
                padding: "9px 0",
                fontSize: "0.88rem",
                fontWeight: mode === "login" ? 700 : 500,
                color: mode === "login" ? "#ffffff" : "var(--text-secondary)",
                background: mode === "login" ? "rgba(99, 102, 241, 0.3)" : "transparent",
                border: mode === "login" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                borderRadius: 9,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Sign In
            </button>
            <button
              id="tab-auth-signup"
              type="button"
              onClick={() => { setMode("signup"); clearMessages(); }}
              style={{
                flex: 1,
                padding: "9px 0",
                fontSize: "0.88rem",
                fontWeight: mode === "signup" ? 700 : 500,
                color: mode === "signup" ? "#ffffff" : "var(--text-secondary)",
                background: mode === "signup" ? "rgba(99, 102, 241, 0.3)" : "transparent",
                border: mode === "signup" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                borderRadius: 9,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Back navigation for forgot/reset modes */}
        {(mode === "forgot" || mode === "reset") && (
          <div style={{ marginBottom: 20 }}>
            <button
              id="btn-back-to-login"
              type="button"
              onClick={() => { setMode("login"); clearMessages(); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "#818cf8",
                fontSize: "0.84rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: 10,
            color: "#fb7185",
            fontSize: "0.84rem",
            marginBottom: 20
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 10,
            color: "#34d399",
            fontSize: "0.84rem",
            marginBottom: 20
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Debug Token banner if in dev or testing */}
        {debugToken && (
          <div style={{
            padding: "12px 14px",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px dashed rgba(56, 189, 248, 0.35)",
            borderRadius: 10,
            fontSize: "0.82rem",
            color: "#38bdf8",
            marginBottom: 20
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Reset Token generated:</div>
            <code style={{ fontSize: "0.78rem", wordBreak: "break-all", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>
              {debugToken}
            </code>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => { setMode("reset"); setResetToken(debugToken); }}
                style={{
                  background: "#38bdf8",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Auto-fill & Reset Now &rarr;
              </button>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 1: SIGN IN -------------------- */}
        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Password
                </label>
                <button
                  id="btn-forgot-password-link"
                  type="button"
                  onClick={() => { setMode("forgot"); clearMessages(); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#818cf8",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              id="btn-auth-submit-login"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: "0.95rem",
                fontWeight: 700,
                marginTop: 6
              }}
            >
              {loading ? "Authenticating..." : "Sign In to Vault"}
              {!loading && <ArrowRight size={17} />}
            </button>

            {/* Quick credentials hint */}
            <div style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 8,
              fontSize: "0.74rem",
              color: "var(--text-muted)",
              textAlign: "center"
            }}>
              <span>Default accounts: </span>
              <strong style={{ color: "#94a3b8" }}>gaurav@acme.com</strong> or{" "}
              <strong style={{ color: "#94a3b8" }}>partner@acme.com</strong> (Pass: <code style={{ color: "#818cf8" }}>password123</code>)
            </div>
          </form>
        )}

        {/* -------------------- VIEW 2: CREATE ACCOUNT (SIGN UP) -------------------- */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-name"
                  type="text"
                  required
                  placeholder="Gaurav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="gaurav@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Password (min 6 characters)
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-signup-password"
                  type="password"
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-signup-confirm-password"
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              id="btn-auth-submit-signup"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: "0.95rem",
                fontWeight: 700,
                marginTop: 6
              }}
            >
              {loading ? "Creating Account..." : "Create Account & Enter"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        )}

        {/* -------------------- VIEW 3: FORGOT PASSWORD (RESEND) -------------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <KeyRound size={20} color="#818cf8" />
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Reset Your Password
                </h2>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                Enter the email address tied to your account. We will send a secure password reset link via <strong>Resend</strong>.
              </p>

              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Account Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-forgot-email"
                  type="email"
                  required
                  placeholder="your-email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              id="btn-auth-send-reset-link"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: "0.95rem",
                fontWeight: 700
              }}
            >
              {loading ? "Dispatching Email..." : "Send Reset Link via Resend"}
              {!loading && <Send size={16} />}
            </button>

            <div style={{ textAlign: "center", marginTop: 4 }}>
              <button
                id="btn-have-token"
                type="button"
                onClick={() => { setMode("reset"); clearMessages(); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Already have a reset token? Enter it here &rarr;
              </button>
            </div>
          </form>
        )}

        {/* -------------------- VIEW 4: RESET PASSWORD WITH TOKEN -------------------- */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={20} color="#34d399" />
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Enter New Password
                </h2>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                Paste the reset token received in your email and choose a new password.
              </p>

              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Reset Token
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-reset-token"
                  type="text"
                  required
                  placeholder="Paste token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.88rem",
                    fontFamily: "monospace",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                New Password (min 6 characters)
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-reset-password"
                  type="password"
                  required
                  placeholder="New secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-reset-confirm-password"
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              id="btn-auth-submit-reset-password"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: "0.95rem",
                fontWeight: 700,
                marginTop: 6
              }}
            >
              {loading ? "Updating Password..." : "Set New Password"}
              {!loading && <CheckCircle2 size={17} />}
            </button>
          </form>
        )}

        {/* Security badge at bottom */}
        <div style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "var(--text-muted)",
          fontSize: "0.74rem"
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Bcrypt Encryption &bull; Resend Auth &bull; Session Cookies</span>
        </div>
      </div>
    </div>
  );
}
