# CoreVault

> **Enterprise Finance, Multi-Tenant Workspaces & S3-Powered Cloud Asset Vault**  
> *Self-hosted, ultra-low resource architecture (<20MB RAM) with zero-loss cloud database persistence, automated S3 snapshot backups, and one-click ANSI SQL export migrations.*

---

## 🌟 Overview

**CoreVault** is an all-in-one business management platform and document vault designed for startups, agencies, and modern enterprises. Unlike monolithic enterprise tools that require hundreds of megabytes of RAM and heavy external database services, CoreVault runs an ultra-fast, embedded **SQLite 3 WAL** engine backed by **S3-compatible cloud storage** and **Resend email authentication**.

### Why CoreVault?
1. **Multi-Tenancy with Strict Data Isolation**: Users create, switch between, and collaborate across independent organizations. Organization A cannot access Organization B's data unless explicitly invited.
2. **Zero-Loss Redeployment Architecture**: Prevents SQLite data loss when deploying or redeploying on ephemeral cloud containers (Docker, Railway, Fly.io, Render, VPS) via automatic S3 cold-start restores and continuous live snapshots.
3. **No Vendor Lock-In**: Export your entire database as a clean, migration-ready **ANSI SQL Dump (`.sql`)** or **SQLite binary (`.db`)** with a single click.
4. **Minimal Resource Load**: Runs embedded in-process using under **20 MB RAM** with zero background daemons.

---

## 🚀 Key Capabilities

### 1. Unified Authentication & Team Access
- **Single-Input Smart Auth**: Single email entry automatically detects whether the user needs registration, password login, passwordless OTP login, or password reset.
- **Resend Email Integration**: Dispatches 6-digit branded OTP codes and team invitations.
- **Organization Invitations**: Generate secure email invitation links (`/?inviteToken=...`) with one-click acceptance.
- **Strict Multi-Tenancy**: Organization switching dropdown in navbar; non-members are blocked at the SQL query level (403/404 responses).

### 2. Enterprise Financial Ledger
- **Categorized Expense Tracking**: Log operational expenses with currency, tags, payment methods, and receipt attachments.
- **Client Revenue & Inflows**: Track project retainers, milestone receivables, and pending invoices.
- **SaaS Subscription Tracker**: Live monthly burn-rate calculations and 14-day renewal alerts.
- **Partner Settlement Ledger**: Calculates out-of-pocket spend and 50/50 net partner balances with one-click settlement logging.

### 3. S3 Cloud Document Vault & Asset Engine
- **S3-Compatible Storage**: Connects to Cloudflare R2, MinIO, AWS S3, Wasabi, or Backblaze B2.
- **Sharp Image Compression**: Automatic WebP conversion and EXIF stripping (60%–90% storage savings).
- **Multi-Format In-App Previews**: Interactive preview for Excel (`.xlsx`, `.csv`), Word (`.docx`), PDF, code files, and images.
- **Auto-Expiry Retention Policies**: Set 24h, 7d, 30d, 90d, or custom expiry dates. Expired files are automatically purged from both disk and S3 buckets.
- **Public Share Links**: Secure deliverable links (`/share/[token]`) for external clients.
- **Strict Audio Filter**: Excludes audio formats per organizational document policy.

### 4. Zero-Loss Database Persistence & Migration Hub
- **Cold-Start Auto-Restore**: If deployed on an ephemeral container without a mounted volume, CoreVault automatically checks S3 for the latest database snapshot and restores it on startup.
- **Live S3 Snapshots**: Atomic `VACUUM INTO` and WAL checkpoints push live database backups straight to your S3 bucket without blocking queries.
- **1-Click SQL Dump**: Download a complete `.sql` script containing all schemas and table inserts for easy migration to PostgreSQL, MySQL, LibSQL, or Supabase.
- **1-Click SQLite Backup**: Download raw `.db` file for offline preservation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) with Write-Ahead Logging (WAL)
- **Cloud Storage**: [@aws-sdk/client-s3](https://aws.amazon.com/sdk-for-javascript/)
- **Email Service**: [Resend](https://resend.com/)
- **Asset Processing**: [Sharp](https://sharp.pixelplumbing.com/) (WebP), [SheetJS](https://sheetjs.com/) (Excel), [Mammoth](https://github.com/mwilliamson/mammoth.js) (Word)
- **Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Application Host
PORT=3000

# Database & Volume Persistence
DATA_DIR=./data
DATABASE_PATH=./data/corevault.db

# Resend Email Configuration (OTP & Invitations)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_ADDRESS=no-reply@yourdomain.com
RESEND_FROM_NAME="CoreVault Security"

# S3-Compatible Cloud Storage (Cloudflare R2, MinIO, AWS S3)
S3_URL=https://<account_id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET-KEY=your_s3_secret_key
BUCKET_NAME=corevault-assets
S3_REGION=us-east-1
```

---

## 📦 Deployment Guide

### Option 1: Docker (Recommended)

CoreVault comes with multi-stage Docker build support:

```bash
# Build and run with persistent volume
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  --name corevault \
  corevault:latest
```

### Option 2: Railway / Fly.io / Render / VPS

1. **Mount a Volume**: Attach a persistent disk volume to `/app/data` (set `DATA_DIR=/app/data`).
2. **S3 Backup Protection**: If running on an ephemeral host without persistent disks, configure your S3 credentials in environment variables. CoreVault will automatically push snapshots to S3 and auto-restore them on container cold-starts.

---

## 💻 Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-username/corevault.git
cd corevault

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ License

MIT License. Free for personal, agency, and enterprise use.
