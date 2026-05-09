import { Resend } from "resend";
import { buildNotificationHtml } from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const fromName = process.env.RESEND_FROM_NAME ?? "PeerHelp";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://peerhelp.space";

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
  | "tutor_request_responded"
  | "message_received";

const EVENT_META: Record<
  NotificationEmailType,
  { subject: string; cta: string; ctaHref: (dealId?: string) => string }
> = {
  deal_requested: {
    subject: "Someone wants to buy your listing",
    cta: "Review deal request",
    ctaHref: () => `${appUrl}/dashboard/deals`,
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
  message_received: {
    subject: "New message on PeerHelp",
    cta: "Open conversation",
    ctaHref: (threadId) =>
      threadId
        ? `${appUrl}/dashboard/messages/${threadId}`
        : `${appUrl}/dashboard/messages`,
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
      html: buildNotificationHtml({
        title,
        body,
        ctaLabel: meta.cta,
        ctaHref,
        prefsHref: `${appUrl}/dashboard/profile`,
      }),
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
