"use client";

import React, { useState, useEffect } from "react";
import {
  FolderLock,
  Folder,
  FileText,
  FileSpreadsheet,
  Code,
  Image as ImageIcon,
  Share2,
  Download,
  Trash2,
  Plus,
  Upload,
  Lock,
  Unlock,
  Eye,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
  FileCheck,
  Clock
} from "lucide-react";
import DocumentPreviewModal from "./DocumentPreviewModal";
import ConfirmModal from "./ConfirmModal";

interface DocumentsViewProps {
  currentUser: any;
  partners: any[];
  isUploadModalOpenInitially?: boolean;
}

export default function DocumentsView({
  currentUser,
  partners,
  isUploadModalOpenInitially = false,
}: DocumentsViewProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [previewingFile, setPreviewingFile] = useState<any>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(isUploadModalOpenInitially);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingResource, setSharingResource] = useState<any>(null); // { type: 'file' | 'folder', item: any }

  // New Folder Form
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPrivate, setNewFolderPrivate] = useState(false);

  // File Upload Form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPrivate, setUploadPrivate] = useState(false);
  const [uploadExpiryDays, setUploadExpiryDays] = useState("never");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Share Link Data
  const [generatedShare, setGeneratedShare] = useState<any>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [shareRequirePin, setShareRequirePin] = useState(false);
  const [sharePin, setSharePin] = useState("");
  const [sharingLoading, setSharingLoading] = useState(false);

  // Custom Modal dialog state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirmModal = (props: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }) => {
    setConfirmModalState({
      isOpen: true,
      title: props.title,
      message: props.message,
      confirmText: props.confirmText || "Confirm",
      cancelText: props.cancelText !== undefined ? props.cancelText : "Cancel",
      variant: props.variant || "danger",
      onConfirm: () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        props.onConfirm();
      },
    });
  };

  const fetchDirectory = async (folderId: string | null = currentFolderId) => {
    try {
      setLoading(true);
      const url = folderId ? `/api/files?folderId=${folderId}` : "/api/files";
      const res = await fetch(url);
      const data = await res.json();
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setBreadcrumbs(data.breadcrumbs || []);
    } catch (err) {
      console.error("Fetch directory error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(currentFolderId);
  }, [currentFolderId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: currentFolderId,
          is_private: newFolderPrivate ? 1 : 0,
        }),
      });
      setNewFolderName("");
      setShowFolderModal(false);
      fetchDirectory();
    } catch (err) {
      console.error("Create folder error:", err);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    showConfirmModal({
      title: "Delete Folder",
      message: "Are you sure you want to delete this folder and all contents inside? This action cannot be undone.",
      confirmText: "Delete Folder",
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/folders?id=${folderId}`, { method: "DELETE" });
          fetchDirectory();
        } catch (err) {
          console.error("Delete folder error:", err);
        }
      },
    });
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    // Check for audio file
    const audioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];
    const ext = uploadFile.name.substring(uploadFile.name.lastIndexOf(".")).toLowerCase();
    if (uploadFile.type.startsWith("audio/") || audioExtensions.includes(ext)) {
      setUploadError("Audio files are strictly excluded from this organization vault. Please upload documents, presentations, sheets, code, or images.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (currentFolderId) formData.append("folderId", currentFolderId);
      formData.append("isPrivate", uploadPrivate ? "1" : "0");
      formData.append("expiryDays", uploadExpiryDays);
      if (uploadExpiryDays === "custom" && customExpiryDate) {
        formData.append("customExpiryDate", customExpiryDate);
      }

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed to upload file");
      } else {
        setShowUploadModal(false);
        setUploadFile(null);
        fetchDirectory();
      }
    } catch (err) {
      setUploadError("Network error while uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    showConfirmModal({
      title: "Delete File",
      message: "Are you sure you want to delete this file from the organization vault? This action cannot be undone.",
      confirmText: "Delete File",
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/files/${fileId}`, { method: "DELETE" });
          fetchDirectory();
        } catch (err) {
          console.error("Delete file error:", err);
        }
      },
    });
  };

  const createShareLink = async (resource: any, pinValue?: string) => {
    setSharingLoading(true);
    try {
      const body: any = resource.type === "file"
        ? { file_id: resource.item.id, label: `Share for ${resource.item.name}` }
        : { folder_id: resource.item.id, label: `Share for folder ${resource.item.name}` };

      if (pinValue && pinValue.trim()) {
        body.pin = pinValue.trim();
      }

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedShare(data);
      }
    } catch (err) {
      console.error("Generate share error:", err);
    } finally {
      setSharingLoading(false);
    }
  };

  const handleOpenShare = async (resource: { type: "file" | "folder"; item: any }) => {
    setSharingResource(resource);
    setGeneratedShare(null);
    setCopiedShareLink(false);
    setShareRequirePin(false);
    setSharePin("");
    setShowShareModal(true);
    await createShareLink(resource);
  };

  const handleCopyLink = () => {
    if (!generatedShare?.token) return;
    const fullUrl = `${window.location.origin}/share/${generatedShare.token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const getFileIcon = (fileName: string, mime: string) => {
    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    if ([".xlsx", ".xls", ".csv"].includes(ext) || mime.includes("spreadsheet")) {
      return <FileSpreadsheet size={20} color="#10b981" />;
    }
    if ([".docx", ".doc"].includes(ext) || mime.includes("word")) {
      return <FileText size={20} color="#3b82f6" />;
    }
    if (ext === ".pdf" || mime === "application/pdf") {
      return <FileCheck size={20} color="#ef4444" />;
    }
    if ([".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext) || mime.startsWith("image/")) {
      return <ImageIcon size={20} color="#a855f7" />;
    }
    if ([".json", ".ts", ".js", ".py", ".md", ".yml", ".html"].includes(ext)) {
      return <Code size={20} color="#06b6d4" />;
    }
    return <FileText size={20} color="#94a3b8" />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Document Vault & Digital Assets
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Secure shared and private storage with multi-format previews & client share links.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            id="btn-new-folder-modal"
            onClick={() => setShowFolderModal(true)}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Folder size={16} />
            <span>New Folder</span>
          </button>

          <button
            id="btn-upload-file-modal"
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "9px 14px" }}
          >
            <Upload size={16} />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="glass-card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem" }}>
        <button
          id="btn-vault-root"
          onClick={() => setCurrentFolderId(null)}
          style={{
            color: currentFolderId === null ? "#ffffff" : "#818cf8",
            fontWeight: currentFolderId === null ? 700 : 500,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <FolderLock size={16} />
          <span>Root Vault</span>
        </button>

        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={14} color="var(--text-muted)" />
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              style={{
                color: currentFolderId === crumb.id ? "#ffffff" : "#818cf8",
                fontWeight: currentFolderId === crumb.id ? 700 : 500,
              }}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
            Folders
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="glass-card"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: folder.is_private ? "rgba(244, 63, 94, 0.15)" : "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: folder.is_private ? "#fb7185" : "#818cf8"
                  }}>
                    {folder.is_private ? <Lock size={18} /> : <Folder size={18} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.92rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {folder.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {folder.file_count || 0} items • {folder.is_private ? "Private" : "Shared"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenShare({ type: "folder", item: folder })}
                    title="Generate Public Share Link"
                    style={{ padding: 6, borderRadius: 6, color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.04)" }}
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    title="Delete Folder"
                    style={{ padding: 6, borderRadius: 6, color: "#fb7185", background: "rgba(244, 63, 94, 0.1)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
          Files & Documents
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="glass-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
            <FolderLock size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>
              This folder is empty
            </h3>
            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto 18px" }}>
              Upload project specifications, Excel sheets, client guidelines, or images to view and share them.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
              style={{ fontSize: "0.85rem" }}
            >
              <Upload size={15} />
              <span>Upload Document</span>
            </button>
          </div>
        ) : (
          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "14px 18px" }}>Document Name</th>
                    <th style={{ padding: "14px 16px" }}>Format</th>
                    <th style={{ padding: "14px 16px" }}>Size</th>
                    <th style={{ padding: "14px 16px" }}>Uploaded By</th>
                    <th style={{ padding: "14px 16px" }}>Visibility</th>
                    <th style={{ padding: "14px 16px" }}>Retention / Expiry</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "rgba(255, 255, 255, 0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {getFileIcon(file.name, file.mime_type)}
                          </div>
                          <div>
                            <div
                              onClick={() => setPreviewingFile(file)}
                              style={{ fontWeight: 600, color: "#ffffff", cursor: "pointer", textDecoration: "underline" }}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{file.created_at}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className="badge badge-indigo" style={{ fontSize: "0.68rem" }}>
                          {file.name.substring(file.name.lastIndexOf(".") + 1).toUpperCase() || "DOC"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                        {(file.file_size / 1024).toFixed(1)} KB
                      </td>

                      <td style={{ padding: "14px 16px", color: "#e2e8f0" }}>
                        {file.uploaded_by_name || "Partner"}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {file.is_private ? (
                          <span className="badge badge-rose" style={{ fontSize: "0.68rem" }}>Private</span>
                        ) : (
                          <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>Shared</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {file.expires_at ? (
                          <span className="badge badge-amber" style={{ fontSize: "0.68rem" }} title={`Auto-purges on: ${file.expires_at}`}>
                            <Clock size={11} />
                            <span>Expires {file.expires_at.split(" ")[0]}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Permanent</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          {/* Preview Button */}
                          <button
                            id={`btn-preview-${file.id}`}
                            onClick={() => setPreviewingFile(file)}
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.76rem" }}
                            title="Interactive In-App Preview"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>

                          {/* Share Public Link */}
                          <button
                            id={`btn-share-${file.id}`}
                            onClick={() => handleOpenShare({ type: "file", item: file })}
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.76rem" }}
                            title="Generate Client Share Link"
                          >
                            <Share2 size={13} />
                            <span>Share</span>
                          </button>

                          {/* Download */}
                          <a
                            href={`/api/files/${file.id}?download=1`}
                            download
                            title="Direct Download"
                            style={{ padding: 6, borderRadius: 6, color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.04)" }}
                          >
                            <Download size={14} />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            title="Delete"
                            style={{ padding: 6, borderRadius: 6, color: "#fb7185", background: "rgba(244, 63, 94, 0.1)" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewingFile && (
        <DocumentPreviewModal
          file={previewingFile}
          onClose={() => setPreviewingFile(null)}
          onOpenShareModal={(f) => handleOpenShare({ type: "file", item: f })}
        />
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            width: "100%",
            maxWidth: 420,
            background: "#0f172a",
            border: "1px solid var(--border-medium)",
            borderRadius: 20,
            padding: 26,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>Create New Folder</h3>
              <button onClick={() => setShowFolderModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Folder Name *
                </label>
                <input
                  id="input-new-folder-name"
                  type="text"
                  placeholder="e.g. Q4 Invoices & Receipts"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="checkbox-folder-private"
                  type="checkbox"
                  checked={newFolderPrivate}
                  onChange={(e) => setNewFolderPrivate(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="checkbox-folder-private" style={{ fontSize: "0.84rem", color: "#e2e8f0" }}>
                  Make this folder private to my profile
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowFolderModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button id="btn-submit-folder" type="submit" className="btn-primary">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            width: "100%",
            maxWidth: 480,
            background: "#0f172a",
            border: "1px solid var(--border-medium)",
            borderRadius: 20,
            padding: 26,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>Upload Document to Vault</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadFile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Drop / Select zone */}
              <div style={{
                border: "2px dashed var(--border-medium)",
                borderRadius: 14,
                padding: "24px 16px",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
              }}>
                <Upload size={28} color="#818cf8" style={{ margin: "0 auto 10px" }} />
                <input
                  id="input-file-picker"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                  }}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="input-file-picker"
                  className="btn-secondary"
                  style={{ display: "inline-block", cursor: "pointer", fontSize: "0.85rem", padding: "8px 16px" }}
                >
                  Choose File
                </label>
                {uploadFile && (
                  <div style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 600, marginTop: 10 }}>
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>
                  Supports: PDF, Excel, Word, PPTX, Code, Images.
                </div>
              </div>

              {/* Exclusion Notice */}
              <div style={{
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.2)",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: "0.75rem",
                color: "#fb7185",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <AlertCircle size={14} />
                <span>Audio files are excluded from this business vault per organization policy.</span>
              </div>

              {uploadError && (
                <div style={{ color: "#fb7185", fontSize: "0.82rem" }}>{uploadError}</div>
              )}

              {/* Retention Policy */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Auto-Expiry Retention Policy
                </label>
                <select
                  id="select-file-expiry"
                  value={uploadExpiryDays}
                  onChange={(e) => setUploadExpiryDays(e.target.value)}
                  className="input-field"
                >
                  <option value="never">Permanent (Never Expire)</option>
                  <option value="1">24 Hours (Temporary Client Deliverable)</option>
                  <option value="7">7 Days (1 Week Retention)</option>
                  <option value="30">30 Days (1 Month Retention)</option>
                  <option value="90">90 Days (Quarterly Retention)</option>
                  <option value="custom">Custom Date</option>
                </select>
              </div>

              {uploadExpiryDays === "custom" && (
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Select Expiry Date
                  </label>
                  <input
                    id="input-custom-expiry-date"
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="checkbox-file-private"
                  type="checkbox"
                  checked={uploadPrivate}
                  onChange={(e) => setUploadPrivate(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="checkbox-file-private" style={{ fontSize: "0.84rem", color: "#e2e8f0" }}>
                  Store in my private vault only
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button id="btn-submit-upload" type="submit" disabled={!uploadFile || uploading} className="btn-primary">
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            width: "100%",
            maxWidth: 500,
            background: "#0f172a",
            border: "1px solid var(--border-medium)",
            borderRadius: 20,
            padding: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Share2 size={18} color="#818cf8" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                  Public Shareable Client Link
                </h3>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: 16 }}>
              Anyone with this link can view and download this{" "}
              <strong>{sharingResource?.type === "folder" ? "entire folder" : "document"}</strong> without needing partner credentials. Perfect for client instruction sharing!
            </p>

            {generatedShare ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#080b12",
                  border: "1px solid var(--border-medium)",
                  borderRadius: 10,
                  padding: "8px 12px",
                }}>
                  <input
                    id="input-share-url"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${generatedShare.token}`}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      color: "#38bdf8",
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-mono)",
                      outline: "none"
                    }}
                  />
                  <button
                    id="btn-copy-share-url"
                    onClick={handleCopyLink}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                  >
                    {copiedShareLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedShareLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span>Status: Active • Ready for Client</span>
                  <a
                    href={`/share/${generatedShare.token}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#818cf8", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span>Test Client View</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* PIN Protection Control */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>
                      <input
                        type="checkbox"
                        checked={shareRequirePin}
                        onChange={(e) => setShareRequirePin(e.target.checked)}
                        style={{ accentColor: "var(--accent-primary)", width: 16, height: 16 }}
                      />
                      <span>Require Access PIN for Client</span>
                    </label>
                    <span style={{ fontSize: "0.75rem", color: shareRequirePin ? "#38bdf8" : "var(--text-muted)" }}>
                      {shareRequirePin ? "PIN Gate Active" : "Open Access"}
                    </span>
                  </div>

                  {shareRequirePin && (
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <input
                        type="text"
                        placeholder="Enter 4-8 digit PIN (e.g. 8492)"
                        value={sharePin}
                        onChange={(e) => setSharePin(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "#080b12",
                          border: "1px solid var(--border-medium)",
                          color: "#ffffff",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => createShareLink(sharingResource, sharePin)}
                        disabled={sharingLoading || !sharePin.trim()}
                        className="btn-primary"
                        style={{ padding: "8px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                      >
                        {sharingLoading ? "Updating..." : "Apply PIN"}
                      </button>
                    </div>
                  )}

                  {generatedShare?.share?.is_pin_protected ? (
                    <div style={{ fontSize: "0.78rem", color: "#34d399", display: "flex", alignItems: "center", gap: 6 }}>
                      <Lock size={13} />
                      <span>This shared link is PIN-protected. The client will be asked for the access PIN.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-secondary)" }}>
                Generating secure public token...
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowShareModal(false)} className="btn-secondary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation / Alert Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        variant={confirmModalState.variant}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
