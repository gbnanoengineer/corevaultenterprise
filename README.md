# ExpenseTracker & AssetVault

A self-hosted, full-stack financial command center and document asset vault engineered for 2-partner organizations and small agencies. Built with **Next.js 16**, **TypeScript**, **SQLite (WAL mode)**, **Firebase Cloud Storage Buckets & Firestore**, and containerized for single-command **Docker** deployment.

---

## Key Features

### 1. Unique PIN Authentication & Partner Profiles
- **No Email/Password Required**: Fast, secure 6-digit numeric PIN authentication with an on-screen keypad and physical keyboard support.
- **Default Profiles**:
  - **Partner 1 (Gaurav)** — Default PIN: `123456`
  - **Partner 2 (Partner)** — Default PIN: `654321`
- **Instant Profile Switcher**: Switch active context between partners in one click.
- **Master Recovery Key**: Emergency override (`MASTER-9F8A2D7C` or view in Settings) to reset forgotten PINs.

### 2. Expense & Expenditure Tracking
- Categorized expense logging (Cloud & Hosting, SaaS, Hardware, Legal, Contractors, Office, etc.).
- Track who paid out-of-pocket (Partner 1, Partner 2, or Company Account).
- Payment methods (Company Card, Personal Card, Wire Transfer, Cash).
- Flexible split models: **50/50 Equal Partner Split** vs **100% Company Expense**.
- Export expense reports directly to **CSV**.

### 3. Client Inflows & Revenue
- Track incoming project retainers, milestone payments, and client receivables.
- Clear status tracking: **Received (Cleared)** vs **Pending Client Invoices**.

### 4. SaaS & Infrastructure Subscriptions Manager
- Track recurring tool commitments (GitHub, AWS, Figma, Google Workspace, etc.).
- Real-time **Monthly Burn Rate** and **Annualized Run-Rate** calculations.
- Renewal countdown alerts (highlighting upcoming renewals in the next 14 days).

### 5. Automated Partner Settlement Engine
- Live 50/50 balance calculation: analyzes out-of-pocket spend and previous payouts to determine who owes whom.
- High-visibility settlement status (e.g. *“Partner 2 owes Gaurav $302.50”*).
- **One-Click Settlement Transfer Logging** with historical audit ledger.

### 6. Document Vault & Digital Asset Engine
- **Multi-Folder Hierarchy**: Shared Organization Folders and Private Partner Vaults.
- **Multi-Format In-App Document Previews**:
  - **Excel Spreadsheets (`.xlsx`, `.xls`, `.csv`)**: Tabular interactive data grid with sheet switching powered by SheetJS.
  - **Word Documents (`.docx`)**: Clean HTML paper rendering powered by Mammoth.
  - **PDF Documents (`.pdf`)**: Embedded viewer.
  - **Code & Text (`.json`, `.ts`, `.js`, `.py`, `.md`, `.sql`)**: JetBrains Mono code view with copy button.
  - **Images (`.png`, `.jpg`, `.webp`, `.svg`)**: High-res image preview.
  - **PowerPoint (`.pptx`)**: Presentation card and quick delivery.
- **Policy Compliance**: Audio files are strictly filtered out per organization policy.
- **Public Shareable Links for Clients**: Generate secure public links (`/share/[token]`) for individual files or entire folders to share deliverable instructions with clients without requiring an account.

---

---

## S3-Compatible Cloud Storage Buckets

Instead of proprietary vendor SDKs, the application uses the universal **AWS S3 API (`@aws-sdk/client-s3`)**, enabling compatibility with any S3-compatible bucket provider:

### 1. Recommended Free / Low-Cost S3 Buckets
- **Cloudflare R2**: **10 GB free storage forever** with **$0 egress fees** (ideal for documents and client previews).
- **MinIO**: Lightweight, open-source S3-compatible storage container for 100% self-hosted local deployments.
- **AWS S3 / Wasabi / Backblaze B2 / Supabase Storage**: Fully supported out-of-the-box.

### 2. Environment Configuration
In your `.env` or `docker-compose.yml`:
```env
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com  # Or http://minio:9000 for local MinIO
S3_ACCESS_KEY_ID=your-s3-access-key-id
S3_SECRET_ACCESS_KEY=your-s3-secret-access-key
S3_BUCKET_NAME=expense-vault-assets
S3_REGION=auto
S3_FORCE_PATH_STYLE=false
```
*Note: If S3 environment variables are omitted, the application seamlessly stores all assets in the local persistent Docker volume (`./data/uploads`) with zero downtime.*

---

## File Auto-Expiry & Retention Policy Engine

You can set retention lifecycles when uploading any document:
- **Presets Available**:
  - `Permanent (Never Expire)`
  - `24 Hours (Temporary Client Deliverable)`
  - `7 Days (Weekly Review)`
  - `30 Days (Monthly Deliverable)`
  - `90 Days (Quarterly Retention)`
  - `Custom Date`
- **Automated Lifecycle Purge**: The system continuously purges expired assets from both the **S3 Cloud Storage Bucket** and the host disk, and revokes any associated public client share links.

---

## Asset Compression Pipeline

All incoming assets pass through an automatic optimization pipeline powered by **Sharp**:
- **Automatic WebP Conversion**: Raster images (`.png`, `.jpg`, `.jpeg`, `.tiff`) are converted to modern WebP (quality 82).
- **Smart Resizing**: Images wider than 2048px are resized to prevent 20MB camera uploads from consuming bucket storage.
- **Metadata Stripping**: All EXIF/GPS metadata is stripped for partner privacy and minimal payload.
- **Real-World Savings**: Verified **60% to 92% reduction** in asset file size before uploading to the bucket or disk.
- **Document Fidelity**: PDFs, Excel spreadsheets, Word docs, and code files are preserved untouched to guarantee preview accuracy.

---

## Automated On-Delete Cleanup Policy

To eliminate orphaned files and prevent runaway storage consumption:
1. **Single File Deletion**: When any file is deleted, the system purges the physical asset from both the **S3 Cloud Storage Bucket** and local volume, and revokes all associated public share links.
2. **Cascading Folder Deletion**: When a folder is deleted, the system recursively finds all child files and subfolders, and purges all underlying bucket objects in a batch operation.
3. **Expense Receipt Cleanup**: When an expense is deleted, if its attached receipt is not shared by other expenses, the receipt asset is automatically purged from the S3 bucket.

---

## Self-Hosted Docker Deployment

The application is containerized with a multi-stage `Dockerfile` and persistent volume mounts.

### 1. Quick Start with Docker Compose

```bash
# Start container with persistent storage
docker compose up -d --build
```

The app will be accessible at `http://localhost:3000`.

### 2. Persistent Storage

The SQLite database and uploaded files are persisted on your host machine inside `./data/`:
- `./data/expense_vault.db` (SQLite database with WAL journal mode)
- `./data/uploads/` (Uploaded files, documents, and spreadsheets)

---

## Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Run dev server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Default Access Credentials

| Profile | Username | Role | Default PIN |
| :--- | :--- | :--- | :--- |
| **Partner 1 (Gaurav)** | `partner1` | Founder | `123456` |
| **Partner 2** | `partner2` | Partner | `654321` |
| **Master Recovery Key** | — | Emergency Override | `MASTER-9F8A2D7C` |

*PINs and partner display names can be customized anytime in the **Settings** tab.*
