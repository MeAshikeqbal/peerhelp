import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const fromName = process.env.RESEND_FROM_NAME ?? "PeerHelp";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://peerhelp.app";

export type NotificationEmailType =
  | "deal_requested"
  | "deal_accepted"
  | "deal_declined"
  | "deal_cancelled"
  | "deal_completed"
  | "rating_received"
  | "verification_approved"
  | "verification_rejected"
  | "verification_changes_requested"
  | "tutor_request_received"
  | "tutor_request_responded";

const EVENT_META: Record<
  NotificationEmailType,
  { subject: string; cta: string; ctaHref: (dealId?: string) => string }
> = {
  deal_requested: {
    subject: "Someone wants to buy your listing",
    cta: "Review deal request",
    ctaHref: (dealId) =>
      dealId ? `${appUrl}/dashboard/deals` : `${appUrl}/dashboard/deals`,
  },
  deal_accepted: {
    subject: "Your deal request was accepted",
    cta: "View deal",
    ctaHref: () => `${appUrl}/dashboard/deals`,
  },
  deal_declined: {
    subject: "Your deal request was declined",
    cta: "Browse marketplace",
    ctaHref: () => `${appUrl}/marketplace`,
  },
  deal_cancelled: {
    subject: "A deal was cancelled",
    cta: "View deals",
    ctaHref: () => `${appUrl}/dashboard/deals`,
  },
  deal_completed: {
    subject: "Deal completed",
    cta: "Leave a rating",
    ctaHref: () => `${appUrl}/dashboard/deals`,
  },
  rating_received: {
    subject: "You received a new rating",
    cta: "View your profile",
    ctaHref: () => `${appUrl}/dashboard/profile`,
  },
  verification_approved: {
    subject: "Your PeerHelp verification was approved",
    cta: "Open dashboard",
    ctaHref: () => `${appUrl}/dashboard`,
  },
  verification_rejected: {
    subject: "Your PeerHelp verification was not approved",
    cta: "Restart verification",
    ctaHref: () => `${appUrl}/student-verification`,
  },
  verification_changes_requested: {
    subject: "Action needed on your PeerHelp verification",
    cta: "Update verification",
    ctaHref: () => `${appUrl}/student-verification/pending-review`,
  },
  tutor_request_received: {
    subject: "New tutor session request",
    cta: "Review request",
    ctaHref: () => `${appUrl}/dashboard/tutoring/requests`,
  },
  tutor_request_responded: {
    subject: "Update on your tutor request",
    cta: "View status",
    ctaHref: () => `${appUrl}/dashboard/tutoring/learning`,
  },
};

export async function sendNotificationEmail({
  to,
  type,
  title,
  body,
  dealId,
}: {
  to: string;
  type: NotificationEmailType;
  title: string;
  body: string;
  dealId?: string;
}) {
  const meta = EVENT_META[type];
  const ctaHref = meta.ctaHref(dealId);

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: meta.subject,
      html: `
        <div style="margin:0; padding:0; background:#000000;">
          <div style="max-width: 640px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif; color: #ffffff; background: radial-gradient(circle at top, rgba(54, 244, 164, 0.18), transparent 42%), #000000;">
            <div style="border: 1px solid #1E2C31; border-radius: 20px; overflow: hidden; background: linear-gradient(180deg, #061A1C 0%, #02090A 100%); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);">
              <div style="padding: 28px 28px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                <p style="margin: 0 0 16px; font-size: 18px; letter-spacing: 0.24em; font-weight: 500; color: #ffffff;">
                  PeerHelp<span style="color: #36F4A4; letter-spacing: -0.02em;"><span style="font-weight: 500;">/</span><span style="font-weight: 300;">/</span><span style="font-weight: 100;">/</span></span>
                </p>
                <h1 style="margin: 0; font-size: 26px; line-height: 1.15; font-weight: 400; letter-spacing: -0.02em; color: #ffffff;">
                  ${title}
                </h1>
              </div>

              <div style="padding: 28px;">
                <p style="margin: 0 0 24px; color: #A1A1AA; font-size: 16px; line-height: 1.6;">
                  ${body}
                </p>

                <a href="${ctaHref}" style="display: inline-block; padding: 12px 24px; background: #36F4A4; color: #000000; font-size: 15px; font-weight: 600; border-radius: 10px; text-decoration: none; letter-spacing: -0.01em;">
                  ${meta.cta}
                </a>
              </div>

              <div style="padding: 0 28px 24px;">
                <div style="height: 1px; background: rgba(255, 255, 255, 0.08); margin-bottom: 18px;"></div>
                <p style="margin: 0; color: #71717A; font-size: 12px; line-height: 1.5; text-align: center;">
                  PeerHelp • College marketplace for verified students<br>
                  <a href="${appUrl}/dashboard/profile" style="color: #52525B; text-decoration: underline;">Manage email preferences</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send notification email:", error);
    }

    return { success: !error, messageId: data?.id };
  } catch (err) {
    console.error("Error sending notification email:", err);
    return { success: false };
  }
}
