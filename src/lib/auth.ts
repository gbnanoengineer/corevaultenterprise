import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE_NAME = "expense_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "partner_auth_session_secret_key_2026_super_safe";

export interface User {
  id: string;
  email: string;
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

export async function setSessionCookie(userId: string) {
  const token = signToken({ userId, ts: Date.now() });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const payload = verifyToken<{ userId: string }>(sessionCookie);
    if (!payload?.userId) return null;

    const user = db
      .prepare("SELECT id, email, username, display_name, avatar_color, role, created_at FROM users WHERE id = ?")
      .get(payload.userId) as User | undefined;

    return user || null;
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}

// Authenticate user with Email and Password
export async function authenticateWithPassword(email: string, password: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT id, email, username, display_name, password_hash, avatar_color, role, created_at FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?")
    .get(cleanEmail, cleanEmail) as (User & { password_hash?: string }) | undefined;

  if (!row || !row.password_hash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, row.password_hash);
  if (!isValid) {
    return null;
  }

  const { password_hash, ...user } = row;
  return user as User;
}

// Create new user (Sign Up)
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user?: User; error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (!cleanName) {
    return { error: "Please enter your name." };
  }
  if (!data.password || data.password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  // Check if user already exists
  const existing = db
    .prepare("SELECT id FROM users WHERE LOWER(email) = ?")
    .get(cleanEmail) as { id: string } | undefined;

  if (existing) {
    return { error: "An account with this email address already exists. Please log in." };
  }

  const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;
  const username = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + crypto.randomBytes(3).toString("hex");
  const passwordHash = await bcrypt.hash(data.password, 10);

  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // Check how many users exist; if 0 or 1, can be admin/founder
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number };
  const role = countRow.cnt === 0 ? "admin" : "member";

  db.prepare(`
    INSERT INTO users (id, email, username, display_name, password_hash, pin_hash, avatar_color, role)
    VALUES (?, ?, ?, ?, ?, '', ?, ?)
  `).run(userId, cleanEmail, username, cleanName, passwordHash, randomColor, role);

  const newUser: User = {
    id: userId,
    email: cleanEmail,
    username,
    display_name: cleanName,
    avatar_color: randomColor,
    role,
    created_at: new Date().toISOString(),
  };

  return { user: newUser };
}

// Create password reset token
export async function createPasswordResetToken(email: string): Promise<{ token: string; user: User } | null> {
  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare("SELECT id, email, username, display_name, avatar_color, role, created_at FROM users WHERE LOWER(email) = ?")
    .get(cleanEmail) as User | undefined;

  if (!user) {
    return null;
  }

  // Invalidate any previous unused tokens for this user
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?").run(user.id);

  // Generate secure URL-safe token (e.g. 32 chars)
  const token = crypto.randomBytes(24).toString("hex");
  const tokenId = `prt_${crypto.randomBytes(8).toString("hex")}`;
  // 1 hour expiration
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, email, token, expires_at, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(tokenId, user.id, user.email, token, expiresAt);

  return { token, user };
}

// Verify reset token
export function verifyResetToken(token: string): { valid: boolean; record?: any; user?: User; error?: string } {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: "Missing or invalid token" };
  }

  const record = db
    .prepare("SELECT * FROM password_reset_tokens WHERE token = ?")
    .get(token.trim()) as { id: string; user_id: string; email: string; token: string; expires_at: string; used: number } | undefined;

  if (!record) {
    return { valid: false, error: "Reset token is invalid or does not exist." };
  }

  if (record.used === 1) {
    return { valid: false, error: "This reset token has already been used. Please request a new one." };
  }

  const expiresTime = new Date(record.expires_at).getTime();
  if (Date.now() > expiresTime) {
    return { valid: false, error: "This reset token has expired (valid for 1 hour). Please request a new one." };
  }

  const user = db
    .prepare("SELECT id, email, username, display_name, avatar_color, role, created_at FROM users WHERE id = ?")
    .get(record.user_id) as User | undefined;

  if (!user) {
    return { valid: false, error: "Associated user account was not found." };
  }

  return { valid: true, record, user };
}

// Reset password with token
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const verification = verifyResetToken(token);
  if (!verification.valid || !verification.record || !verification.user) {
    return { success: false, error: verification.error || "Invalid token" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Mark token as used
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(verification.record.id);

  // Update user password
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, verification.user.id);

  return { success: true };
}

// Change password for currently authenticated user
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  const row = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(userId) as { password_hash?: string } | undefined;

  if (!row || !row.password_hash) {
    return { success: false, error: "User account not found." };
  }

  const isMatch = await bcrypt.compare(currentPassword, row.password_hash);
  if (!isMatch) {
    return { success: false, error: "Current password does not match." };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, userId);

  return { success: true };
}

export function getAllUsers(): User[] {
  return db
    .prepare("SELECT id, email, username, display_name, avatar_color, role, created_at FROM users ORDER BY id ASC")
    .all() as User[];
}

export { COOKIE_NAME };
