"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight, RefreshCcw, CheckCircle2 } from "lucide-react";

interface PinLoginProps {
  partners: any[];
  orgName: string;
  onLoginSuccess: (user: any) => void;
}

export default function PinLogin({ partners, orgName, onLoginSuccess }: PinLoginProps) {
  const [selectedUser, setSelectedUser] = useState<any>(partners[0] || null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPin, setNewPin] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");

  useEffect(() => {
    if (!selectedUser && partners.length > 0) {
      setSelectedUser(partners[0]);
    }
  }, [partners, selectedUser]);

  // Handle physical keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showRecovery) return;
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && pin.length >= 4) {
        submitPin(pin);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, selectedUser, showRecovery]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError("");
      if (nextPin.length === 6) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const submitPin = async (pinToSubmit: string) => {
    if (!selectedUser) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, pin: pinToSubmit }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect PIN. Please try again.");
        setPin("");
      } else {
        onLoginSuccess(data.user);
      }
    } catch {
      setError("Network or server error during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !recoveryKey || !newPin) return;
    setLoading(true);
    setRecoveryMessage("");

    try {
      const res = await fetch("/api/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          recoveryKey: recoveryKey.trim(),
          newPin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRecoveryMessage(data.error || "Failed to reset PIN");
      } else {
        setRecoveryMessage("PIN successfully reset! You can now log in.");
        setTimeout(() => {
          setShowRecovery(false);
          setRecoveryKey("");
          setNewPin("");
          setRecoveryMessage("");
        }, 1800);
      }
    } catch {
      setRecoveryMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 50% 20%, #1e1e38 0%, #090d16 65%)",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid var(--border-medium)",
        borderRadius: 24,
        padding: "36px 32px",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
          }}>
            <Lock size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
            {orgName}
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Secure Partner PIN Authentication
          </p>
        </div>

        {!showRecovery ? (
          <>
            {/* Partner Profile Switcher */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: 10, textAlign: "center" }}>
                Select Your Partner Profile
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {partners.map((partner) => {
                  const isSelected = selectedUser?.id === partner.id;
                  return (
                    <button
                      key={partner.id}
                      id={`profile-select-${partner.id}`}
                      onClick={() => {
                        setSelectedUser(partner);
                        setPin("");
                        setError("");
                      }}
                      style={{
                        padding: "12px 10px",
                        borderRadius: 14,
                        border: isSelected ? "2px solid #6366f1" : "1px solid var(--border-subtle)",
                        background: isSelected ? "rgba(99, 102, 241, 0.16)" : "rgba(255, 255, 255, 0.03)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: partner.avatar_color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}>
                        {partner.display_name.charAt(0)}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#ffffff" }}>
                          {partner.display_name}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                          {partner.role}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Dots Indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 14, margin: "24px 0" }}>
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: filled ? "#6366f1" : "rgba(255, 255, 255, 0.12)",
                      border: filled ? "2px solid #818cf8" : "1px solid var(--border-subtle)",
                      boxShadow: filled ? "0 0 12px rgba(99, 102, 241, 0.6)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: "rgba(244, 63, 94, 0.12)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#fb7185",
                fontSize: "0.82rem",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 20,
            }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  id={`keypad-${num}`}
                  onClick={() => handleDigit(num)}
                  disabled={loading}
                  style={{
                    height: 56,
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {num}
                </button>
              ))}

              <button
                id="keypad-clear"
                onClick={handleClear}
                disabled={loading}
                style={{
                  height: 56,
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                }}
              >
                CLEAR
              </button>

              <button
                key="0"
                id="keypad-0"
                onClick={() => handleDigit("0")}
                disabled={loading}
                style={{
                  height: 56,
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                0
              </button>

              <button
                id="keypad-backspace"
                onClick={handleBackspace}
                disabled={loading}
                style={{
                  height: 56,
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                }}
              >
                ⌫ DEL
              </button>
            </div>

            {/* Quick Demo Info Pill */}
            <div style={{
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: "0.76rem",
              color: "#a5b4fc",
              textAlign: "center",
              marginBottom: 16,
            }}>
              <span>Default PIN: </span>
              <strong>{selectedUser?.username === "partner1" ? "123456" : "654321"}</strong>
              <span style={{ color: "var(--text-muted)" }}> (changeable anytime in Settings)</span>
            </div>

            {/* Emergency Recovery Link */}
            <div style={{ textAlign: "center" }}>
              <button
                id="btn-open-recovery"
                onClick={() => setShowRecovery(true)}
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Lost PIN? Reset with Master Recovery Key
              </button>
            </div>
          </>
        ) : (
          /* Recovery Drawer */
          <form onSubmit={handleResetPin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#38bdf8",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}>
              <KeyRound size={18} />
              <span>Master Recovery Override</span>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Reset the PIN for <strong>{selectedUser?.display_name}</strong> using the organization master key.
            </p>

            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Master Recovery Key
              </label>
              <input
                id="input-recovery-key"
                type="text"
                placeholder="e.g. MASTER-XXXXXX"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                New 6-Digit PIN
              </label>
              <input
                id="input-new-pin"
                type="password"
                maxLength={6}
                placeholder="Enter new 6-digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {recoveryMessage && (
              <div style={{
                fontSize: "0.8rem",
                color: recoveryMessage.includes("success") ? "#34d399" : "#fb7185",
                background: recoveryMessage.includes("success") ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)",
                padding: "8px 12px",
                borderRadius: 6,
              }}>
                {recoveryMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                Reset PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
