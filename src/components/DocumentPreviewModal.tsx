"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Share2,
  FileSpreadsheet,
  FileText,
  Code,
  Image as ImageIcon,
  Copy,
  Check,
  Maximize2,
  FileCheck
} from "lucide-react";
import MarkdownViewer from "./MarkdownViewer";

interface DocumentPreviewModalProps {
  file: any;
  onClose: () => void;
  onOpenShareModal: (file: any) => void;
}

export default function DocumentPreviewModal({
  file,
  onClose,
  onOpenShareModal,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!file) return;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/files/${file.id}/preview`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load document preview");
        } else {
          setPreviewData(data);
          if (data.type === "excel" && data.sheetNames?.length > 0) {
            setActiveSheet(data.sheetNames[0]);
          }
        }
      } catch (err) {
        setError("Network error while generating preview");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [file]);

  const handleCopyCode = () => {
    if (previewData?.content) {
      navigator.clipboard.writeText(previewData.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!file) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 110,
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 1040,
        height: "90vh",
        background: "#0d1322",
        border: "1px solid var(--border-medium)",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)",
      }}>
        {/* Header Bar */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(15, 23, 42, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(99, 102, 241, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8"
            }}>
              <FileCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#ffffff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {file.name}
              </h2>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {(file.file_size / 1024).toFixed(1)} KB • Uploaded by {file.uploaded_by_name || "Partner"}
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              id="btn-preview-share"
              onClick={() => onOpenShareModal(file)}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "7px 12px" }}
              title="Create Public Share Link"
            >
              <Share2 size={14} />
              <span>Share Link</span>
            </button>

            <a
              id="btn-preview-download"
              href={`/api/files/${file.id}?download=1`}
              download
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "7px 12px" }}
            >
              <Download size={14} />
              <span>Download</span>
            </a>

            <button
              id="btn-preview-close"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.05)"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Viewport Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#090d16" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>
                Rendering In-App Document Preview...
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Parsing sheets, code, and document elements
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#fb7185" }}>
              {error}
            </div>
          ) : !previewData ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              No preview data available for this file type.
            </div>
          ) : previewData.type === "excel" ? (
            /* Excel Spreadsheet Tabular Viewer */
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 14 }}>
              {/* Sheet tabs switcher */}
              {previewData.sheetNames?.length > 1 && (
                <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10 }}>
                  {previewData.sheetNames.map((name: string) => (
                    <button
                      key={name}
                      onClick={() => setActiveSheet(name)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: "0.82rem",
                        fontWeight: activeSheet === name ? 600 : 400,
                        background: activeSheet === name ? "#10b981" : "rgba(255, 255, 255, 0.05)",
                        color: activeSheet === name ? "#ffffff" : "var(--text-secondary)",
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {/* Data Table */}
              <div style={{ flex: 1, overflow: "auto", border: "1px solid var(--border-subtle)", borderRadius: 10, background: "#0f172a" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", fontFamily: "var(--font-mono)" }}>
                  <tbody>
                    {(previewData.sheets[activeSheet] || []).map((row: any[], rIdx: number) => (
                      <tr
                        key={rIdx}
                        style={{
                          background: rIdx === 0 ? "rgba(255, 255, 255, 0.06)" : "transparent",
                          fontWeight: rIdx === 0 ? 600 : 400,
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <td style={{
                          padding: "8px 12px",
                          color: "var(--text-muted)",
                          borderRight: "1px solid var(--border-subtle)",
                          userSelect: "none",
                          fontSize: "0.75rem",
                          width: 40,
                          textAlign: "center"
                        }}>
                          {rIdx + 1}
                        </td>
                        {row.map((cell: any, cIdx: number) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: "8px 14px",
                              borderRight: "1px solid var(--border-subtle)",
                              color: rIdx === 0 ? "#ffffff" : "var(--text-primary)",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {cell !== undefined && cell !== null ? String(cell) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : previewData.type === "word" ? (
            /* Word Document HTML Paper View */
            <div style={{
              maxWidth: 780,
              margin: "0 auto",
              background: "#ffffff",
              color: "#1e293b",
              padding: "48px 56px",
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
              lineHeight: 1.7,
              fontSize: "0.95rem"
            }}>
              <div
                dangerouslySetInnerHTML={{ __html: previewData.html }}
                style={{ fontFamily: "Georgia, serif" }}
              />
            </div>
          ) : previewData.type === "pdf" ? (
            /* PDF Document Viewer */
            <div style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
              <iframe
                src={`/api/files/${file.id}`}
                title={file.name}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          ) : previewData.type === "image" ? (
            /* High-Res Image View */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <img
                src={previewData.url}
                alt={file.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: 10,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                  objectFit: "contain"
                }}
              />
            </div>
          ) : previewData.type === "code" ? (
            /* If markdown document, render with GFM & Mermaid diagrams */
            file.name?.toLowerCase().endsWith(".md") || previewData.ext === ".md" || previewData.language === "markdown" ? (
              <div style={{ flex: 1, height: "100%", overflow: "hidden", borderRadius: 10 }}>
                <MarkdownViewer content={previewData.content} title={file.name} />
              </div>
            ) : (
              /* Generic Code / Text Viewer with Copy button */
              <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-indigo" style={{ textTransform: "uppercase" }}>
                    {previewData.language || "code"}
                  </span>
                  <button
                    id="btn-copy-code"
                    onClick={handleCopyCode}
                    className="btn-secondary"
                    style={{ fontSize: "0.76rem", padding: "5px 10px" }}
                  >
                    {copiedCode ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>

                <div style={{
                  flex: 1,
                  overflow: "auto",
                  background: "#080b12",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "16px 20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "#e2e8f0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {previewData.content}
                </div>
              </div>
            )
          ) : previewData.type === "presentation" ? (
            /* PowerPoint / Presentation info */
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "rgba(245, 158, 11, 0.2)",
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}>
                <FileText size={36} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
                PowerPoint Presentation Ready
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto 24px" }}>
                {file.name} is ready for client review and local presentation editing.
              </p>
              <a href={previewData.downloadUrl} download className="btn-primary" style={{ padding: "10px 20px" }}>
                <Download size={16} />
                <span>Download Presentation</span>
              </a>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                Direct preview not available for this file extension.
              </p>
              <a href={`/api/files/${file.id}?download=1`} download className="btn-primary">
                <Download size={16} />
                <span>Download {file.name}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
