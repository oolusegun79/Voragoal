// Outbound transactional email. When RESEND_API_KEY is missing (local dev,
// preview deploys without secrets), email sends become console logs so the
// reset flow can still be tested end-to-end without external dependencies.
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM || "Voragoal <noreply@voragoal.com>";

export async function sendPasswordResetEmail(options: {
  to: string;
  name: string | null;
  resetUrl: string;
}): Promise<{ ok: boolean }> {
  const { to, name, resetUrl } = options;
  const displayName = name?.split(" ")[0] || "there";

  const text = `Hi ${displayName},

Someone (hopefully you) asked to reset the password for your Voragoal account.

Open this link to choose a new password:
${resetUrl}

The link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password will stay the same.

— The Voragoal team
https://voragoal.com`;

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0b1020;color:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;margin:0 0 16px;letter-spacing:-0.01em;">Reset your Voragoal password</h1>
    <p style="margin:0 0 16px;line-height:1.6;color:#cbd5e1;">Hi ${escapeHtml(displayName)},</p>
    <p style="margin:0 0 16px;line-height:1.6;color:#cbd5e1;">
      Someone (hopefully you) asked to reset the password for your Voragoal account.
      Click the button below to choose a new password.
    </p>
    <p style="margin:24px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#1d9bf0;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">
        Reset my password
      </a>
    </p>
    <p style="margin:0 0 8px;line-height:1.6;color:#94a3b8;font-size:13px;">
      Or copy this link into your browser:
    </p>
    <p style="margin:0 0 24px;word-break:break-all;color:#94a3b8;font-size:13px;font-family:ui-monospace,Menlo,monospace;">
      ${escapeHtml(resetUrl)}
    </p>
    <p style="margin:0 0 16px;line-height:1.6;color:#94a3b8;font-size:13px;">
      The link expires in 1 hour. If you didn't request a reset, you can safely ignore this email
      — your password will stay the same.
    </p>
    <hr style="border:0;border-top:1px solid #1f2a44;margin:24px 0;">
    <p style="margin:0;color:#64748b;font-size:12px;">
      Voragoal · Operated by FirstData Consulting LLC<br>
      An independent analytics platform — not affiliated with FIFA.
    </p>
  </div>
</body>
</html>`;

  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set. Would have sent password reset to:",
      to,
      "\nReset URL:",
      resetUrl,
    );
    return { ok: true };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your Voragoal password",
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] Resend send failed:", err);
    return { ok: false };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
