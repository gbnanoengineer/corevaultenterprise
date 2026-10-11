"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CloudUpload,
  Lock,
  Unlock,
  Eye,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
  FileCheck,
  Clock,
  Search,
  Filter,
  RotateCcw,
  Users,
  File
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

  // Filters
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    const audioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (file.type.startsWith("audio/") || audioExtensions.includes(ext)) {
      setUploadError("Audio files are excluded from this business vault per organization policy.");
      return false;
    }
    setUploadFile(file);
    setUploadError("");
    return true;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getUploadFileMeta = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) {
      return { icon: FileText, label: "PDF Document", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.14)" };
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
      return { icon: FileSpreadsheet, label: "Excel Spreadsheet", color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" };
    }
    if (["docx", "doc", "rtf", "odt", "txt", "md"].includes(ext)) {
      return { icon: FileText, label: "Word Document", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.14)" };
    }
    if (["pptx", "ppt", "key"].includes(ext)) {
      return { icon: FileText, label: "PowerPoint Deck", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.14)" };
    }
    if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) {
      return { icon: ImageIcon, label: "Image Asset", color: "#a855f7", bg: "rgba(168, 85, 247, 0.14)" };
    }
    if (["json", "js", "ts", "py", "sql", "html", "css"].includes(ext)) {
      return { icon: Code, label: "Source Code", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.14)" };
    }
    return { icon: File, label: ext ? `${ext.toUpperCase()} File` : "Document", color: "#818cf8", bg: "rgba(129, 140, 248, 0.14)" };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

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

  const getFileTypeGroup = (fileName: string, mime: string = "") => {
    const ext = (fileName || "").substring((fileName || "").lastIndexOf(".")).toLowerCase();
    if ([".xlsx", ".xls", ".csv"].includes(ext) || mime?.includes("spreadsheet")) return "spreadsheet";
    if ([".docx", ".doc"].includes(ext) || mime?.includes("word") || mime?.includes("document")) return "word";
    if (ext === ".pdf" || mime?.includes("pdf")) return "pdf";
    if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"].includes(ext) || mime?.startsWith("image/")) return "image";
    if ([".json", ".ts", ".js", ".py", ".md", ".yml", ".html", ".css", ".sql", ".sh"].includes(ext)) return "code";
    return "other";
  };

  const filteredFolders = folders.filter((folder) => {
    if (search.trim()) {
      if (!folder.name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (visibilityFilter === "shared" && folder.is_private) return false;
    if (visibilityFilter === "private" && !folder.is_private) return false;
    if (fileTypeFilter !== "all") return false;
    return true;
  });

  const filteredFiles = files.filter((file) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (file.name || "").toLowerCase().includes(q);
      const matchOrig = (file.original_name || "").toLowerCase().includes(q);
      if (!matchName && !matchOrig) return false;
    }
    if (visibilityFilter === "shared" && file.is_private) return false;
    if (visibilityFilter === "private" && !file.is_private) return false;
    if (fileTypeFilter !== "all") {
      const group = getFileTypeGroup(file.name || file.original_name || "", file.mime_type || "");
      if (group !== fileTypeFilter) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearch("");
    setFileTypeFilter("all");
    setVisibilityFilter("all");
  };

  const hasActiveFilters = Boolean(search) || fileTypeFilter !== "all" || visibilityFilter !== "all";

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
      <div className="glass-card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", overflowX: "auto", whiteSpace: "nowrap" }}>
        <button
          id="btn-vault-root"
          onClick={() => setCurrentFolderId(null)}
          style={{
            color: currentFolderId === null ? "#ffffff" : "#818cf8",
            fontWeight: currentFolderId === null ? 700 : 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0
          }}
        >
          <FolderLock size={16} />
          <span>Root Vault</span>
        </button>

        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              style={{
                color: currentFolderId === crumb.id ? "#ffffff" : "#818cf8",
                fontWeight: currentFolderId === crumb.id ? 700 : 500,
                flexShrink: 0
              }}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260, flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", width: "100%", maxWidth: 300, flex: "1 1 200px" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              id="input-search-documents"
              type="text"
              placeholder="Search documents, folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, height: 40 }}
            />
          </div>

          {/* Format Filter */}
          <select
            id="select-filter-filetype"
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 160, flex: "1 1 140px" }}
          >
            <option value="all">All Formats</option>
            <option value="spreadsheet">Spreadsheets (Excel/CSV)</option>
            <option value="word">Word Docs (.docx)</option>
            <option value="pdf">PDF Documents</option>
            <option value="image">Images & Graphics</option>
            <option value="code">Code & Data Files</option>
          </select>

          {/* Visibility Filter */}
          <select
            id="select-filter-visibility"
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="input-field"
            style={{ height: 40, width: "auto", minWidth: 130, flex: "1 1 120px" }}
          >
            <option value="all">All Visibility</option>
            <option value="shared">Shared Files</option>
            <option value="private">Private Vault</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              id="btn-reset-document-filters"
              onClick={handleResetFilters}
              className="btn-secondary"
              style={{
                height: 40,
                padding: "0 12px",
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "#f87171",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          Showing: <strong className="tabular-nums" style={{ color: "#ffffff", fontSize: "0.96rem" }}>{filteredFiles.length} files</strong>, {filteredFolders.length} folders
        </div>
      </div>

      {/* Folders Section */}
      {filteredFolders.length > 0 && (
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
            Folders
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))", gap: 14 }}>
            {filteredFolders.map((folder) => (
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
          <>
            {/* Desktop Table View (>= 900px) */}
            <div className="desktop-table-container">
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
                      {filteredFiles.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                            <p style={{ margin: "0 0 10px 0", color: "#ffffff", fontWeight: 600 }}>No documents match your active filters</p>
                            {hasActiveFilters && (
                              <button onClick={handleResetFilters} className="btn-secondary" style={{ fontSize: "0.82rem", margin: "0 auto" }}>
                                Reset Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredFiles.map((file) => (
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
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Card List View (< 900px) */}
            <div className="mobile-card-list">
              {filteredFiles.length === 0 ? (
                <div className="glass-card" style={{ padding: 28, textAlign: "center", color: "var(--text-secondary)" }}>
                  <p style={{ margin: "0 0 8px 0", color: "#ffffff", fontWeight: 600 }}>No documents match your active filters</p>
                  {hasActiveFilters && (
                    <button onClick={handleResetFilters} className="btn-secondary" style={{ fontSize: "0.82rem", margin: "0 auto" }}>
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="glass-card"
                  style={{
                    padding: "16px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {/* File Title and Icon */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {getFileIcon(file.name, file.mime_type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        onClick={() => setPreviewingFile(file)}
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#ffffff",
                          wordBreak: "break-word",
                          cursor: "pointer",
                          textDecoration: "underline"
                        }}
                      >
                        {file.name}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        <span className="badge badge-indigo" style={{ fontSize: "0.68rem" }}>
                          {file.name.substring(file.name.lastIndexOf(".") + 1).toUpperCase() || "DOC"}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          {(file.file_size / 1024).toFixed(1)} KB
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                          • {file.uploaded_by_name || "Partner"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.72rem" }}>
                    {file.is_private ? (
                      <span className="badge badge-rose" style={{ fontSize: "0.68rem" }}>Private</span>
                    ) : (
                      <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>Shared</span>
                    )}

                    {file.expires_at ? (
                      <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>
                        <Clock size={11} />
                        <span>Expires {file.expires_at.split(" ")[0]}</span>
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Permanent Retention</span>
                    )}

                    <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                      {file.created_at?.split(" ")[0]}
                    </span>
                  </div>

                  {/* Mobile Touch Action Buttons */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto auto",
                    gap: 8,
                    paddingTop: 10,
                    borderTop: "1px solid var(--border-subtle)"
                  }}>
                    <button
                      id={`btn-mob-preview-${file.id}`}
                      onClick={() => setPreviewingFile(file)}
                      className="btn-primary"
                      style={{ padding: "8px 10px", fontSize: "0.78rem", justifyContent: "center" }}
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>

                    <button
                      id={`btn-mob-share-${file.id}`}
                      onClick={() => handleOpenShare({ type: "file", item: file })}
                      className="btn-secondary"
                      style={{ padding: "8px 10px", fontSize: "0.78rem", justifyContent: "center" }}
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>

                    <a
                      href={`/api/files/${file.id}?download=1`}
                      download
                      title="Direct Download"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        color: "var(--text-secondary)",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Download size={15} />
                    </a>

                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      title="Delete Document"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        color: "#fb7185",
                        background: "rgba(244, 63, 94, 0.1)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
            </div>
          </>
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
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 420 }}>
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
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 520, padding: 26 }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.16) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#818cf8"
                }}>
                  <CloudUpload size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                    Upload Document to Vault
                  </h3>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    Encrypted cloud storage mirrored directly to S3
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadError("");
                }}
                className="btn-icon"
                style={{ color: "var(--text-muted)", width: 32, height: 32 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadFile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Hidden File Picker Input */}
              <input
                ref={fileInputRef}
                id="input-vault-file-picker"
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
                }}
                style={{ display: "none" }}
              />

              {/* Upload Drop Zone / Selected File Card */}
              {!uploadFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragging ? "2px dashed #818cf8" : "1.5px dashed rgba(255, 255, 255, 0.16)",
                    borderRadius: 16,
                    padding: "30px 20px",
                    textAlign: "center",
                    background: isDragging
                      ? "rgba(99, 102, 241, 0.08)"
                      : "rgba(255, 255, 255, 0.015)",
                    boxShadow: isDragging ? "0 0 24px rgba(99, 102, 241, 0.18)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a5b4fc",
                    margin: "0 auto 12px"
                  }}>
                    <CloudUpload size={26} />
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>
                    Choose a file or drag & drop it here
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 14 }}>
                    Click anywhere inside to browse your device
                  </div>

                  {/* Format Pills */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 12
                  }}>
                    {["PDF", "Word", "Excel", "PPTX", "Code", "Images"].map((fmt) => (
                      <span
                        key={fmt}
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(255, 255, 255, 0.04)",
                          color: "var(--text-secondary)",
                          border: "1px solid rgba(255, 255, 255, 0.06)"
                        }}
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    🔒 Enterprise S3 Cloud Sync · Max 50 MB
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div style={{
                  border: "1.5px solid rgba(99, 102, 241, 0.35)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14
                }}>
                  {(() => {
                    const meta = getUploadFileMeta(uploadFile);
                    const FileIcon = meta.icon;
                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: meta.bg,
                            border: `1px solid ${meta.color}40`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: meta.color,
                            flexShrink: 0
                          }}>
                            <FileIcon size={22} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontSize: "0.88rem",
                              fontWeight: 600,
                              color: "#ffffff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {uploadFile.name}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                {formatFileSize(uploadFile.size)}
                              </span>
                              <span style={{
                                fontSize: "0.68rem",
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: meta.bg,
                                color: meta.color,
                                fontWeight: 600
                              }}>
                                {meta.label}
                              </span>
                              <span style={{
                                fontSize: "0.7rem",
                                color: "#34d399",
                                display: "flex",
                                alignItems: "center",
                                gap: 3
                              }}>
                                <CheckCircle2 size={12} /> Ready
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadFile(null);
                              setUploadError("");
                            }}
                            className="btn-icon"
                            style={{ width: 30, height: 30, color: "var(--text-muted)" }}
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Error Banner if any */}
              {uploadError && (
                <div style={{
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: "0.8rem",
                  color: "#fb7185",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Destination Selector: Shared Workspace vs Private Vault */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                  Vault Destination
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setUploadPrivate(false)}
                    style={{
                      padding: "11px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      border: !uploadPrivate ? "1.5px solid #6366f1" : "1px solid var(--border-subtle)",
                      background: !uploadPrivate ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.02)",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: !uploadPrivate ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: !uploadPrivate ? "#818cf8" : "var(--text-muted)",
                      flexShrink: 0
                    }}>
                      <Users size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: !uploadPrivate ? "#ffffff" : "var(--text-secondary)" }}>
                        Shared Workspace
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Visible to all team partners
                      </div>
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setUploadPrivate(true)}
                    style={{
                      padding: "11px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      border: uploadPrivate ? "1.5px solid #f59e0b" : "1px solid var(--border-subtle)",
                      background: uploadPrivate ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 255, 255, 0.02)",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: uploadPrivate ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: uploadPrivate ? "#fbbf24" : "var(--text-muted)",
                      flexShrink: 0
                    }}>
                      <Lock size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: uploadPrivate ? "#ffffff" : "var(--text-secondary)" }}>
                        Private Vault
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Confidential · Only you
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retention Policy */}
              <div>
                <label style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8
                }}>
                  <Clock size={14} color="#818cf8" />
                  <span>Auto-Expiry Retention Policy</span>
                </label>
                <select
                  id="select-file-expiry"
                  value={uploadExpiryDays}
                  onChange={(e) => setUploadExpiryDays(e.target.value)}
                  className="input-field"
                  style={{ height: 42 }}
                >
                  <option value="never">Permanent (Never Expire — Retained indefinitely)</option>
                  <option value="1">24 Hours (Temporary Client Deliverable)</option>
                  <option value="7">7 Days (1 Week Retention)</option>
                  <option value="30">30 Days (1 Month Retention)</option>
                  <option value="90">90 Days (Quarterly Retention)</option>
                  <option value="custom">Custom Specified Date</option>
                </select>
              </div>

              {uploadExpiryDays === "custom" && (
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Custom Expiry Date
                  </label>
                  <input
                    id="input-custom-expiry-date"
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="input-field"
                    style={{ height: 42 }}
                    required
                  />
                </div>
              )}

              {/* Policy note */}
              <div style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 2px"
              }}>
                <AlertCircle size={13} color="var(--text-muted)" />
                <span>Note: Audio media files are excluded per company compliance policy.</span>
              </div>

              {/* Footer Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadError("");
                  }}
                  className="btn-secondary"
                  style={{ padding: "9px 18px" }}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-upload"
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="btn-primary"
                  style={{
                    padding: "9px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: !uploadFile || uploading ? 0.6 : 1
                  }}
                >
                  <CloudUpload size={16} />
                  <span>{uploading ? "Uploading to Vault..." : "Upload Document"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 500 }}>
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
