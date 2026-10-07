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
  Layers,
  Send,
  ArrowLeft,
  Building,
  RotateCw,
  Sparkles
} from "lucide-react";

interface AuthViewProps {
  orgName?: string;
  onLoginSuccess: (user: any, activeOrg?: any) => void;
}

type AuthStep =
  | "email_entry"          // Single email input step
  | "login_password"       // Existing user: enter password
  | "login_otp"            // Existing user: enter OTP to log in
  | "signup_otp"           // New user: verify email with OTP
  | "signup_details"       // New user: set name and password
  | "reset_password_otp"   // Forgot password: enter OTP + new password
  | "create_organization"; // Post-registration: create company/organization

export default function AuthView({ orgName = "Acme Core Ventures", onLoginSuccess }: AuthViewProps) {
  const [step, setStep] = useState<AuthStep>("email_entry");

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  // Organization creation state
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCurrency, setNewOrgCurrency] = useState("USD");
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  // Invite token if present in URL
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitedOrgName, setInvitedOrgName] = useState<string>("");
  const [isEmailLocked, setIsEmailLocked] = useState(false);

  // Loading & feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [debugOtp, setDebugOtp] = useState("");

  // Check URL params on mount (?inviteToken=... or ?resetToken=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("inviteToken");
      if (token) {
        setInviteToken(token);
        // Automatically retrieve invited email, lock email, and dispatch OTP for new users
        fetch(`/api/organizations/invite?token=${encodeURIComponent(token)}&autoSend=true`)
          .then((res) => res.json())
          .then((data) => {
            if (data.valid && data.email) {
              setEmail(data.email);
              setIsEmailLocked(true);
              if (data.orgName) setInvitedOrgName(data.orgName);
              if (data.userExists) {
                setStep("login_password");
                setSuccessMessage(`You've been invited to join ${data.orgName}! Enter your password to accept.`);
              } else {
                setStep("signup_otp");
                setSuccessMessage(`Welcome! You've been invited to join ${data.orgName}. We dispatched a 6-digit verification code to ${data.email}.`);
                if (data.debugOtp) {
                  setDebugOtp(data.debugOtp);
                  setOtp(data.debugOtp);
                }
              }
            } else if (data.error) {
              setError(data.error);
            }
          })
          .catch((err) => console.warn("Failed to load invitation info:", err));
      }
    }
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
    setDebugOtp("");
  };

  // STEP 1: Single unified email submit
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to check email.");
        return;
      }

      if (data.exists) {
        // Existing user -> Move to password login
        setStep("login_password");
      } else {
        // New user -> OTP was dispatched by check-email route
        setStep("signup_otp");
        setSuccessMessage(`We sent a 6-digit verification code to ${cleanEmail} via Resend.`);
        if (data.debugOtp) {
          setDebugOtp(data.debugOtp);
          setOtp(data.debugOtp);
        }
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Login with Password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!password) {
      setError("Please enter your password.");
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
        setError(data.error || "Incorrect password.");
      } else {
        if (inviteToken) {
          // Auto-accept invitation if logged in via invite link
          await fetch("/api/organizations/accept-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: inviteToken }),
          });
        }

        if (data.needsOrgCreation) {
          setRegisteredUser(data.user);
          setStep("create_organization");
        } else {
          onLoginSuccess(data.user, data.activeOrganization);
        }
      }
    } catch {
      setError("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  // Request OTP for Signup, Login, or Reset Password
  const handleRequestOtp = async (purpose: "signup" | "login" | "reset_password") => {
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), purpose }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send verification code.");
      } else {
        setSuccessMessage(data.message || `Code sent to ${email}.`);
        if (data.debugOtp) {
          setDebugOtp(data.debugOtp);
          setOtp(data.debugOtp);
        }
        if (purpose === "login") {
          setStep("login_otp");
        } else {
          setStep("reset_password_otp");
        }
      }
    } catch {
      setError("Network error sending code.");
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP for Login (Passwordless)
  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid verification code.");
      } else {
        if (inviteToken) {
          await fetch("/api/organizations/accept-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: inviteToken }),
          });
        }
        onLoginSuccess(data.user);
      }
    } catch {
      setError("Network error during verification.");
    } finally {
      setLoading(false);
    }
  };

  // Verify Signup OTP
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), purpose: "signup" }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid or expired verification code.");
      } else {
        setSuccessMessage("Email verified! Please enter your name and choose a password.");
        setStep("signup_details");
      }
    } catch {
      setError("Network error verifying code.");
    } finally {
      setLoading(false);
    }
  };

  // Complete Registration with Name & Password
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          otp: otp.trim(),
          inviteToken: inviteToken || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        if (data.needsOrgCreation) {
          setRegisteredUser(data.user);
          setStep("create_organization");
        } else {
          onLoginSuccess(data.user);
        }
      }
    } catch {
      setError("Network error completing registration.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password using OTP
  const handleResetPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!password || password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccessMessage("Password reset successfully! Please sign in with your new password.");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setTimeout(() => {
          setStep("login_password");
          clearMessages();
        }, 1500);
      }
    } catch {
      setError("Network error updating password.");
    } finally {
      setLoading(false);
    }
  };

  // Create Organization (Post-Registration)
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newOrgName.trim()) {
      setError("Please provide an organization name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName.trim(),
          currency: newOrgCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create organization.");
      } else {
        onLoginSuccess(registeredUser, data.organization);
      }
    } catch {
      setError("Network error creating organization.");
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
      {/* Glow ambient background */}
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
        maxWidth: 450,
        background: "rgba(15, 23, 42, 0.82)",
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
            CoreVault <span style={{ color: "#38bdf8" }}>Enterprise</span>
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
            Unified Enterprise Finance, Multi-Tenant Workspaces & Asset Cloud
          </p>

          {inviteToken && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: "0.74rem",
              fontWeight: 600,
              marginTop: 10
            }}>
              <Sparkles size={13} />
              <span>Team Invitation Attached</span>
            </div>
          )}
        </div>

        {/* Invited Organization Welcome Banner */}
        {invitedOrgName && (
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <Building size={20} color="#38bdf8" />
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Workspace Invitation
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
                Accepting invite to join <strong style={{ color: "#38bdf8" }}>{invitedOrgName}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Back navigation button when inside sub-steps */}
        {step !== "email_entry" && step !== "create_organization" && !isEmailLocked && (
          <div style={{ marginBottom: 18 }}>
            <button
              id="btn-back-step"
              type="button"
              onClick={() => { setStep("email_entry"); clearMessages(); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "#818cf8",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0
              }}
            >
              <ArrowLeft size={16} />
              <span>Change Email ({email})</span>
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

        {/* Debug OTP Banner (development mode) */}
        {debugOtp && (
          <div style={{
            padding: "12px 14px",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px dashed rgba(56, 189, 248, 0.35)",
            borderRadius: 10,
            fontSize: "0.82rem",
            color: "#38bdf8",
            marginBottom: 20
          }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Verification Code (Resend OTP):</div>
            <code style={{ fontSize: "1.1rem", letterSpacing: "0.15em", fontWeight: 800 }}>
              {debugOtp}
            </code>
          </div>
        )}

        {/* -------------------- STEP 1: SINGLE EMAIL ENTRY -------------------- */}
        {step === "email_entry" && (
          <form onSubmit={handleEmailContinue} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-unified-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "13px 14px 13px 44px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none"
                  }}
                />
              </div>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 6, margin: "6px 0 0 0" }}>
                Enter your email to sign in or create an account. New users verify via 6-digit OTP.
              </p>
            </div>

            <button
              id="btn-auth-email-continue"
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
                marginTop: 4
              }}
            >
              {loading ? "Checking..." : "Continue with Email"}
              {!loading && <ArrowRight size={17} />}
            </button>

            {/* Default account hint */}
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
              <span>Existing account: </span>
              <strong style={{ color: "#94a3b8" }}>gaurav@acme.com</strong> (Pass: <code style={{ color: "#818cf8" }}>password123</code>)
            </div>
          </form>
        )}

        {/* -------------------- STEP 2A: EXISTING USER -> PASSWORD LOGIN -------------------- */}
        {step === "login_password" && (
          <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Password for {email}
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  placeholder="••••••••"
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
              id="btn-auth-submit-password"
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
              {loading ? "Authenticating..." : "Sign In to Vault"}
              {!loading && <ArrowRight size={17} />}
            </button>

            {/* Alternative options: OTP login & Forgot Password */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingTop: 12,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              textAlign: "center"
            }}>
              <button
                id="btn-switch-login-otp"
                type="button"
                onClick={() => handleRequestOtp("login")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <KeyRound size={14} />
                <span>Sign in with 6-Digit OTP Code instead</span>
              </button>

              <button
                id="btn-switch-forgot-password"
                type="button"
                onClick={() => handleRequestOtp("reset_password")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Forgot password? Reset using OTP
              </button>
            </div>
          </form>
        )}

        {/* -------------------- STEP 2B: EXISTING USER -> OTP LOGIN -------------------- */}
        {step === "login_otp" && (
          <form onSubmit={handleOtpLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ textAlign: "center" }}>
              <KeyRound size={26} color="#38bdf8" style={{ margin: "0 auto 8px auto" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                Enter Login Code
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                We sent a 6-digit code via Resend to <strong>{email}</strong>
              </p>
            </div>

            <div>
              <input
                id="input-auth-login-otp"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1.5px solid rgba(99, 102, 241, 0.4)",
                  borderRadius: 12,
                  color: "#38bdf8",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  letterSpacing: "0.25em",
                  textAlign: "center",
                  outline: "none"
                }}
              />
            </div>

            <button
              id="btn-auth-submit-otp-login"
              type="submit"
              disabled={loading || otp.length !== 6}
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
              {loading ? "Verifying..." : "Verify & Sign In"}
              {!loading && <ArrowRight size={17} />}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <button
                type="button"
                onClick={() => setStep("login_password")}
                style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer" }}
              >
                Use Password instead
              </button>
              <button
                type="button"
                onClick={() => handleRequestOtp("login")}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <RotateCw size={13} /> Resend Code
              </button>
            </div>
          </form>
        )}

        {/* -------------------- STEP 3: NEW USER -> VERIFY SIGNUP OTP -------------------- */}
        {step === "signup_otp" && (
          <form onSubmit={handleVerifySignupOtp} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ textAlign: "center" }}>
              <ShieldCheck size={26} color="#34d399" style={{ margin: "0 auto 8px auto" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                Verify Your Email
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                We sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>

            <div>
              <input
                id="input-auth-signup-otp"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1.5px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: 12,
                  color: "#34d399",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  letterSpacing: "0.25em",
                  textAlign: "center",
                  outline: "none"
                }}
              />
            </div>

            <button
              id="btn-auth-verify-signup-otp"
              type="submit"
              disabled={loading || otp.length !== 6}
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
              {loading ? "Verifying..." : "Verify Code & Continue"}
              {!loading && <ArrowRight size={17} />}
            </button>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => handleRequestOtp("signup")}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <RotateCw size={13} /> Resend verification code
              </button>
            </div>
          </form>
        )}

        {/* -------------------- STEP 4: NEW USER -> SET NAME & PASSWORD -------------------- */}
        {step === "signup_details" && (
          <form onSubmit={handleCompleteSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                Create Your Account
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Email <strong>{email}</strong> verified! Finish setting up your credentials.
              </p>
            </div>

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
                  autoFocus
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
                Create Password (min 6 characters)
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-signup-password"
                  type="password"
                  required
                  placeholder="Choose a strong password"
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
                  placeholder="Re-enter password"
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
              id="btn-auth-complete-registration"
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

        {/* -------------------- STEP 5: RESET PASSWORD USING OTP -------------------- */}
        {step === "reset_password_otp" && (
          <form onSubmit={handleResetPasswordOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                Reset Your Password
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Enter the 6-digit code sent to <strong>{email}</strong> and pick a new password.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                6-Digit Verification Code
              </label>
              <input
                id="input-auth-reset-otp"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1.5px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: 10,
                  color: "#38bdf8",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textAlign: "center",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                New Password (min 6 chars)
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-auth-new-password"
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
                  id="input-auth-new-confirm-password"
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
              disabled={loading || otp.length !== 6}
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
              {loading ? "Updating..." : "Update Password & Sign In"}
              {!loading && <CheckCircle2 size={17} />}
            </button>
          </form>
        )}

        {/* -------------------- STEP 6: CREATE FIRST ORGANIZATION (POST-REGISTER) -------------------- */}
        {step === "create_organization" && (
          <form onSubmit={handleCreateOrg} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ textAlign: "center" }}>
              <Building size={32} color="#818cf8" style={{ margin: "0 auto 8px auto" }} />
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px 0" }}>
                Create Your Organization
              </h2>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                Your account is verified! Name your workspace to start tracking expenses, vault files, and invite members.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Organization / Company Name
              </label>
              <div style={{ position: "relative" }}>
                <Building size={17} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="input-create-org-name"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Apex Ventures, Blue Horizon LLC"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
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
                Default Currency
              </label>
              <select
                id="select-create-org-currency"
                value={newOrgCurrency}
                onChange={(e) => setNewOrgCurrency(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#131b2e",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  colorScheme: "dark"
                }}
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

            <button
              id="btn-submit-create-org"
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
              {loading ? "Creating Organization..." : "Launch Organization Vault"}
              {!loading && <ArrowRight size={17} />}
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
          <span>Resend OTP Engine &bull; Multi-Org Collaboration &bull; Secure Cookies</span>
        </div>
      </div>
    </div>
  );
}
