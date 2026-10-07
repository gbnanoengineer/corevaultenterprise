"use client";

import React from "react";
import { AlertTriangle, Info, CheckCircle2, X, Trash2, HelpCircle } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isAlertOnly = cancelText === "";

  const variantConfig = {
    danger: {
      icon: Trash2,
      color: "#fb7185",
      bg: "rgba(244, 63, 94, 0.15)",
      border: "rgba(244, 63, 94, 0.35)",
      btnBg: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
      btnShadow: "0 4px 14px rgba(244, 63, 94, 0.4)",
    },
    warning: {
      icon: AlertTriangle,
      color: "#fbbf24",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.35)",
      btnBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      btnShadow: "0 4px 14px rgba(245, 158, 11, 0.4)",
    },
    info: {
      icon: HelpCircle,
      color: "#38bdf8",
      bg: "rgba(56, 189, 248, 0.15)",
      border: "rgba(56, 189, 248, 0.35)",
      btnBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      btnShadow: "0 4px 14px rgba(56, 189, 248, 0.4)",
    },
    success: {
      icon: CheckCircle2,
      color: "#34d399",
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.35)",
      btnBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      btnShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
    },
  }[variant];

  const Icon = variantConfig.icon;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 8, 16, 0.8)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAlertOnly) onCancel();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          background: "linear-gradient(180deg, #0f172a 0%, #090e1a 100%)",
          border: `1px solid ${variantConfig.border}`,
          borderRadius: 20,
          padding: 26,
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
          position: "relative",
        }}
      >
        {!isAlertOnly && (
          <button
            onClick={onCancel}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: variantConfig.bg,
              border: `1px solid ${variantConfig.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: variantConfig.color,
            }}
          >
            <Icon size={22} />
          </div>

          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
              {title}
            </h3>
            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          {!isAlertOnly && (
            <button
              onClick={onCancel}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              background: variantConfig.btnBg,
              border: "none",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: variantConfig.btnShadow,
              cursor: "pointer",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
