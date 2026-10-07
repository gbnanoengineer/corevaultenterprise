"use client";

import React from "react";

interface BrandIconProps {
  name?: string;
  size?: number;
  className?: string;
}

export function BrandIcon({ name = "", size = 20, className }: BrandIconProps) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. OpenAI / ChatGPT
  if (normalized.includes("openai") || normalized.includes("chatgpt") || normalized.includes("gpt")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#10a37f" />
        <path
          d="M18.5 10.4c-.2-.7-.7-1.3-1.3-1.6-.2 0-.4-.1-.7-.1-.1-.7-.5-1.3-1.1-1.7-.8-.6-1.9-.7-2.8-.3-.4-.5-1-.8-1.7-.8-1.2 0-2.3.8-2.6 2-.6.1-1.2.5-1.6 1-.5.7-.7 1.6-.4 2.5-.5.3-.9.9-1 1.5-.2.9.1 1.9.8 2.5.2.7.7 1.3 1.3 1.6.2 0 .4.1.7.1.1.7.5 1.3 1.1 1.7.8.6 1.9.7 2.8.3.4.5 1 .8 1.7.8 1.2 0 2.3-.8 2.6-2 .6-.1 1.2-.5 1.6-1 .5-.7.7-1.6.4-2.5.5-.3.9-.9 1-1.5.2-.9-.1-1.9-.8-2.5zM12 13.8l-1.6-.9 1.6-.9 1.6.9-1.6.9z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 2. Anthropic / Claude
  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#d97706" />
        <path
          d="M13.8 6.5l-4.1 11h2.2l.9-2.5h3.4l.9 2.5h2.2l-4.1-11h-1.4zm-.2 6.7l1.1-3.3 1.1 3.3h-2.2zM7.5 9.5H5.8L4.1 14h1.7l.4-1.2h1.6l.4 1.2h1.7l-2.4-4.5z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 3. xAI / Grok
  if (normalized.includes("grok") || normalized.includes("xai")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#000000" />
        <path
          d="M6 6l5.2 6.9L6 18h2.3l4-4.1 3.6 4.1H18l-5.4-7.2L17.7 6h-2.3l-3.8 3.9L8.2 6H6z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 4. Google Gemini
  if (normalized.includes("gemini") || normalized.includes("bard") || normalized.includes("google")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#1e1e2e" />
        <path
          d="M12 4C12 8.4 8.4 12 4 12C8.4 12 12 15.6 12 20C12 15.6 15.6 12 20 12C15.6 12 12 8.4 12 4Z"
          fill="url(#geminiGrad)"
        />
        <defs>
          <linearGradient id="geminiGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 5. GitHub Copilot
  if (normalized.includes("copilot") || normalized.includes("github")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#181717" />
        <path
          d="M12 5.5c-3.6 0-6.5 2.2-6.5 5 0 1.5.8 2.8 2.1 3.7l-.4 2.3 2.5-1.3c.7.2 1.5.3 2.3.3 3.6 0 6.5-2.2 6.5-5s-2.9-5-6.5-5zm-2.2 6.2c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2 1.2.5 1.2 1.2-.5 1.2-1.2 1.2zm4.4 0c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2 1.2.5 1.2 1.2-.5 1.2-1.2 1.2z"
          fill="#58a6ff"
        />
      </svg>
    );
  }

  // 6. Midjourney
  if (normalized.includes("midjourney")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#0d1117" />
        <path
          d="M12 5c-3.9 0-7 3.1-7 7 0 1.8.7 3.5 1.9 4.7l1.4-1.4C7.4 14.4 7 13.2 7 12c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.2-.4 2.4-1.3 3.3l1.4 1.4C18.3 15.5 19 13.8 19 12c0-3.9-3.1-7-7-7zm-2 6l2 4 2-4h-4z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 7. Perplexity AI
  if (normalized.includes("perplexity")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#1f2937" />
        <path
          d="M12 6v12M6 12h12M7.8 7.8l8.4 8.4M16.2 7.8l-8.4 8.4"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 8. Cursor AI
  if (normalized.includes("cursor")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#0f172a" />
        <path d="M7 6l10 5.5-4.5 1.5 3.5 5-2 1-3.5-5L7 16V6z" fill="#38bdf8" />
      </svg>
    );
  }

  // 9. AWS
  if (normalized.includes("aws") || normalized.includes("amazon")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#232f3e" />
        <path
          d="M6 13.5c1.8 1.4 4.1 2 6.5 1.7 1.6-.2 3.1-.9 4.5-1.9l.8 1.2c-1.6 1.2-3.4 1.9-5.3 2.1-2.8.3-5.4-.4-7.5-2l1-1.1zm8.3-5.5h2.2l1.5 5.5h-1.6l-.3-1.4h-1.4l-.3 1.4h-1.6l1.5-5.5zm.9 3h.9l-.4-1.8-.5 1.8z"
          fill="#ff9900"
        />
      </svg>
    );
  }

  // 10. Vercel
  if (normalized.includes("vercel")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#000000" />
        <path d="M12 7l6 10H6L12 7z" fill="#ffffff" />
      </svg>
    );
  }

  // 11. Supabase
  if (normalized.includes("supabase")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#1c1c1c" />
        <path d="M12.5 4.5L5.5 14h6.5l-1 5.5 7.5-9.5h-6.5l.5-5.5z" fill="#3ecf8e" />
      </svg>
    );
  }

  // 12. Stripe
  if (normalized.includes("stripe")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#635bff" />
        <path
          d="M14.5 11.2c0-.7-.6-1-1.6-1-1.1 0-2.3.4-3.2.9V9.2c1-.4 2.2-.7 3.3-.7 2.3 0 3.7 1.1 3.7 3.1v4.9h-1.9v-1.1c-.8.8-1.9 1.3-3.2 1.3-1.8 0-3-1-3-2.6 0-1.8 1.5-2.7 4.2-2.9h1.7v-.1zm-1.8 4c1 0 1.8-.7 1.8-1.6v-1h-1.5c-1.5.1-2.3.6-2.3 1.5 0 .7.6 1.1 2 1.1z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 13. Figma
  if (normalized.includes("figma")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#1e1e1e" />
        <circle cx="15" cy="12" r="2.5" fill="#1abcfe" />
        <path d="M9.5 9.5a2.5 2.5 0 012.5-2.5h2.5v5H12a2.5 2.5 0 01-2.5-2.5z" fill="#f24e1e" />
        <path d="M9.5 14.5A2.5 2.5 0 0012 17h2.5v-5H12a2.5 2.5 0 00-2.5 2.5z" fill="#0acf83" />
        <path d="M9.5 19.5A2.5 2.5 0 0012 22v-5H9.5a2.5 2.5 0 000 2.5z" fill="#a259ff" />
      </svg>
    );
  }

  // 14. Slack
  if (normalized.includes("slack")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="6" fill="#4a154b" />
        <path d="M8.5 13.5a1.5 1.5 0 11-1.5-1.5h1.5v1.5zm1 0a1.5 1.5 0 013 0v4a1.5 1.5 0 11-3 0v-4z" fill="#ecb22e" />
        <path d="M10.5 8.5a1.5 1.5 0 111.5-1.5v1.5h-1.5zm0 1a1.5 1.5 0 010 3h-4a1.5 1.5 0 110-3h4z" fill="#36c5f0" />
        <path d="M15.5 10.5a1.5 1.5 0 111.5 1.5h-1.5v-1.5zm-1 0a1.5 1.5 0 01-3 0v-4a1.5 1.5 0 113 0v4z" fill="#2eb67d" />
        <path d="M13.5 15.5a1.5 1.5 0 11-1.5 1.5v-1.5h1.5zm0-1a1.5 1.5 0 010-3h4a1.5 1.5 0 110 3h-4z" fill="#e01e5a" />
      </svg>
    );
  }

  // Default Fallback Icon
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "rgba(99, 102, 241, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.48,
        fontWeight: 800,
        color: "#818cf8",
      }}
    >
      {name ? name.charAt(0).toUpperCase() : "S"}
    </div>
  );
}

export const AI_SUBSCRIPTION_PRESETS = [
  { name: "ChatGPT Plus", category: "AI & LLM Services", cost: "20.00", billing_cycle: "monthly", url: "https://chatgpt.com" },
  { name: "Claude Pro (Anthropic)", category: "AI & LLM Services", cost: "20.00", billing_cycle: "monthly", url: "https://claude.ai" },
  { name: "Grok Premium (xAI)", category: "AI & LLM Services", cost: "16.00", billing_cycle: "monthly", url: "https://x.ai" },
  { name: "GitHub Copilot", category: "AI & LLM Services", cost: "10.00", billing_cycle: "monthly", url: "https://github.com/features/copilot" },
  { name: "Cursor Pro (AI Code)", category: "AI & LLM Services", cost: "20.00", billing_cycle: "monthly", url: "https://cursor.com" },
  { name: "Midjourney Standard", category: "AI & LLM Services", cost: "30.00", billing_cycle: "monthly", url: "https://midjourney.com" },
  { name: "Perplexity Pro", category: "AI & LLM Services", cost: "20.00", billing_cycle: "monthly", url: "https://perplexity.ai" },
  { name: "Google Gemini Advanced", category: "AI & LLM Services", cost: "19.99", billing_cycle: "monthly", url: "https://gemini.google.com" },
];
