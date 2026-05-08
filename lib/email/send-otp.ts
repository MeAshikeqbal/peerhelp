import { Resend } from "resend";
import { buildOtpHtml } from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const fromName = process.env.RESEND_FROM_NAME ?? "PeerHelp";

export async function sendOtpEmail(collegeEmail: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: collegeEmail,
      subject: "Your PeerHelp college verification code",
      html: buildOtpHtml(otp),
    });

    if (error) {
      console.error("Failed to send OTP email:", error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}
