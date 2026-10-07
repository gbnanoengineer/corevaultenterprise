import { Worker, MessageChannel, receiveMessageOnPort } from "worker_threads";

let worker: Worker | null = null;
let signalSab: SharedArrayBuffer | null = null;
let signalInt32: Int32Array | null = null;
let isConnected = false;
let activeConnectionString = "";

const workerCode = `
const { parentPort } = require("worker_threads");
const { Pool, types } = require("pg");

// Parse TIMESTAMP (1114) and TIMESTAMPTZ (1184) as ISO strings (identical to SQLite strings)
types.setTypeParser(1114, str => str);
types.setTypeParser(1184, str => str);
// Parse BIGINT/INT8 (20) as JavaScript numbers
types.setTypeParser(20, val => parseInt(val, 10));

let pool = null;

parentPort.on("message", async (msg) => {
  const { action, signal, port, connectionString, sql, params } = msg;
  const int32 = new Int32Array(signal);

  try {
    if (action === "init") {
      if (pool) {
        try { await pool.end(); } catch (e) {}
      }
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 4000,
        max: 10,
        idleTimeoutMillis: 30000
      });
      const client = await pool.connect();
      client.release();
      port.postMessage({ success: true });
    } else if (action === "query") {
      if (!pool) throw new Error("PostgreSQL pool is not initialized");
      const res = await pool.query(sql, params);
      port.postMessage({ success: true, rows: res.rows || [], rowCount: res.rowCount || 0 });
    } else if (action === "exec") {
      if (!pool) throw new Error("PostgreSQL pool is not initialized");
      await pool.query(sql);
      port.postMessage({ success: true });
    }
  } catch (err) {
    port.postMessage({ success: false, error: err.message });
  } finally {
    Atomics.store(int32, 0, 1);
    Atomics.notify(int32, 0);
  }
});
`;

function sendSyncMessage(payload: any): any {
  if (!worker || !signalSab || !signalInt32) {
    throw new Error("PostgreSQL sync bridge worker is not running");
  }

  const channel = new MessageChannel();
  Atomics.store(signalInt32, 0, 0);
  worker.postMessage({ ...payload, signal: signalSab, port: channel.port2 }, [channel.port2]);

  Atomics.wait(signalInt32, 0, 0);
  const msg = receiveMessageOnPort(channel.port1);
  channel.port1.close();

  if (!msg || !msg.message) {
    throw new Error("No response received from PostgreSQL worker thread");
  }

  return msg.message;
}

export function convertSqlToPg(sql: string): string {
  let paramIdx = 1;
  // Convert ? to $1, $2, ...
  let converted = sql.replace(/\?/g, () => "$" + paramIdx++);

  // Convert INSERT OR IGNORE INTO table (...) VALUES (...)
  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(converted)) {
    converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
    if (!/ON\s+CONFLICT/i.test(converted)) {
      converted = converted.trim().replace(/;?$/, " ON CONFLICT DO NOTHING;");
    }
  }

  // Convert SQLite date functions
  converted = converted.replace(/datetime\(["']?now["']?\)/gi, "CURRENT_TIMESTAMP");
  converted = converted.replace(/date\(["']?now["']?\)/gi, "CURRENT_DATE");
  converted = converted.replace(/datetime\(([a-zA-Z0-9_.]+)\)/gi, "$1");

  return converted;
}

export function convertDdlToPg(ddl: string): string {
  let converted = ddl.replace(/\bDATETIME\b/gi, "TIMESTAMP");
  converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
  return converted;
}

export function initPostgres(connectionString: string): boolean {
  try {
    if (!worker) {
      signalSab = new SharedArrayBuffer(4);
      signalInt32 = new Int32Array(signalSab);
      worker = new Worker(workerCode, { eval: true });
    }

    const res = sendSyncMessage({
      action: "init",
      connectionString,
    });

    if (res && res.success) {
      isConnected = true;
      activeConnectionString = connectionString;
      console.log("✅ [CoreVault] Connected to PostgreSQL cluster:", connectionString.replace(/:[^:@]+@/, ":***@"));
      return true;
    } else {
      console.warn("⚠️ [CoreVault] PostgreSQL connection attempt failed:", res?.error || "Unknown error");
      isConnected = false;
      return false;
    }
  } catch (err: any) {
    console.warn("⚠️ [CoreVault] PostgreSQL init error:", err.message);
    isConnected = false;
    return false;
  }
}

export function isPostgresConnected(): boolean {
  return isConnected;
}

export function getPostgresConnectionString(): string {
  return activeConnectionString;
}

export function pgQuery(sql: string, params: any[] = []): { rows: any[]; rowCount: number } {
  const convertedSql = convertSqlToPg(sql);
  const res = sendSyncMessage({
    action: "query",
    sql: convertedSql,
    params,
  });

  if (!res.success) {
    throw new Error(res.error || "PostgreSQL query execution failed");
  }

  return { rows: res.rows || [], rowCount: res.rowCount || 0 };
}

export function pgExec(sql: string): void {
  const convertedSql = convertDdlToPg(sql);
  const res = sendSyncMessage({
    action: "exec",
    sql: convertedSql,
  });

  if (!res.success) {
    throw new Error(res.error || "PostgreSQL exec failed");
  }
}

export function createPgStatement(sql: string) {
  return {
    get: (...params: any[]) => {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = pgQuery(sql, flattened);
      return res.rows[0] || null;
    },
    all: (...params: any[]) => {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = pgQuery(sql, flattened);
      return res.rows;
    },
    run: (...params: any[]) => {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = pgQuery(sql, flattened);
      return { changes: res.rowCount, lastInsertRowid: 0 };
    },
  };
}
