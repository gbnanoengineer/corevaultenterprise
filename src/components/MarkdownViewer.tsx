"use client";

import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import mermaid from "mermaid";
import { Copy, Check, Code, FileText } from "lucide-react";

interface MarkdownViewerProps {
  content: string;
  title?: string;
}

export default function MarkdownViewer({ content, title }: MarkdownViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState<string>("");

  useEffect(() => {
    // Configure mermaid with modern dark theme
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#0b0f19",
        primaryColor: "#4f46e5",
        primaryTextColor: "#f8fafc",
        primaryBorderColor: "#818cf8",
        lineColor: "#38bdf8",
        secondaryColor: "#0ea5e9",
        tertiaryColor: "#1e293b",
      },
      securityLevel: "loose",
    });

    let isMounted = true;

    async function processMarkdown() {
      if (!content) {
        setRenderedHtml("");
        return;
      }

      try {
        // Parse markdown to HTML
        const html = await marked.parse(content, { async: true, breaks: true, gfm: true });
        if (isMounted) {
          setRenderedHtml(html);
        }
      } catch (err) {
        console.error("Markdown parse error:", err);
        if (isMounted) setRenderedHtml(`<pre>${content}</pre>`);
      }
    }

    processMarkdown();

    return () => {
      isMounted = false;
    };
  }, [content]);

  // After HTML renders, find and render any mermaid code blocks
  useEffect(() => {
    if (!containerRef.current || !renderedHtml) return;

    const codeBlocks = containerRef.current.querySelectorAll("pre code.language-mermaid, pre code.lang-mermaid");
    if (codeBlocks.length === 0) {
      // Also look for code blocks that start with mermaid keywords
      const allPre = containerRef.current.querySelectorAll("pre code");
      allPre.forEach(async (block, idx) => {
        const text = block.textContent?.trim() || "";
        if (
          text.startsWith("graph ") ||
          text.startsWith("flowchart ") ||
          text.startsWith("sequenceDiagram") ||
          text.startsWith("classDiagram") ||
          text.startsWith("stateDiagram") ||
          text.startsWith("erDiagram") ||
          text.startsWith("gantt") ||
          text.startsWith("pie") ||
          text.startsWith("gitGraph")
        ) {
          renderMermaidBlock(block, text, `mermaid-diagram-${idx}`);
        }
      });
      return;
    }

    codeBlocks.forEach((block, idx) => {
      const code = block.textContent || "";
      renderMermaidBlock(block, code, `mermaid-diagram-${idx}`);
    });

    async function renderMermaidBlock(blockElement: Element, code: string, id: string) {
      try {
        const uniqueId = `mmd-${Math.random().toString(36).substring(2, 9)}-${id}`;
        const { svg } = await mermaid.render(uniqueId, code);
        const container = document.createElement("div");
        container.className = "mermaid-diagram-rendered";
        container.style.display = "flex";
        container.style.justifyContent = "center";
        container.style.background = "rgba(11, 15, 25, 0.75)";
        container.style.border = "1px solid rgba(255, 255, 255, 0.1)";
        container.style.borderRadius = "12px";
        container.style.padding = "20px";
        container.style.margin = "16px 0";
        container.style.overflowX = "auto";
        container.innerHTML = svg;

        // Replace the pre element with the rendered diagram
        const pre = blockElement.closest("pre");
        if (pre && pre.parentNode) {
          pre.parentNode.replaceChild(container, pre);
        }
      } catch (err) {
        console.warn("Mermaid render error:", err);
        // Leave code block as fallback
      }
    }
  }, [renderedHtml]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Markdown Toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "rgba(15, 23, 42, 0.8)",
        borderBottom: "1px solid var(--border-subtle)",
        borderRadius: "12px 12px 0 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={16} color="#38bdf8" />
          <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#ffffff" }}>
            {title || "Markdown Document"}
          </span>
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            background: "rgba(56, 189, 248, 0.15)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            padding: "2px 6px",
            borderRadius: 4
          }}>
            GFM + MERMAID
          </span>
        </div>

        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 6,
            color: "#ffffff",
            fontSize: "0.76rem",
            padding: "5px 10px",
            cursor: "pointer"
          }}
        >
          {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy Raw Markdown"}</span>
        </button>
      </div>

      {/* Rendered HTML Container */}
      <div
        ref={containerRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          background: "#080b12",
          color: "#e2e8f0",
          fontSize: "0.94rem",
          lineHeight: 1.7,
        }}
      />

      <style jsx global>{`
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
          color: #ffffff;
          font-weight: 700;
          margin-top: 1.4em;
          margin-bottom: 0.6em;
          letter-spacing: -0.01em;
        }
        .markdown-body h1 {
          font-size: 1.65rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.3em;
        }
        .markdown-body h2 {
          font-size: 1.35rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 0.25em;
        }
        .markdown-body h3 {
          font-size: 1.15rem;
        }
        .markdown-body p {
          margin-bottom: 1em;
        }
        .markdown-body ul, .markdown-body ol {
          margin-bottom: 1em;
          padding-left: 1.6em;
        }
        .markdown-body li {
          margin-bottom: 0.3em;
        }
        .markdown-body code:not(pre code) {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.88em;
          border: 1px solid rgba(99, 102, 241, 0.25);
        }
        .markdown-body pre {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
          font-family: var(--font-mono);
          font-size: 0.86rem;
          line-height: 1.55;
          color: #f1f5f9;
        }
        .markdown-body blockquote {
          border-left: 4px solid #6366f1;
          background: rgba(99, 102, 241, 0.08);
          padding: 10px 16px;
          margin: 16px 0;
          border-radius: 0 8px 8px 0;
          color: #cbd5e1;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 18px 0;
          font-size: 0.88rem;
        }
        .markdown-body th {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px 14px;
          text-align: left;
          color: #ffffff;
          font-weight: 600;
        }
        .markdown-body td {
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 14px;
        }
        .markdown-body tr:nth-child(even) td {
          background: rgba(255, 255, 255, 0.02);
        }
        .markdown-body hr {
          border: none;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 24px 0;
        }
        .markdown-body a {
          color: #38bdf8;
          text-decoration: underline;
        }
        .markdown-body input[type="checkbox"] {
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
}
