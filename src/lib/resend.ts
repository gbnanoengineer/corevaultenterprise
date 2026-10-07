import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const FROM_EMAIL =
  process.env.RESEND_FROM_ADDRESS && process.env.RESEND_FROM_NAME
    ? `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_ADDRESS}>`
    : process.env.RESEND_FROM_ADDRESS || "no-reply@jioratech.com";

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
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - CoreVault Enterprise</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060911; color: #f1f5f9; margin: 0; padding: 40px 16px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.6);">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; font-size: 22px; text-align: center; box-shadow: 0 0 24px rgba(79, 70, 229, 0.5);">
                CV
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">CoreVault <span style="color: #38bdf8;">Enterprise</span></h1>
              <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Security & Identity Protocol</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 14px; color: #ffffff; font-size: 19px; font-weight: 700;">Password Reset Request</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Hello <strong>${name || "there"}</strong>,<br>
                We received a request to reset the password for your CoreVault account (<strong>${email}</strong>). Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 34px; border-radius: 10px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45); letter-spacing: 0.01em;">
                  Reset Account Password &rarr;
                </a>
              </div>

              <!-- Manual Token Box -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.16); border-radius: 10px; padding: 16px; margin: 28px 0; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">
                  Or use this Security Token directly:
                </p>
                <code style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #38bdf8; letter-spacing: 0.08em; word-break: break-all;">
                  ${resetToken}
                </code>
              </div>

              <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 12px 16px; margin-top: 24px;">
                <p style="margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.5;">
                  ⏱ This recovery link will expire in <strong>1 hour</strong>. If you did not request this, please disregard this email; your credentials remain secure.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              CoreVault Enterprise Workspace OS &bull; Self-Hosted Enterprise Intelligence<br>
              <span style="font-size: 11px; color: #475569;">Protected with Zero-Trust Authentication Protocol</span>
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
      subject: "Reset your password - CoreVault Enterprise",
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
  let description = "Please use the following 6-digit verification code to complete your security verification:";

  if (purpose === "signup") {
    title = "Verify Your Email Address";
    description = "Welcome to CoreVault Enterprise! Use this 6-digit verification code to verify your identity and launch your workspace:";
  } else if (purpose === "login") {
    title = "One-Time Login Code";
    description = "Use this 6-digit security code to sign in to your CoreVault Enterprise workspace without a password:";
  } else if (purpose === "reset_password") {
    title = "Password Reset Code";
    description = "Use this 6-digit security code to verify your identity and set a new password:";
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - CoreVault Enterprise</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060911; color: #f1f5f9; margin: 0; padding: 40px 16px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.6);">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; font-size: 22px; text-align: center; box-shadow: 0 0 24px rgba(79, 70, 229, 0.5);">
                CV
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">CoreVault <span style="color: #38bdf8;">Enterprise</span></h1>
              <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Security Verification Service</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; text-align: center;">
              <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 20px; font-weight: 700;">${title}</h2>
              <p style="margin: 0 0 28px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                ${name ? `Hello <strong>${name}</strong>,<br>` : ""}${description}
              </p>

              <!-- High Visibility 6-Digit OTP Badge -->
              <div style="display: inline-block; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 14px; padding: 20px 42px; margin: 8px 0 24px; box-shadow: 0 0 30px rgba(56, 189, 248, 0.25);">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 38px; font-weight: 800; letter-spacing: 0.3em; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.6); display: inline-block; padding-left: 0.3em;">
                  ${otp}
                </span>
              </div>

              <p style="margin: 0 0 16px; color: #64748b; font-size: 12px; font-weight: 500;">
                Click and copy this code to complete verification.
              </p>

              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 16px; margin-top: 24px; text-align: left;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                  ⏱ Code expires in <strong>10 minutes</strong>.<br>
                  🔒 Never share this code with anyone. CoreVault staff will never ask for your verification code.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              CoreVault Enterprise Workspace OS &bull; Powered by Resend<br>
              <span style="font-size: 11px; color: #475569;">Protected with Zero-Trust Authentication Protocol</span>
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
      subject: `${otp} is your ${title} - CoreVault Enterprise`,
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
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join ${orgName} - CoreVault Enterprise</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060911; color: #f1f5f9; margin: 0; padding: 40px 16px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.6);">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; font-size: 22px; text-align: center; box-shadow: 0 0 24px rgba(16, 185, 129, 0.5);">
                CV
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">CoreVault <span style="color: #34d399;">Enterprise</span></h1>
              <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Workspace Collaboration Invitation</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 14px; color: #ffffff; font-size: 19px; font-weight: 700;">You're Invited to Join ${orgName}!</h2>
              <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to collaborate in the <strong>${orgName}</strong> organization on CoreVault Enterprise.
              </p>

              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px; margin: 24px 0;">
                <p style="margin: 0 0 10px; color: #ffffff; font-weight: 600; font-size: 13px;">What you will have access to:</p>
                <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.7;">
                  <li>Shared organization budgets, ledger, and cash-flow metrics</li>
                  <li>Secure document vault and cloud assets</li>
                  <li>SaaS subscriptions & team partner settlements</li>
                </ul>
              </div>

              <!-- Accept CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 10px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45); letter-spacing: 0.01em;">
                  Accept Invitation & Launch Workspace &rarr;
                </a>
              </div>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
                This invitation link is valid for <strong>7 days</strong>.<br>
                Accepting this invitation links your email (<strong>${email}</strong>) to ${orgName}. You will still be able to create and manage your own independent organizations.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              CoreVault Enterprise Workspace OS &bull; Powered by Resend<br>
              <span style="font-size: 11px; color: #475569;">Protected with Zero-Trust Authentication Protocol</span>
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
      subject: `Invitation to join ${orgName} - CoreVault Enterprise`,
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
