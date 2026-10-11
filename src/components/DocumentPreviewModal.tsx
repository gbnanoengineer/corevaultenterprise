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
  FileCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Presentation,
  Sliders,
  Layers,
  BookOpen
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
  const [sheetSearch, setSheetSearch] = useState("");
  const [selectedCell, setSelectedCell] = useState<{ col: string; row: number; val: string } | null>(null);

  // Word Reader Controls
  const [wordTheme, setWordTheme] = useState<"dark" | "warm" | "light">("dark");
  const [wordZoom, setWordZoom] = useState<number>(100);
  const [wordWideMode, setWordWideMode] = useState(false);

  // PowerPoint Presentation Controls
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

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
        setError("Network error while generating document preview");
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

  // Safe sheet data resolution
  const sheetsObj = previewData?.sheets || previewData?.data || {};
  const currentSheetRows: any[][] = sheetsObj[activeSheet] || [];

  // Filter sheet rows if search query is provided
  const filteredRows = sheetSearch.trim()
    ? currentSheetRows.filter((row, rIdx) => {
        if (rIdx === 0) return true; // keep header
        return row.some((cell) =>
          String(cell || "").toLowerCase().includes(sheetSearch.toLowerCase())
        );
      })
    : currentSheetRows;

  // Helper: column index to letter (0 -> A, 1 -> B, ...)
  const colToLetter = (idx: number) => {
    let letter = "";
    let temp = idx;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Word word count estimate
  const wordCount = previewData?.html
    ? previewData.html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length
    : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
        padding: 16,
      }}
    >
      <div
        className="modal-container modal-fullscreen-mobile"
        style={{
          width: "100%",
          maxWidth: 1140,
          height: "92vh",
          background: "#0a0e1a",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9)",
        }}
      >
        {/* =========================================================================
            HEADER BAR
           ========================================================================= */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(13, 19, 33, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* File Title & Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background:
                  previewData?.type === "excel"
                    ? "rgba(16, 185, 129, 0.15)"
                    : previewData?.type === "word"
                    ? "rgba(59, 130, 246, 0.15)"
                    : previewData?.type === "presentation"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(99, 102, 241, 0.15)",
                color:
                  previewData?.type === "excel"
                    ? "#34d399"
                    : previewData?.type === "word"
                    ? "#60a5fa"
                    : previewData?.type === "presentation"
                    ? "#fbbf24"
                    : "#818cf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {previewData?.type === "excel" ? (
                <FileSpreadsheet size={18} />
              ) : previewData?.type === "presentation" ? (
                <Presentation size={18} />
              ) : previewData?.type === "code" ? (
                <Code size={18} />
              ) : (
                <FileText size={18} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file.name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {(file.file_size / 1024).toFixed(1)} KB • {file.uploaded_by_name || "Partner"}
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              id="btn-preview-share"
              onClick={() => onOpenShareModal(file)}
              className="btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 12px" }}
              title="Create Share Link"
            >
              <Share2 size={13} />
              <span className="mobile-hide">Share</span>
            </button>

            <a
              id="btn-preview-download"
              href={`/api/files/${file.id}?download=1`}
              download
              className="btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 12px" }}
            >
              <Download size={13} />
              <span className="mobile-hide">Download</span>
            </a>

            <button
              id="btn-preview-close"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            VIEWPORT BODY
           ========================================================================= */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#06090e" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>
                Rendering In-App Document Preview...
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Parsing sheets, fonts, and document formatting
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#fb7185" }}>
              {error}
            </div>
          ) : !previewData ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              No preview data available for this document.
            </div>
          ) : previewData.type === "excel" ? (
            /* =========================================================================
                EXCEL / SPREADSHEET 365 EXPERIENCE
               ========================================================================= */
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* Spreadsheet Ribbon Toolbar */}
              <div
                style={{
                  padding: "8px 14px",
                  background: "rgba(16, 185, 129, 0.05)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* Sheet Tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto" }}>
                  {(previewData.sheetNames || []).map((name: string) => (
                    <button
                      key={name}
                      onClick={() => {
                        setActiveSheet(name);
                        setSelectedCell(null);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        fontSize: "0.78rem",
                        fontWeight: activeSheet === name ? 700 : 500,
                        background: activeSheet === name ? "#10b981" : "rgba(255, 255, 255, 0.05)",
                        color: activeSheet === name ? "#ffffff" : "var(--text-secondary)",
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: activeSheet === name ? "0 2px 8px rgba(16, 185, 129, 0.35)" : "none",
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Search & Cell Inspector Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {selectedCell && (
                    <div
                      className="tabular-nums mobile-hide"
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: "0.75rem",
                        color: "#34d399",
                        fontWeight: 600,
                      }}
                    >
                      <span>
                        {selectedCell.col}
                        {selectedCell.row}:
                      </span>{" "}
                      <span style={{ color: "#ffffff" }}>{selectedCell.val}</span>
                    </div>
                  )}

                  <div style={{ position: "relative", width: 180 }}>
                    <Search
                      size={13}
                      color="var(--text-muted)"
                      style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search sheet..."
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      className="input-field"
                      style={{
                        height: 28,
                        paddingLeft: 26,
                        fontSize: "0.76rem",
                        background: "rgba(0, 0, 0, 0.3)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Excel Grid Canvas */}
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  background: "#090d16",
                  position: "relative",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {filteredRows.length > 0 ? (
                  <table
                    style={{
                      borderCollapse: "collapse",
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-mono)",
                      minWidth: "100%",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#0e1526",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        {/* Corner Top-Left */}
                        <th
                          style={{
                            width: 44,
                            minWidth: 44,
                            padding: "6px 8px",
                            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                            background: "#0c1220",
                            color: "var(--text-muted)",
                            textAlign: "center",
                            fontSize: "0.72rem",
                          }}
                        >
                          #
                        </th>
                        {/* Column Letters (A, B, C...) */}
                        {(filteredRows[0] || []).map((_: any, cIdx: number) => (
                          <th
                            key={cIdx}
                            style={{
                              padding: "6px 12px",
                              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "var(--text-secondary)",
                              fontWeight: 600,
                              fontSize: "0.74rem",
                              textAlign: "center",
                              background: "#0e1526",
                              minWidth: 110,
                              userSelect: "none",
                            }}
                          >
                            {colToLetter(cIdx)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row: any[], rIdx: number) => {
                        const isHeaderRow = rIdx === 0;
                        return (
                          <tr
                            key={rIdx}
                            style={{
                              background: isHeaderRow
                                ? "rgba(99, 102, 241, 0.06)"
                                : rIdx % 2 === 0
                                ? "rgba(255, 255, 255, 0.01)"
                                : "transparent",
                              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            {/* Row Number */}
                            <td
                              style={{
                                padding: "6px 8px",
                                color: "var(--text-muted)",
                                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                                textAlign: "center",
                                fontSize: "0.72rem",
                                background: "#0a0f1c",
                                userSelect: "none",
                                position: "sticky",
                                left: 0,
                                zIndex: 5,
                              }}
                            >
                              {rIdx + 1}
                            </td>
                            {/* Cells */}
                            {row.map((cell: any, cIdx: number) => {
                              const cellVal = cell !== undefined && cell !== null ? String(cell) : "";
                              const colLetter = colToLetter(cIdx);
                              const isSelected =
                                selectedCell?.col === colLetter && selectedCell?.row === rIdx + 1;

                              return (
                                <td
                                  key={cIdx}
                                  onClick={() =>
                                    setSelectedCell({
                                      col: colLetter,
                                      row: rIdx + 1,
                                      val: cellVal,
                                    })
                                  }
                                  style={{
                                    padding: "7px 12px",
                                    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                                    color: isHeaderRow ? "#ffffff" : "#cbd5e1",
                                    fontWeight: isHeaderRow ? 700 : 400,
                                    whiteSpace: "nowrap",
                                    background: isSelected ? "rgba(16, 185, 129, 0.15)" : "transparent",
                                    outline: isSelected ? "1px solid #10b981" : "none",
                                    cursor: "cell",
                                  }}
                                >
                                  {cellVal}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                    No rows match the search query "{sheetSearch}".
                  </div>
                )}
              </div>
            </div>
          ) : previewData.type === "word" ? (
            /* =========================================================================
                WORD DOCUMENT READER (NOTION & WORD 365 STYLE)
               ========================================================================= */
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* Document Reading Toolbar */}
              <div
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* Theme Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: 4 }}>
                    Canvas Mode:
                  </span>
                  <button
                    onClick={() => setWordTheme("dark")}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 5,
                      fontSize: "0.75rem",
                      fontWeight: wordTheme === "dark" ? 700 : 500,
                      background: wordTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      color: wordTheme === "dark" ? "#818cf8" : "var(--text-secondary)",
                      border: "none",
                    }}
                  >
                    Dark Obsidian
                  </button>
                  <button
                    onClick={() => setWordTheme("warm")}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 5,
                      fontSize: "0.75rem",
                      fontWeight: wordTheme === "warm" ? 700 : 500,
                      background: wordTheme === "warm" ? "#fbfbfa" : "rgba(255, 255, 255, 0.04)",
                      color: wordTheme === "warm" ? "#1e293b" : "var(--text-secondary)",
                      border: "none",
                    }}
                  >
                    Warm Editorial
                  </button>
                  <button
                    onClick={() => setWordTheme("light")}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 5,
                      fontSize: "0.75rem",
                      fontWeight: wordTheme === "light" ? 700 : 500,
                      background: wordTheme === "light" ? "#ffffff" : "rgba(255, 255, 255, 0.04)",
                      color: wordTheme === "light" ? "#0f172a" : "var(--text-secondary)",
                      border: "none",
                    }}
                  >
                    Clean White
                  </button>

                  <div style={{ height: 16, width: 1, background: "rgba(255, 255, 255, 0.1)", margin: "0 4px" }} />

                  {/* Wide Page View Toggle */}
                  <button
                    onClick={() => setWordWideMode(!wordWideMode)}
                    title="Toggle wide page view for wide data tables"
                    style={{
                      padding: "4px 9px",
                      borderRadius: 5,
                      fontSize: "0.75rem",
                      fontWeight: wordWideMode ? 700 : 500,
                      background: wordWideMode ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      color: wordWideMode ? "#38bdf8" : "var(--text-secondary)",
                      border: wordWideMode ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
                    }}
                  >
                    {wordWideMode ? "Wide View (100%)" : "Standard Width"}
                  </button>
                </div>

                {/* Zoom & Meta */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    {wordCount} words • {readTimeMin} min read
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => setWordZoom(Math.max(80, wordZoom - 10))}
                      style={{ padding: "4px 6px", borderRadius: 4, background: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }}
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span style={{ fontSize: "0.74rem", color: "#ffffff", minWidth: 36, textAlign: "center" }}>
                      {wordZoom}%
                    </span>
                    <button
                      onClick={() => setWordZoom(Math.min(150, wordZoom + 10))}
                      style={{ padding: "4px 6px", borderRadius: 4, background: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }}
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Word Document Paper Viewport */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 12px",
                  background: wordTheme === "dark" ? "#06090e" : wordTheme === "warm" ? "#f4f4f2" : "#e2e8f0",
                  display: "flex",
                  justifyContent: "center",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div
                  className={`word-doc-body word-doc-sheet ${wordWideMode ? "wide-mode" : ""}`}
                  style={{
                    background: wordTheme === "dark" ? "#0f172a" : wordTheme === "warm" ? "#fbfbfa" : "#ffffff",
                    color: wordTheme === "dark" ? "#f1f5f9" : "#1e293b",
                    fontSize: `${(0.95 * wordZoom) / 100}rem`,
                    lineHeight: 1.75,
                    fontFamily: wordTheme === "dark" ? "var(--font-main)" : "Georgia, Cambria, serif",
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: (previewData.html || "")
                        .replace(/<table/gi, '<div class="word-doc-table-wrapper"><table')
                        .replace(/<\/table>/gi, '</table></div>')
                    }}
                    style={{
                      wordBreak: "normal",
                      overflowWrap: "break-word",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : previewData.type === "presentation" ? (
            /* =========================================================================
                POWERPOINT SLIDE DECK VIEWER (PPTX)
               ========================================================================= */
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* Presentation Toolbar */}
              <div
                style={{
                  padding: "8px 16px",
                  background: "rgba(245, 158, 11, 0.06)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Presentation size={16} color="#fbbf24" />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff" }}>
                    Slide Deck Player
                  </span>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#fbbf24",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                    }}
                  >
                    {previewData.slideCount || previewData.slides?.length || 0} Slides
                  </span>
                </div>

                {/* Slide Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex <= 0}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 5,
                      background: "rgba(255, 255, 255, 0.06)",
                      color: currentSlideIndex <= 0 ? "var(--text-muted)" : "#ffffff",
                      border: "none",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", minWidth: 80, textAlign: "center" }}>
                    {currentSlideIndex + 1} / {previewData.slides?.length || 1}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentSlideIndex(
                        Math.min((previewData.slides?.length || 1) - 1, currentSlideIndex + 1)
                      )
                    }
                    disabled={currentSlideIndex >= (previewData.slides?.length || 1) - 1}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 5,
                      background: "rgba(255, 255, 255, 0.06)",
                      color:
                        currentSlideIndex >= (previewData.slides?.length || 1) - 1
                          ? "var(--text-muted)"
                          : "#ffffff",
                      border: "none",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Main Presentation Stage */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  overflow: "hidden",
                  background: "#080c14",
                }}
              >
                {/* Thumbnails Sidebar */}
                <div
                  className="mobile-hide"
                  style={{
                    width: 180,
                    borderRight: "1px solid rgba(255, 255, 255, 0.07)",
                    overflowY: "auto",
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    background: "rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {(previewData.slides || []).map((slide: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        background:
                          currentSlideIndex === idx
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(255, 255, 255, 0.03)",
                        border:
                          currentSlideIndex === idx
                            ? "1px solid rgba(245, 158, 11, 0.4)"
                            : "1px solid rgba(255, 255, 255, 0.05)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>
                        Slide {idx + 1}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: currentSlideIndex === idx ? "#fbbf24" : "#ffffff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {slide.title}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current Slide Display Canvas */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    overflowY: "auto",
                  }}
                >
                  {previewData.slides && previewData.slides[currentSlideIndex] ? (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 720,
                        aspectRatio: "16 / 9",
                        background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 12,
                        padding: "36px 44px",
                        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        overflowY: "auto",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "#fbbf24",
                            marginBottom: 8,
                          }}
                        >
                          SLIDE {currentSlideIndex + 1}
                        </div>
                        <h2
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            color: "#ffffff",
                            marginBottom: 20,
                            lineHeight: 1.25,
                          }}
                        >
                          {previewData.slides[currentSlideIndex].title}
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {(previewData.slides[currentSlideIndex].content || []).map(
                            (line: string, lIdx: number) => (
                              <div
                                key={lIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 10,
                                  fontSize: "0.94rem",
                                  color: "#cbd5e1",
                                  lineHeight: 1.5,
                                }}
                              >
                                <span style={{ color: "#fbbf24", marginTop: 4 }}>•</span>
                                <span>{line}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          paddingTop: 14,
                          marginTop: 20,
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <span>{file.name}</span>
                        <span>CoreVault Executive Deck</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)" }}>Slide not found.</div>
                  )}
                </div>
              </div>
            </div>
          ) : previewData.type === "pdf" ? (
            /* PDF Document Viewer */
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <iframe
                src={`/api/files/${file.id}`}
                title={file.name}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          ) : previewData.type === "image" ? (
            /* High-Res Image View */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 20 }}>
              <img
                src={previewData.url}
                alt={file.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: 10,
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.7)",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : previewData.type === "code" ? (
            /* Markdown or Code Viewer */
            file.name?.toLowerCase().endsWith(".md") ||
            previewData.ext === ".md" ||
            previewData.language === "markdown" ? (
              <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
                <MarkdownViewer content={previewData.content} title={file.name} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 16, gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-indigo">{previewData.language || "text"}</span>
                  <button
                    id="btn-copy-code"
                    onClick={handleCopyCode}
                    className="btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                  >
                    {copiedCode ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div
                  style={{
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
                    wordBreak: "break-word",
                  }}
                >
                  {previewData.content}
                </div>
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                Direct preview not available for this binary format.
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
