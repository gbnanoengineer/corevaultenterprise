"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

export function CoreVaultIcon({ size = 36, iconSize = 20 }: { size?: number; iconSize?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 16px rgba(79, 70, 229, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Isometric Hexagon / Vault Shield */}
        <path
          d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Internal Vault Safe Chamber */}
        <path
          d="M12 22V12"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M21 7L12 12L3 7"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Security Core Node */}
        <circle cx="12" cy="12" r="2.4" fill="#38bdf8" />
      </svg>
    </div>
  );
}

export default function CoreVaultLogo({
  size = "md",
  showBadge = true,
  badgeText = "ENTERPRISE",
  className = "",
  subContent,
}: LogoProps & { subContent?: React.ReactNode }) {
  const iconDimensions = {
    sm: { box: 30, icon: 16, fontSize: "0.92rem", badgeSize: "0.58rem" },
    md: { box: 36, icon: 20, fontSize: "1.08rem", badgeSize: "0.64rem" },
    lg: { box: 48, icon: 26, fontSize: "1.4rem", badgeSize: "0.72rem" },
  }[size];

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "sm" ? 9 : 12,
        userSelect: "none",
      }}
    >
      {/* Precision Geometric Vault Emblem */}
      <CoreVaultIcon size={iconDimensions.box} iconSize={iconDimensions.icon} />

      {/* Brand Name Typography */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: iconDimensions.fontSize,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            Core<span style={{ color: "#38bdf8" }}>Vault</span>
          </span>

          {showBadge && (
            <span
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
                color: "#38bdf8",
                fontSize: iconDimensions.badgeSize,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "1.5px 6px",
                borderRadius: 4,
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "inline-block",
                lineHeight: 1.2,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        {subContent}
      </div>
    </div>
  );
}
