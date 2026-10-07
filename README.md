# ExpenseTracker & AssetVault

A self-hosted, full-stack financial command center and document asset vault engineered for 2-partner organizations and small agencies. Built with **Next.js 16**, **TypeScript**, **SQLite (WAL mode)**, and containerized for single-command **Docker** deployment.

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

### 6. Document & Digital Asset Vault
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

## Self-Hosted Docker Deployment

The application is containerized with a multi-stage `Dockerfile` and persistent volume mounts.

### 1. Quick Start with Docker Compose

```bash
# Start the container in detached mode
docker compose up -d --build
```

The app will be accessible at `http://localhost:3000`.

### 2. Persistent Storage

The SQLite database and uploaded files are persisted on your host machine inside the `./data/` directory:
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

### Build Verification
```bash
npm run build
```

---

## Default Access Credentials

| Profile | Username | Role | Default PIN |
| :--- | :--- | :--- | :--- |
| **Partner 1 (Gaurav)** | `partner1` | Founder | `123456` |
| **Partner 2** | `partner2` | Partner | `654321` |
| **Master Recovery Key** | — | Emergency Override | `MASTER-9F8A2D7C` |

*PINs and partner display names can be customized anytime in the **Settings** tab.*
