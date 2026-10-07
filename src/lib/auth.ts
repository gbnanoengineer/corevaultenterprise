import { cookies } from "next/headers";
import crypto from "crypto";
import { db, hashPin } from "./db";

const COOKIE_NAME = "expense_session";
const SESSION_SECRET = "partner_auth_session_secret_key_2026_super_safe";

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  role: string;
  created_at: string;
}

export function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken<T>(token: string): T | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const payload = verifyToken<{ userId: string }>(sessionCookie);
  if (!payload?.userId) return null;

  const user = db
    .prepare("SELECT id, username, display_name, avatar_color, role, created_at FROM users WHERE id = ?")
    .get(payload.userId) as User | undefined;

  return user || null;
}

export function authenticateWithPin(userId: string, pin: string): User | null {
  const pinHash = hashPin(pin);
  const user = db
    .prepare("SELECT id, username, display_name, avatar_color, role, created_at FROM users WHERE id = ? AND pin_hash = ?")
    .get(userId, pinHash) as User | undefined;

  return user || null;
}

export function getAllUsers(): Omit<User, "pin_hash">[] {
  return db
    .prepare("SELECT id, username, display_name, avatar_color, role, created_at FROM users ORDER BY id ASC")
    .all() as User[];
}

export { COOKIE_NAME };
