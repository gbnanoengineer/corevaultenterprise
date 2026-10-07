import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Safe directory initialization
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // directory might already exist
}

const DB_PATH = path.join(DATA_DIR, "expense_vault.db");
const db = new Database(DB_PATH);

// Concurrency PRAGMAs
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function hashPin(pin: string, salt: string = "org_expense_salt_2026"): string {
  return crypto.pbkdf2Sync(pin, salt, 10000, 32, "sha256").toString("hex");
}

export function generateToken(length: number = 24): string {
  return crypto.randomBytes(length).toString("hex");
}

let initialized = false;

export function initDatabase() {
  if (initialized) return;
  initialized = true;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT,
      pin_hash TEXT,
      avatar_color TEXT NOT NULL DEFAULT '#6366f1',
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      is_private INTEGER DEFAULT 0,
      owner_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      folder_id TEXT,
      uploaded_by_user_id TEXT,
      is_private INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS shared_links (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      file_id TEXT,
      folder_id TEXT,
      created_by_user_id TEXT,
      label TEXT,
      expires_at DATETIME,
      view_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      date TEXT NOT NULL,
      paid_by_user_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      split_type TEXT NOT NULL DEFAULT 'equal',
      notes TEXT,
      receipt_file_id TEXT,
      status TEXT NOT NULL DEFAULT 'settled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paid_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receipt_file_id) REFERENCES files(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      date TEXT NOT NULL,
      received_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      notes TEXT,
      invoice_file_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_file_id) REFERENCES files(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      cost REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      next_renewal_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      auto_renew INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1,
      notes TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Safe schema migrations
  try {
    db.exec("ALTER TABLE files ADD COLUMN expires_at DATETIME;");
  } catch {
    // column already exists
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
  } catch {
    // column already exists
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
  } catch {
    // column already exists
  }

  try {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);");
  } catch {
    // index already exists
  }

  // Pre-hashed default password for initial seed users: 'password123'
  const defaultPasswordHash = bcrypt.hashSync("password123", 10);
  const pinPartner1 = hashPin("123456");
  const pinPartner2 = hashPin("654321");

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, username, display_name, password_hash, pin_hash, avatar_color, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run("user_1", "gaurav@acme.com", "gaurav", "Gaurav", defaultPasswordHash, pinPartner1, "#3b82f6", "founder");
  insertUser.run("user_2", "partner@acme.com", "partner", "Partner", defaultPasswordHash, pinPartner2, "#10b981", "partner");

  // Ensure any existing rows without email or password_hash get populated
  db.prepare(`
    UPDATE users 
    SET email = COALESCE(email, 'gaurav@acme.com'), 
        password_hash = COALESCE(password_hash, ?) 
    WHERE id = 'user_1'
  `).run(defaultPasswordHash);

  db.prepare(`
    UPDATE users 
    SET email = COALESCE(email, 'partner@acme.com'), 
        password_hash = COALESCE(password_hash, ?) 
    WHERE id = 'user_2'
  `).run(defaultPasswordHash);

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)`);
  insertSetting.run("org_name", "Acme Core Ventures");
  insertSetting.run("default_currency", "USD");
  insertSetting.run("master_recovery_key", "MASTER-9F8A2D7C");

  const insertFolder = db.prepare(`
    INSERT OR IGNORE INTO folders (id, name, parent_id, is_private, owner_user_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertFolder.run("folder_shared", "Shared Documents & Projects", null, 0, null);
  insertFolder.run("folder_client_agreements", "Client Contracts & Invoices", "folder_shared", 0, null);
  insertFolder.run("folder_tech_specs", "Technical Specs & Code Snippets", "folder_shared", 0, null);
  insertFolder.run("folder_p1_private", "Gaurav Private Vault", null, 1, "user_1");
  insertFolder.run("folder_p2_private", "Partner Private Vault", null, 1, "user_2");

  const insertSub = db.prepare(`
    INSERT OR IGNORE INTO subscriptions (id, name, category, cost, currency, billing_cycle, next_renewal_date, payment_method, auto_renew, active, notes, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSub.run("sub_1", "GitHub Team", "Dev Tools", 48.0, "USD", "monthly", "2026-10-15", "Company Credit Card", 1, 1, "Source code repos & actions", "https://github.com");
  insertSub.run("sub_2", "AWS Cloud Infrastructure", "Hosting", 185.5, "USD", "monthly", "2026-10-22", "Company Credit Card", 1, 1, "EC2 instances, S3, RDS cluster", "https://aws.amazon.com");
  insertSub.run("sub_3", "Figma Professional", "Design", 30.0, "USD", "monthly", "2026-10-28", "Partner 1 Card", 1, 1, "UI/UX prototypes & design system", "https://figma.com");
  insertSub.run("sub_4", "Google Workspace", "Productivity", 28.0, "USD", "monthly", "2026-11-05", "Partner 2 Card", 1, 1, "Custom email domain & Meet", "https://workspace.google.com");

  const insertExp = db.prepare(`
    INSERT OR IGNORE INTO expenses (id, title, category, amount, currency, date, paid_by_user_id, payment_method, split_type, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertExp.run("exp_1", "Dell UltraSharp 4K Monitor", "Hardware & Equipment", 420.0, "USD", "2026-10-01", "user_1", "Partner 1 Personal Card", "equal", "Workstation upgrade for main desk", "settled");
  insertExp.run("exp_2", "Domain Name Renewals (5 domains)", "Infrastructure", 75.0, "USD", "2026-10-02", "user_2", "Partner 2 Personal Card", "equal", "Namecheap production domain portfolio", "settled");
  insertExp.run("exp_3", "Client Dinner with Fintech Founders", "Meals & Entertainment", 145.0, "USD", "2026-10-04", "user_1", "Company Card", "company", "Quarterly contract negotiation dinner", "settled");
  insertExp.run("exp_4", "Office High-Speed Fiber Internet", "Utilities", 90.0, "USD", "2026-10-05", "user_2", "Bank Transfer", "equal", "Monthly fiber connection 1Gbps", "settled");
  insertExp.run("exp_5", "Legal Consultation for IP & LLC", "Legal & Accounting", 350.0, "USD", "2026-10-06", "user_1", "Bank Transfer", "equal", "Pending company reimbursement", "pending");

  const insertInc = db.prepare(`
    INSERT OR IGNORE INTO incomes (id, title, client_name, amount, currency, date, received_by_user_id, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInc.run("inc_1", "Phase 1 Platform Milestone", "Apex Digital Labs", 3500.0, "USD", "2026-10-02", "user_1", "received", "Direct bank wire to LLC account");
  insertInc.run("inc_2", "DevOps & Cloud Architecture Retainer", "Vanguard Cloud Systems", 2200.0, "USD", "2026-10-05", "user_2", "received", "October monthly retainer payment");
  insertInc.run("inc_3", "API Integration Sprint 2", "BlueHorizon Health", 1800.0, "USD", "2026-10-18", "user_1", "pending", "Invoice sent, expected in 10 days");

  try {
    const { ensureSeedFiles } = require("./seed-files");
    ensureSeedFiles();
  } catch (err) {
    // ignore
  }
}

// Initialize on load
initDatabase();

export { db, DATA_DIR, UPLOADS_DIR };
