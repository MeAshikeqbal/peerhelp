/**
 * Escapes special HTML characters to prevent injection via user-controlled strings
 * (listing titles, user names, message bodies, etc.).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validates that a CTA href is a safe absolute https/http URL.
 * Falls back to "#" for anything that could be a JS injection vector
 * (e.g. javascript:, data:, etc.).
 */
export function safeHref(href: string): string {
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return href;
    }
  } catch {
    // malformed URL
  }
  return "#";
}

/** Shared inline style constants */
const LOGO = `PeerHelp<span style="color:#36F4A4;letter-spacing:-0.02em;"><span style="font-weight:500;">/</span><span style="font-weight:300;">/</span><span style="font-weight:100;">/</span></span>`;

const OUTER_WRAP = `
  <div style="margin:0;padding:0;background:#000000;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;color:#ffffff;background:radial-gradient(circle at top,rgba(54,244,164,0.18),transparent 42%),#000000;">
      <div style="border:1px solid #1E2C31;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#061A1C 0%,#02090A 100%);box-shadow:0 24px 60px rgba(0,0,0,0.35);">
`;

const OUTER_CLOSE = `
      </div>
    </div>
  </div>
`;

const FOOTER_COMMON = (prefsHref: string) => `
  <div style="padding:0 28px 24px;">
    <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:18px;"></div>
    <p style="margin:0;color:#71717A;font-size:12px;line-height:1.5;text-align:center;">
      PeerHelp &bull; College marketplace for verified students<br>
      <a href="${safeHref(prefsHref)}" style="color:#52525B;text-decoration:underline;">Manage email preferences</a>
    </p>
  </div>
`;

/**
 * Builds the HTML body for a notification email.
 * All user-controlled inputs (title, body, ctaLabel) are HTML-escaped.
 * ctaHref is validated to be a safe absolute URL.
 */
export function buildNotificationHtml({
  title,
  body,
  ctaLabel,
  ctaHref,
  prefsHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  prefsHref: string;
}): string {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeCta = escapeHtml(ctaLabel);
  const safeLink = safeHref(ctaHref);

  return `
    ${OUTER_WRAP}
      <div style="padding:28px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0 0 16px;font-size:18px;letter-spacing:0.24em;font-weight:500;color:#ffffff;">
          ${LOGO}
        </p>
        <h1 style="margin:0;font-size:26px;line-height:1.15;font-weight:400;letter-spacing:-0.02em;color:#ffffff;">
          ${safeTitle}
        </h1>
      </div>

      <div style="padding:28px;">
        <p style="margin:0 0 24px;color:#A1A1AA;font-size:16px;line-height:1.6;">
          ${safeBody}
        </p>
        <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:#36F4A4;color:#000000;font-size:15px;font-weight:600;border-radius:10px;text-decoration:none;letter-spacing:-0.01em;">
          ${safeCta}
        </a>
      </div>

      ${FOOTER_COMMON(prefsHref)}
    ${OUTER_CLOSE}
  `;
}

/**
 * Builds the HTML body for an OTP verification email.
 * `otp` is server-generated (numeric), but escaped anyway for defence in depth.
 */
export function buildOtpHtml(otp: string): string {
  const safeOtp = escapeHtml(otp);

  return `
    ${OUTER_WRAP}
      <div style="padding:28px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0 0 16px;font-size:18px;letter-spacing:0.24em;font-weight:500;color:#ffffff;">
          ${LOGO}
        </p>
        <h1 style="margin:0;font-size:28px;line-height:1.1;font-weight:400;letter-spacing:-0.02em;color:#ffffff;">
          Confirm your college email
        </h1>
      </div>

      <div style="padding:28px;">
        <p style="margin:0 0 18px;color:#A1A1AA;font-size:16px;line-height:1.6;">
          Use this one-time code to finish verifying your college account.
        </p>

        <div style="margin:0 0 22px;padding:22px 20px;border-radius:16px;border:1px solid #1E2C31;background:rgba(255,255,255,0.03);text-align:center;">
          <div style="color:#D4D4D8;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:12px;">
            Verification code
          </div>
          <div style="font-size:34px;line-height:1;letter-spacing:0.28em;font-weight:700;color:#ffffff;font-variant-numeric:tabular-nums;">
            ${safeOtp}
          </div>
        </div>

        <p style="margin:0 0 10px;color:#A1A1AA;font-size:14px;line-height:1.6;">
          This code expires in 10 minutes.
        </p>
        <p style="margin:0;color:#71717A;font-size:14px;line-height:1.6;">
          If you did not request this code, you can ignore this email.
        </p>
      </div>

      <div style="padding:0 28px 24px;">
        <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:18px;"></div>
        <p style="margin:0;color:#71717A;font-size:12px;line-height:1.5;text-align:center;">
          PeerHelp &bull; College marketplace for verified students
        </p>
      </div>
    ${OUTER_CLOSE}
  `;
}
