import { Resend } from "resend";

/**
 * Transactional email via Resend (CLAUDE.md §2.2). Designed to degrade
 * gracefully: if RESEND_API_KEY is unset (local dev, or the demo
 * environment where the domain isn't verified) we log the link instead
 * of throwing, so the password-reset flow still works end-to-end without
 * leaking errors to the user.
 *
 * RESEND_FROM overrides the sender; defaults to the project address. A
 * send failure (unverified domain, network) is logged, never thrown —
 * the caller must not reveal whether an address exists.
 */
const FROM = process.env.RESEND_FROM ?? "Meloman <noreply@meloman.bg>";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — password reset link for ${to}: ${resetUrl}`
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Meloman — нулиране на парола / password reset",
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6">
          <h2>Meloman</h2>
          <p>Заявено е нулиране на паролата. Линкът е валиден 15 минути.</p>
          <p>A password reset was requested. This link is valid for 15 minutes.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color:#888;font-size:13px">
            Ако не си заявявал това, игнорирай имейла. /
            If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });
  } catch (err) {
    // Never throw: forgot-password must look identical whether or not
    // the address exists / the mail backend is healthy.
    console.error("[email] password reset send failed:", err);
  }
}

/**
 * Email-verification link. Same graceful degradation as the reset mail:
 * without RESEND_API_KEY (local dev / unverified demo domain) the link
 * is logged instead of thrown, so sign-up still works end to end.
 */
export async function sendVerificationEmail(
  to: string,
  verifyUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — email verification link for ${to}: ${verifyUrl}`
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Meloman — потвърди имейла си / confirm your email",
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6">
          <h2>Meloman</h2>
          <p>Потвърди имейла си, за да активираш профила си. Линкът е валиден 24 часа.</p>
          <p>Confirm your email to activate your account. This link is valid for 24 hours.</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p style="color:#888;font-size:13px">
            Ако не си се регистрирал, игнорирай имейла. /
            If you didn't sign up, ignore this email.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] verification send failed:", err);
  }
}
