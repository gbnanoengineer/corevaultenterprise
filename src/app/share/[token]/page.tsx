"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCheck,
  FolderLock,
  Layers,
  Code,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeSheet, setActiveSheet] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    const fetchShared = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/share/${token}`);
        const result = await res.json();
        if (!res.ok) {
          setError(result.error || "Shared resource not found or link has expired.");
        } else {
          setData(result);
          if (result.previewData?.type === "excel" && result.previewData.sheetNames?.length > 0) {
            setActiveSheet(result.previewData.sheetNames[0]);
          }
        }
      } catch (err) {
        setError("Network error while accessing shared resource.");
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090d16",
        color: "var(--text-secondary)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>
            Loading Shared Workspace Asset...
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Connecting to secure client portal</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090d16",
        padding: 24,
      }}>
        <div className="glass-card" style={{ maxWidth: 440, width: "100%", padding: 32, textAlign: "center" }}>
          <AlertCircle size={40} color="#fb7185" style={{ margin: "0 auto 14px" }} />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
            Resource Not Accessible
          </h2>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {error || "This shared link does not exist or has been revoked by the organization administrator."}
          </p>
        </div>
      </div>
    );
  }

  const { link, folderFiles, previewData, downloadUrl } = data;

  return (
    <div style={{ minHeight: "100vh", background: "#090d16", display: "flex", flexDirection: "column" }}>
      {/* Client Header */}
      <header style={{
        background: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "16px 28px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff"
            }}>
              <Layers size={20} />
            </div>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff" }}>
                Client Document Portal
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                Shared by {link.creatorName || "Organization"} • Verified Secure Link
              </div>
            </div>
          </div>

          {link.isFile && downloadUrl && (
            <a
              id="btn-client-download-file"
              href={downloadUrl}
              download
              className="btn-primary"
              style={{ padding: "9px 18px", fontSize: "0.88rem" }}
            >
              <Download size={16} />
              <span>Download File ({(link.fileSize / 1024).toFixed(1)} KB)</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", width: "100%", flex: 1 }}>
        {/* Title & Metadata Banner */}
        <div style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              {link.isFile ? "Shared File" : "Shared Folder"}
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff" }}>
              {link.isFile ? link.fileName : link.folderName}
            </h1>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>
              {link.label}
            </div>
          </div>

          <span className="badge badge-emerald">
            <CheckCircle2 size={13} />
            <span>Active Client Link</span>
          </span>
        </div>

        {/* Content View: File Preview or Folder Content List */}
        {link.isFile ? (
          <div className="glass-panel" style={{ padding: 24, minHeight: 460 }}>
            {previewData?.type === "excel" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Sheet Tabs */}
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

                {/* Table */}
                <div style={{ overflow: "auto", border: "1px solid var(--border-subtle)", borderRadius: 10, background: "#0f172a" }}>
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
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} style={{ padding: "8px 14px", borderRight: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                              {cell !== undefined && cell !== null ? String(cell) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : previewData?.type === "word" ? (
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
            ) : previewData?.type === "code" ? (
              <div style={{
                background: "#080b12",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "20px 24px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.86rem",
                color: "#e2e8f0",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {previewData.content}
              </div>
            ) : previewData?.type === "pdf" ? (
              <div style={{ height: "75vh", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                <iframe src={previewData.url} title={link.fileName} style={{ width: "100%", height: "100%", border: "none" }} />
              </div>
            ) : previewData?.type === "image" ? (
              <div style={{ textAlign: "center" }}>
                <img src={previewData.url} alt={link.fileName} style={{ maxWidth: "100%", maxHeight: 600, borderRadius: 10 }} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <FileText size={48} color="#818cf8" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
                  Document Ready for Download
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  This document is packaged for local review on your computer.
                </p>
                <a href={downloadUrl} download className="btn-primary" style={{ padding: "10px 24px" }}>
                  <Download size={16} />
                  <span>Download {link.fileName}</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Shared Folder Content Table */
          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
                Documents in this Shared Folder ({folderFiles.length})
              </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "14px 18px" }}>File Name</th>
                    <th style={{ padding: "14px 16px" }}>Size</th>
                    <th style={{ padding: "14px 16px" }}>Date Added</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {folderFiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                        No files in this shared folder.
                      </td>
                    </tr>
                  ) : (
                    folderFiles.map((file: any) => (
                      <tr key={file.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "14px 18px", fontWeight: 600, color: "#ffffff" }}>
                          {file.name}
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                          {(file.file_size / 1024).toFixed(1)} KB
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-muted)" }}>
                          {file.created_at}
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <a
                            href={`/api/share/${token}/file/${file.id}?download=1`}
                            download
                            className="btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "18px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.76rem" }}>
        Powered by ExpenseTracker & AssetVault • Secured Client Portal
      </footer>
    </div>
  );
}
