import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { getDatabaseStats, exportSqlDump, backupDatabaseToS3, restoreDatabaseFromS3 } from "@/lib/dbBackup";
import { DB_PATH } from "@/lib/db";
import fs from "fs";

export async function GET(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "stats";

    if (action === "stats") {
      const stats = getDatabaseStats();
      return NextResponse.json({ stats });
    }

    if (action === "download_sql") {
      const sqlContent = exportSqlDump();
      const filename = `corevault_dump_${new Date().toISOString().split("T")[0]}.sql`;

      return new NextResponse(sqlContent, {
        headers: {
          "Content-Type": "application/sql",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (action === "download_db") {
      if (!fs.existsSync(DB_PATH)) {
        return NextResponse.json({ error: "Database file not found" }, { status: 404 });
      }

      const buffer = fs.readFileSync(DB_PATH);
      const filename = `corevault_backup_${new Date().toISOString().split("T")[0]}.db`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("Database admin GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to process database request" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isOwner, isAdmin } = context;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only organization owners or administrators can perform cloud database snapshots or restores." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action;

    if (action === "backup_to_s3") {
      const result = await backupDatabaseToS3();
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to backup to S3" }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: `Database snapshot successfully uploaded to S3 cloud storage (${(result.size / 1024).toFixed(1)} KB)!`,
        backup: result,
      });
    }

    if (action === "restore_from_s3") {
      const result = await restoreDatabaseFromS3();
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to restore from S3" }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: `Database successfully restored from S3 cloud backup (${(result.size / 1024).toFixed(1)} KB)!`,
        restore: result,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Database admin POST error:", error);
    return NextResponse.json({ error: error.message || "Database action failed" }, { status: 500 });
  }
}
