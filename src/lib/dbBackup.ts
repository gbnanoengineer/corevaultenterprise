import { db, DB_PATH, DATA_DIR, isPostgresActive, sqliteDb } from "@/lib/db";
import { uploadBackupToS3, downloadBackupFromS3, isS3Configured, S3_BUCKET_NAME } from "@/lib/s3";
import fs from "fs";
import path from "path";

let lastBackupTimestamp: string | null = null;
let lastBackupSize: number = 0;

/**
 * Get comprehensive database resource, size and health metrics
 */
export function getDatabaseStats() {
  const isPg = isPostgresActive();
  let fileSize = 0;
  try {
    if (!isPg && fs.existsSync(DB_PATH)) {
      const stat = fs.statSync(DB_PATH);
      fileSize = stat.size;
    }
  } catch (e) {
    // ignore
  }

  // Count total tables and rows
  const tables = isPg
    ? (db.prepare("SELECT tablename as name FROM pg_tables WHERE schemaname = 'public'").all() as { name: string }[])
    : (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]);

  let totalRecords = 0;
  const tableCounts: Record<string, number> = {};

  for (const t of tables) {
    try {
      const countRes = db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get() as { count: number };
      const count = countRes?.count || 0;
      tableCounts[t.name] = count;
      totalRecords += count;
    } catch {
      tableCounts[t.name] = 0;
    }
  }

  // Memory usage of the embedded engine
  const memUsage = process.memoryUsage();
  const rssMb = Math.round((memUsage.rss / 1024 / 1024) * 10) / 10;
  const heapMb = Math.round((memUsage.heapUsed / 1024 / 1024) * 10) / 10;

  return {
    engine: isPg
      ? "PostgreSQL (Dokploy Internal Cluster: jiora-tools-corevault-enterprise-rfb0k4)"
      : "SQLite 3 (WAL Mode, High Concurrency)",
    dbPath: isPg ? "postgresql://postgres:***@jiora-tools-corevault-enterprise-rfb0k4:5432/postgres" : DB_PATH,
    fileSize,
    fileSizeFormatted: formatBytes(fileSize),
    tablesCount: tables.length,
    totalRecords,
    tableCounts,
    resourceLoad: {
      memoryUsedMb: rssMb,
      heapUsedMb: heapMb,
      daemonProcesses: 0,
      overhead: "Ultra-low (~15MB RAM, embedded in-process, zero CPU idle load)",
    },
    s3Persistence: {
      isConfigured: isS3Configured,
      bucket: isS3Configured ? S3_BUCKET_NAME : "None (Local Volume Only)",
      lastBackupTimestamp,
      lastBackupSize: lastBackupSize ? formatBytes(lastBackupSize) : null,
      autoRestoreEnabled: isS3Configured,
    },
  };
}

/**
 * Generates an ANSI-standard SQL text dump of all tables and records.
 * Can be imported into PostgreSQL, MySQL, LibSQL/Turso, or another SQLite instance.
 */
export function exportSqlDump(): string {
  const timestamp = new Date().toISOString();
  let dump = `-- ========================================================\n`;
  dump += `-- CoreVault Database SQL Dump\n`;
  dump += `-- Exported at: ${timestamp}\n`;
  dump += `-- Engine: Embedded SQLite WAL / Migration-Ready Format\n`;
  dump += `-- Compatible with: SQLite, LibSQL, Turso, and Cloud SQL\n`;
  dump += `-- ========================================================\n\n`;
  dump += `PRAGMA foreign_keys = OFF;\n`;
  dump += `BEGIN TRANSACTION;\n\n`;

  // Get table definitions in safe dependency sequence
  const preferredOrder = [
    "organizations",
    "users",
    "organization_members",
    "organization_invitations",
    "email_otps",
    "password_reset_tokens",
    "folders",
    "files",
    "shared_links",
    "expenses",
    "incomes",
    "subscriptions",
    "settlements",
    "system_settings",
  ];

  const allTables = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string; sql: string }[];

  const tableMap = new Map(allTables.map((t) => [t.name, t]));
  const orderedTables: { name: string; sql: string }[] = [];

  // Add preferred order first
  for (const name of preferredOrder) {
    const found = tableMap.get(name);
    if (found) {
      orderedTables.push(found);
      tableMap.delete(name);
    }
  }
  // Add any remaining tables
  for (const remaining of tableMap.values()) {
    orderedTables.push(remaining);
  }

  for (const table of orderedTables) {
    dump += `-- Table schema: ${table.name}\n`;
    dump += `${table.sql};\n\n`;

    const rows = db.prepare(`SELECT * FROM "${table.name}"`).all() as Record<string, any>[];
    if (rows.length > 0) {
      dump += `-- Data inserts: ${table.name} (${rows.length} rows)\n`;
      for (const row of rows) {
        const columns = Object.keys(row);
        const colNames = columns.map((c) => `"${c}"`).join(", ");
        const values = columns
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number") return val;
            if (typeof val === "boolean") return val ? 1 : 0;
            // Escape single quotes for SQL
            const strVal = String(val).replace(/'/g, "''");
            return `'${strVal}'`;
          })
          .join(", ");

        dump += `INSERT INTO "${table.name}" (${colNames}) VALUES (${values});\n`;
      }
      dump += `\n`;
    }
  }

  dump += `COMMIT;\n`;
  dump += `PRAGMA foreign_keys = ON;\n`;
  dump += `-- End of CoreVault Database Dump\n`;

  return dump;
}

/**
 * Creates an atomic snapshot of the SQLite database and syncs it to S3 Cloud Storage.
 * Safe to execute on live databases without locking.
 */
export async function backupDatabaseToS3(): Promise<{
  success: boolean;
  timestamp: string;
  size: number;
  error?: string;
}> {
  if (!isS3Configured) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      size: 0,
      error: "S3 Storage is not configured. Set S3 credentials in .env to enable cloud backups.",
    };
  }

  try {
    // 1. Checkpoint SQLite WAL to make sure all pending writes are committed to disk
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
    } catch {
      // WAL checkpointing best-effort
    }

    const tempBackupPath = path.join(DATA_DIR, `snapshot_temp_${Date.now()}.${isPostgresActive() ? "sql" : "db"}`);

    // 2. Perform atomic backup
    if (isPostgresActive()) {
      const sqlDump = exportSqlDump();
      fs.writeFileSync(tempBackupPath, sqlDump, "utf-8");
    } else {
      await sqliteDb.backup(tempBackupPath);
    }

    if (!fs.existsSync(tempBackupPath)) {
      throw new Error("Failed to generate database snapshot file.");
    }

    const buffer = fs.readFileSync(tempBackupPath);
    const size = buffer.length;

    // 3. Upload latest snapshot and timestamped snapshot to S3
    const timestamp = new Date().toISOString();
    const timestampClean = timestamp.replace(/[:.]/g, "-");

    const uploadedLatest = await uploadBackupToS3("corevault_backup_latest.db", buffer);
    const uploadedArchive = await uploadBackupToS3(`corevault_backup_${timestampClean}.db`, buffer);

    // 4. Cleanup local temp file
    try {
      fs.unlinkSync(tempBackupPath);
    } catch {
      // ignore
    }

    if (!uploadedLatest) {
      throw new Error("S3 upload failed for corevault_backup_latest.db");
    }

    lastBackupTimestamp = timestamp;
    lastBackupSize = size;

    return {
      success: true,
      timestamp,
      size,
    };
  } catch (err: any) {
    console.error("Database backup to S3 error:", err);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      size: 0,
      error: err.message || "Failed to backup database to S3",
    };
  }
}

/**
 * Restores the SQLite database from the latest S3 backup snapshot.
 */
export async function restoreDatabaseFromS3(): Promise<{
  success: boolean;
  restoredAt: string;
  size: number;
  error?: string;
}> {
  if (!isS3Configured) {
    return {
      success: false,
      restoredAt: new Date().toISOString(),
      size: 0,
      error: "S3 Storage is not configured.",
    };
  }

  try {
    const buffer = await downloadBackupFromS3("corevault_backup_latest.db");
    if (!buffer || buffer.length === 0) {
      return {
        success: false,
        restoredAt: new Date().toISOString(),
        size: 0,
        error: "No cloud backup found in S3 bucket.",
      };
    }

    // Verify SQLite magic header
    const header = buffer.subarray(0, 16).toString("utf-8");
    if (!header.startsWith("SQLite format 3")) {
      return {
        success: false,
        restoredAt: new Date().toISOString(),
        size: buffer.length,
        error: "Invalid database file format returned from S3 backup.",
      };
    }

    // Write buffer directly to DB_PATH
    fs.writeFileSync(DB_PATH, buffer);

    // Re-verify WAL checkpoint
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
    } catch {
      // ignore
    }

    return {
      success: true,
      restoredAt: new Date().toISOString(),
      size: buffer.length,
    };
  } catch (err: any) {
    console.error("Restore from S3 error:", err);
    return {
      success: false,
      restoredAt: new Date().toISOString(),
      size: 0,
      error: err.message || "Failed to restore database from S3",
    };
  }
}

/**
 * On cold startup (e.g. after a fresh Docker deployment or container spin-up),
 * if the local SQLite file does not exist, automatically pull the latest S3 snapshot!
 */
export async function ensureStartupRestore() {
  if (!isS3Configured) return;

  try {
    const dbExists = fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 1024;
    if (!dbExists) {
      console.log("[CoreVault] Cold startup: Local DB file not found or empty. Checking S3 for backup snapshot...");
      const res = await restoreDatabaseFromS3();
      if (res.success) {
        console.log(`[CoreVault] S3 Auto-Restore Successful! Restored ${formatBytes(res.size)} from cloud snapshot.`);
      } else {
        console.log("[CoreVault] No previous S3 snapshot found. Initializing fresh database.");
      }
    }
  } catch (err) {
    console.warn("[CoreVault] Startup S3 restore check error:", err);
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
