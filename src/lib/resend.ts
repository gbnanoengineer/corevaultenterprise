import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const FROM_EMAIL =
  process.env.RESEND_FROM_ADDRESS && process.env.RESEND_FROM_NAME
    ? `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_ADDRESS}>`
    : process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev";

interface SendPasswordResetParams {
  email: string;
  name: string;
  resetToken: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetToken,
  resetUrl,
}: SendPasswordResetParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env. Reset token for", email, "is:", resetToken);
    return {
      success: true,
      error: "RESEND_API_KEY not configured. Token logged to server console for testing.",
    };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: #131b2e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; font-size: 20px; text-align: center;">
                ET
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">ExpenseTracker Vault</h1>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Security & Password Recovery</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 600;">Hello ${name || "there"},</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                We received a request to reset the password for your ExpenseTracker Vault account (<strong>${email}</strong>).
              </p>

              <!-- One click reset button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                  Reset Your Password
                </a>
              </div>

              <!-- Manual Reset Token Box -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                  Or use this Reset Token:
                </p>
                <code style="font-family: monospace; font-size: 16px; font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; word-break: break-all;">
                  ${resetToken}
                </code>
              </div>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                This link and reset token will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email; your account remains secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 11px; color: #475569;">
              ExpenseTracker Vault &bull; Self-Hosted Secure Asset & Financial Intelligence
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Reset your password - ExpenseTracker Vault",
      html,
    });

    if (data.error) {
      console.error("Resend error sending reset email:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (err: any) {
    console.error("Resend execution error:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

interface SendOtpParams {
  email: string;
  otp: string;
  purpose: "signup" | "login" | "reset_password";
  name?: string;
}

export async function sendOtpEmail({
  email,
  otp,
  purpose,
  name,
}: SendOtpParams): Promise<{ success: boolean; id?: string; error?: string }> {
  let title = "Verification Code";
  let description = "Please use the following 6-digit verification code to complete your request:";

  if (purpose === "signup") {
    title = "Verify Your Email Address";
    description = "Welcome! Use this 6-digit verification code to verify your email and complete your registration:";
  } else if (purpose === "login") {
    title = "One-Time Login Code";
    description = "Use this 6-digit security code to sign in to your ExpenseTracker Vault account without a password:";
  } else if (purpose === "reset_password") {
    title = "Password Reset Code";
    description = "Use this 6-digit code to verify your identity and reset your account password:";
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #131b2e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; font-size: 20px; text-align: center;">
                ET
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">ExpenseTracker Vault</h1>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Security Verification</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 600;">${title}</h2>
              <p style="margin: 0 0 28px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                ${name ? `Hello ${name},<br>` : ""}${description}
              </p>

              <!-- Prominent OTP Code Box -->
              <div style="display: inline-block; background: rgba(99, 102, 241, 0.12); border: 1.5px solid rgba(99, 102, 241, 0.45); border-radius: 12px; padding: 18px 36px; margin: 10px 0 24px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);">
                  ${otp}
                </span>
              </div>

              <p style="margin: 20px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                This code is valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 11px; color: #475569;">
              ExpenseTracker Vault &bull; Powered by Resend Transactional Email Engine
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env. OTP for", email, "is:", otp);
    return {
      success: true,
      error: "RESEND_API_KEY not configured. OTP logged to server console for testing.",
    };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `${otp} is your ${title} - ExpenseTracker Vault`,
      html,
    });

    if (data.error) {
      console.error("Resend error sending OTP email:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (err: any) {
    console.error("Resend execution error:", err);
    return { success: false, error: err.message || "Failed to send OTP email" };
  }
}

interface SendOrgInvitationParams {
  email: string;
  inviterName: string;
  orgName: string;
  inviteUrl: string;
}

export async function sendOrganizationInvitationEmail({
  email,
  inviterName,
  orgName,
  inviteUrl,
}: SendOrgInvitationParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join ${orgName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: #131b2e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; font-size: 20px; text-align: center;">
                ET
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">ExpenseTracker Vault</h1>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Team Collaboration Invitation</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 600;">You're Invited!</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ExpenseTracker Vault.
              </p>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Collaborate on shared budgets, document vaults, subscriptions, and financial logs. You will also be able to create and manage your own independent organizations.
              </p>

              <!-- Join button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                  Accept Invitation & Join Organization
                </a>
              </div>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                This invitation is valid for <strong>7 days</strong>. If you already have an account, signing in with <strong>${email}</strong> will automatically link you to ${orgName}.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 11px; color: #475569;">
              ExpenseTracker Vault &bull; Powered by Resend
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env. Invite URL for", email, "is:", inviteUrl);
    return {
      success: true,
      error: "RESEND_API_KEY not configured. Invitation URL logged to server console.",
    };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Invitation to join ${orgName} on ExpenseTracker Vault`,
      html,
    });

    if (data.error) {
      console.error("Resend error sending invitation email:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (err: any) {
    console.error("Resend execution error:", err);
    return { success: false, error: err.message || "Failed to send invitation email" };
  }
}
