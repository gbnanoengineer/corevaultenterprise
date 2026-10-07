import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { db, UPLOADS_DIR } from "./db";

export function ensureSeedFiles() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const fileCount = db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number };
    if (fileCount && fileCount.count > 0) return;

    // 1. Excel sheet: Org_Q4_Projections.xlsx
    const xlsxFileName = "seed_q4_projections.xlsx";
    const xlsxFilePath = path.join(UPLOADS_DIR, xlsxFileName);

    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Month", "Projected Income", "Cloud & Infra", "SaaS Tools", "Freelance Ops", "Net Profit"],
      ["October", 7500, 280, 106, 400, 6714],
      ["November", 9200, 310, 106, 500, 8284],
      ["December", 11500, 350, 120, 650, 10380],
      ["Total Q4", 28200, 940, 332, 1550, 25378],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Q4 Financials");

    const partnersData = [
      ["Partner", "Equity", "Initial Contribution", "Monthly Draw %"],
      ["Partner 1 (Gaurav)", "50%", "$5,000", "50%"],
      ["Partner 2", "50%", "$5,000", "50%"],
    ];
    const wsPartners = XLSX.utils.aoa_to_sheet(partnersData);
    XLSX.utils.book_append_sheet(wb, wsPartners, "Partner Equity");

    const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(xlsxFilePath, xlsxBuffer);
    const xlsxStat = fs.statSync(xlsxFilePath);

    db.prepare(`
      INSERT OR IGNORE INTO files (id, name, original_name, mime_type, file_size, storage_path, folder_id, uploaded_by_user_id, is_private)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "file_seed_xlsx",
      "Org_Q4_Projections.xlsx",
      "Org_Q4_Projections.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xlsxStat.size,
      xlsxFileName,
      "folder_shared",
      "user_1",
      0
    );

    // 2. Project Spec Code file: system-architecture-config.json
    const codeFileName = "seed_system_config.json";
    const codeFilePath = path.join(UPLOADS_DIR, codeFileName);
    const codeContent = JSON.stringify(
      {
        organization: "Acme Core Ventures",
        version: "2.4.0",
        services: [
          { name: "auth-gateway", port: 8080, healthCheck: "/health", replicas: 2 },
          { name: "expense-tracker", port: 3000, database: "sqlite-wal", encryption: "AES-256" },
          { name: "asset-storage", port: 9000, maxFileSizeMb: 100, publicShares: true }
        ],
        billing_rules: {
          split_default: "50-50",
          alert_threshold_usd: 1500,
          currency: "USD"
        }
      },
      null,
      2
    );
    fs.writeFileSync(codeFilePath, codeContent, "utf-8");
    const codeStat = fs.statSync(codeFilePath);

    db.prepare(`
      INSERT OR IGNORE INTO files (id, name, original_name, mime_type, file_size, storage_path, folder_id, uploaded_by_user_id, is_private)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "file_seed_code",
      "system-architecture-config.json",
      "system-architecture-config.json",
      "application/json",
      codeStat.size,
      codeFileName,
      "folder_tech_specs",
      "user_1",
      0
    );

    // 3. Markdown Client Guidelines & Instructions file
    const docFileName = "seed_client_guidelines.md";
    const docFilePath = path.join(UPLOADS_DIR, docFileName);
    const docContent = `# Client Onboarding & Project Milestones
**Organization:** Acme Core Ventures  
**Effective Date:** October 2026

---

### 1. Payment Schedule & Invoicing
- **Sprint Retainers:** Billed on the 1st of every calendar month with net-15 payment terms.
- **Milestone Deliverables:** Released to client staging environment upon payment clearance.
- **Accepted Payment Rails:** ACH Wire, SWIFT transfer, or approved corporate card.

### 2. Communication & SLA
- **Primary Channels:** Slack Connect and Weekly Syncs.
- **Emergency Escalation:** Available 24/7 for P0 infrastructure incidents.
- **Code Repositories:** Shared via private organization access.

### 3. File & Deliverable Handover
All project assets, presentations, and specification documents are accessible through our secured Document Vault share links.
`;
    fs.writeFileSync(docFilePath, docContent, "utf-8");
    const docStat = fs.statSync(docFilePath);

    db.prepare(`
      INSERT OR IGNORE INTO files (id, name, original_name, mime_type, file_size, storage_path, folder_id, uploaded_by_user_id, is_private)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "file_seed_doc",
      "Client_Onboarding_Guidelines.md",
      "Client_Onboarding_Guidelines.md",
      "text/markdown",
      docStat.size,
      docFileName,
      "folder_client_agreements",
      "user_2",
      0
    );

    // 4. Sample public share link
    db.prepare(`
      INSERT OR IGNORE INTO shared_links (id, token, file_id, folder_id, created_by_user_id, label, view_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "share_seed_1",
      "client-onboarding-demo",
      "file_seed_doc",
      null,
      "user_1",
      "Client Public Instructions Link",
      3,
      1
    );
  } catch (err) {
    console.error("ensureSeedFiles safe catch:", err);
  }
}
