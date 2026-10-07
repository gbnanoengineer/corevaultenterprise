import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sendOtpEmail, sendOrganizationInvitationEmail } from "./resend";

const COOKIE_NAME = "expense_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "partner_auth_session_secret_key_2026_super_safe";

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_color: string;
  role: string;
  active_organization_id?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  currency: string;
  role: string;
  created_by_user_id: string;
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
      .prepare(`
        SELECT id, email, username, display_name, avatar_color, role, active_organization_id, created_at 
        FROM users WHERE id = ?
      `)
      .get(payload.userId) as User | undefined;

    return user || null;
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}

// Check whether email exists in database
export function checkEmailExists(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT id FROM users WHERE LOWER(email) = ?")
    .get(cleanEmail);
  return !!row;
}

// Generate and send 6-digit OTP via Resend
export async function generateAndSendOtp(
  email: string,
  purpose: "signup" | "login" | "reset_password",
  name?: string
): Promise<{ success: boolean; otp?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = `otp_${crypto.randomBytes(8).toString("hex")}`;
  // 10 minute expiration
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalidate any previous unused OTPs for this email and purpose
  db.prepare("UPDATE email_otps SET used = 1 WHERE LOWER(email) = ? AND purpose = ?").run(cleanEmail, purpose);

  // Store OTP in database
  db.prepare(`
    INSERT INTO email_otps (id, email, otp, purpose, expires_at, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(otpId, cleanEmail, otp, purpose, expiresAt);

  // Dispatch email via Resend
  const emailRes = await sendOtpEmail({
    email: cleanEmail,
    otp,
    purpose,
    name,
  });

  return {
    success: true,
    otp: process.env.NODE_ENV !== "production" || !emailRes.success ? otp : undefined,
    error: emailRes.error,
  };
}

// Verify OTP
export function verifyOtp(
  email: string,
  otp: string,
  purpose: "signup" | "login" | "reset_password",
  markUsed: boolean = false
): { valid: boolean; recordId?: string; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  if (!cleanOtp || cleanOtp.length !== 6) {
    return { valid: false, error: "Please enter the 6-digit verification code." };
  }

  const record = db
    .prepare(`
      SELECT id, expires_at, used 
      FROM email_otps 
      WHERE LOWER(email) = ? AND otp = ? AND purpose = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `)
    .get(cleanEmail, cleanOtp, purpose) as { id: string; expires_at: string; used: number } | undefined;

  if (!record) {
    return { valid: false, error: "Incorrect verification code. Please check your email and try again." };
  }

  if (record.used === 1) {
    return { valid: false, error: "This verification code has already been used. Please request a new code." };
  }

  if (Date.now() > new Date(record.expires_at).getTime()) {
    return { valid: false, error: "Verification code has expired (valid for 10 minutes). Please request a new code." };
  }

  if (markUsed) {
    db.prepare("UPDATE email_otps SET used = 1 WHERE id = ?").run(record.id);
  }

  return { valid: true, recordId: record.id };
}

// Complete OTP Signup
export async function completeOtpSignup(data: {
  name: string;
  email: string;
  password: string;
  otp: string;
  inviteToken?: string;
}): Promise<{ user?: User; error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { error: "Please provide a valid email address." };
  }
  if (!cleanName) {
    return { error: "Please enter your full name." };
  }
  if (!data.password || data.password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  // Verify OTP
  const otpCheck = verifyOtp(cleanEmail, data.otp, "signup", true);
  if (!otpCheck.valid) {
    return { error: otpCheck.error || "Invalid verification code." };
  }

  // Check if user already exists
  const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail);
  if (existing) {
    return { error: "An account with this email already exists. Please log in instead." };
  }

  const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;
  const username = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + crypto.randomBytes(3).toString("hex");
  const passwordHash = await bcrypt.hash(data.password, 10);
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // Insert user
  db.prepare(`
    INSERT INTO users (id, email, username, display_name, password_hash, pin_hash, avatar_color, role)
    VALUES (?, ?, ?, ?, ?, '', ?, 'member')
  `).run(userId, cleanEmail, username, cleanName, passwordHash, randomColor);

  const newUser: User = {
    id: userId,
    email: cleanEmail,
    username,
    display_name: cleanName,
    avatar_color: randomColor,
    role: "member",
    created_at: new Date().toISOString(),
  };

  // If user was invited via invite token, accept invitation automatically
  if (data.inviteToken) {
    acceptOrganizationInvitation(userId, data.inviteToken);
  }

  return { user: newUser };
}

// Authenticate with Password
export async function authenticateWithPassword(email: string, password: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT id, email, username, display_name, password_hash, avatar_color, role, active_organization_id, created_at FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?")
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

// Authenticate with OTP (Passwordless Login / Forgot Password alternative)
export async function authenticateWithOtp(email: string, otp: string): Promise<{ user?: User; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare("SELECT id, email, username, display_name, avatar_color, role, active_organization_id, created_at FROM users WHERE LOWER(email) = ?")
    .get(cleanEmail) as User | undefined;

  if (!user) {
    return { error: "Account not found for this email address." };
  }

  const otpCheck = verifyOtp(cleanEmail, otp, "login", true);
  if (!otpCheck.valid) {
    return { error: otpCheck.error || "Invalid verification code." };
  }

  return { user };
}

// Reset Password with OTP
export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  const otpCheck = verifyOtp(cleanEmail, otp, "reset_password", true);
  if (!otpCheck.valid) {
    return { success: false, error: otpCheck.error || "Invalid verification code." };
  }

  const user = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail) as { id: string } | undefined;
  if (!user) {
    return { success: false, error: "Account not found." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, user.id);

  return { success: true };
}

// Token-based password reset helpers
export async function createPasswordResetToken(email: string): Promise<{ token: string; user: User } | null> {
  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail) as User | undefined;
  if (!user) return null;

  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?").run(user.id);
  const token = crypto.randomBytes(24).toString("hex");
  const tokenId = `prt_${crypto.randomBytes(8).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, email, token, expires_at, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(tokenId, user.id, user.email, token, expiresAt);

  return { token, user };
}

export function verifyResetToken(token: string): { valid: boolean; record?: any; user?: User; error?: string } {
  if (!token) return { valid: false, error: "Missing token" };
  const record = db.prepare("SELECT * FROM password_reset_tokens WHERE token = ?").get(token.trim()) as any;
  if (!record) return { valid: false, error: "Token not found" };
  if (record.used === 1) return { valid: false, error: "Token already used" };
  if (Date.now() > new Date(record.expires_at).getTime()) return { valid: false, error: "Token expired" };
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(record.user_id) as User | undefined;
  return { valid: true, record, user };
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const check = verifyResetToken(token);
  if (!check.valid || !check.user) return { success: false, error: check.error };
  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(check.record.id);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, check.user.id);
  return { success: true };
}

// Change Password for authenticated user
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

// ==================== ORGANIZATIONS & INVITATIONS ====================

// Get all organizations a user belongs to
export function getUserOrganizations(userId: string): Organization[] {
  return db
    .prepare(`
      SELECT o.id, o.name, o.currency, om.role, o.created_by_user_id, o.created_at
      FROM organizations o
      INNER JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = ?
      ORDER BY o.created_at ASC
    `)
    .all(userId) as Organization[];
}

// Get active organization for user
export function getActiveOrganization(userId: string): Organization | null {
  const user = db
    .prepare("SELECT active_organization_id FROM users WHERE id = ?")
    .get(userId) as { active_organization_id?: string } | undefined;

  if (user?.active_organization_id) {
    const org = db
      .prepare(`
        SELECT o.id, o.name, o.currency, om.role, o.created_by_user_id, o.created_at
        FROM organizations o
        INNER JOIN organization_members om ON o.id = om.organization_id
        WHERE o.id = ? AND om.user_id = ?
      `)
      .get(user.active_organization_id, userId) as Organization | undefined;

    if (org) return org;
  }

  // Fallback to first organization user belongs to
  const all = getUserOrganizations(userId);
  if (all.length > 0) {
    db.prepare("UPDATE users SET active_organization_id = ? WHERE id = ?").run(all[0].id, userId);
    return all[0];
  }

  return null;
}

// Create new Organization
export function createOrganization(
  userId: string,
  name: string,
  currency: string = "USD"
): { organization: Organization } {
  const orgId = `org_${crypto.randomBytes(8).toString("hex")}`;
  const memberId = `mem_${crypto.randomBytes(8).toString("hex")}`;
  const cleanName = name.trim() || "My Organization";

  db.prepare(`
    INSERT INTO organizations (id, name, currency, created_by_user_id)
    VALUES (?, ?, ?, ?)
  `).run(orgId, cleanName, currency, userId);

  db.prepare(`
    INSERT INTO organization_members (id, organization_id, user_id, role)
    VALUES (?, ?, ?, 'owner')
  `).run(memberId, orgId, userId);

  // Set as user's active organization
  db.prepare("UPDATE users SET active_organization_id = ? WHERE id = ?").run(orgId, userId);

  const newOrg: Organization = {
    id: orgId,
    name: cleanName,
    currency,
    role: "owner",
    created_by_user_id: userId,
    created_at: new Date().toISOString(),
  };

  return { organization: newOrg };
}

// Switch active organization
export function switchActiveOrganization(userId: string, organizationId: string): boolean {
  const membership = db
    .prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?")
    .get(organizationId, userId);

  if (!membership) return false;

  db.prepare("UPDATE users SET active_organization_id = ? WHERE id = ?").run(organizationId, userId);
  return true;
}

// Get organization members
export function getOrganizationMembers(organizationId: string) {
  return db
    .prepare(`
      SELECT u.id, u.email, u.display_name, u.avatar_color, om.role, om.joined_at
      FROM organization_members om
      INNER JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ?
      ORDER BY om.joined_at ASC
    `)
    .all(organizationId);
}

// Invite user to Organization
export async function inviteUserToOrganization(
  inviterUserId: string,
  organizationId: string,
  inviteeEmail: string,
  role: string = "member",
  origin: string = "http://localhost:3000"
): Promise<{ success: boolean; token?: string; error?: string }> {
  const cleanEmail = inviteeEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address to invite." };
  }

  const org = db.prepare("SELECT name FROM organizations WHERE id = ?").get(organizationId) as { name: string } | undefined;
  if (!org) return { success: false, error: "Organization not found." };

  const inviter = db.prepare("SELECT display_name FROM users WHERE id = ?").get(inviterUserId) as { display_name: string } | undefined;

  // Check if invitee is already a member
  const existingUser = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail) as { id: string } | undefined;
  if (existingUser) {
    const isMember = db.prepare("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?").get(organizationId, existingUser.id);
    if (isMember) {
      return { success: false, error: "User is already a member of this organization." };
    }
  }

  // Create invitation token
  const token = crypto.randomBytes(24).toString("hex");
  const inviteId = `inv_${crypto.randomBytes(8).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  db.prepare(`
    INSERT INTO organization_invitations (id, organization_id, inviter_user_id, invitee_email, role, token, status, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(inviteId, organizationId, inviterUserId, cleanEmail, role, token, expiresAt);

  const inviteUrl = `${origin}/?inviteToken=${token}`;

  await sendOrganizationInvitationEmail({
    email: cleanEmail,
    inviterName: inviter?.display_name || "A team member",
    orgName: org.name,
    inviteUrl,
  });

  return { success: true, token };
}

// Accept Organization Invitation
export function acceptOrganizationInvitation(
  userId: string,
  token: string
): { success: boolean; organization?: any; error?: string } {
  const invitation = db
    .prepare(`
      SELECT oi.*, o.name as org_name
      FROM organization_invitations oi
      INNER JOIN organizations o ON oi.organization_id = o.id
      WHERE oi.token = ? AND oi.status = 'pending'
    `)
    .get(token.trim()) as any;

  if (!invitation) {
    return { success: false, error: "Invitation is invalid or has already been accepted." };
  }

  if (Date.now() > new Date(invitation.expires_at).getTime()) {
    return { success: false, error: "Invitation has expired." };
  }

  // Add to organization members
  const memberId = `mem_${crypto.randomBytes(8).toString("hex")}`;
  db.prepare(`
    INSERT OR IGNORE INTO organization_members (id, organization_id, user_id, role)
    VALUES (?, ?, ?, ?)
  `).run(memberId, invitation.organization_id, userId, invitation.role || "member");

  // Mark invitation accepted
  db.prepare("UPDATE organization_invitations SET status = 'accepted' WHERE id = ?").run(invitation.id);

  // Set as active organization for user
  db.prepare("UPDATE users SET active_organization_id = ? WHERE id = ?").run(invitation.organization_id, userId);

  return { success: true, organization: { id: invitation.organization_id, name: invitation.org_name } };
}

export function getAllUsers(): User[] {
  return db
    .prepare("SELECT id, email, username, display_name, avatar_color, role, active_organization_id, created_at FROM users ORDER BY id ASC")
    .all() as User[];
}

export { COOKIE_NAME };
