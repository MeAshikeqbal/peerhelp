import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const fromName = process.env.RESEND_FROM_NAME ?? "PeerHelp";

export async function sendOtpEmail(collegeEmail: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: collegeEmail,
      subject: "Your PeerHelp college verification code",
      html: `
        <div style="margin:0; padding:0; background:#000000;">
          <div style="max-width: 640px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif; color: #ffffff; background: radial-gradient(circle at top, rgba(54, 244, 164, 0.18), transparent 42%), #000000;">
            <div style="border: 1px solid #1E2C31; border-radius: 20px; overflow: hidden; background: linear-gradient(180deg, #061A1C 0%, #02090A 100%); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);">
              <div style="padding: 28px 28px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                <p style="margin: 0 0 16px; font-size: 18px; letter-spacing: 0.24em; font-weight: 500; color: #ffffff;">
                  PeerHelp<span style="color: #36F4A4; letter-spacing: -0.02em;"><span style="font-weight: 500;">/</span><span style="font-weight: 300;">/</span><span style="font-weight: 100;">/</span></span>
                </p>
                <h1 style="margin: 0; font-size: 28px; line-height: 1.1; font-weight: 400; letter-spacing: -0.02em; color: #ffffff;">
                  Confirm your college email
                </h1>
              </div>

              <div style="padding: 28px;">
                <p style="margin: 0 0 18px; color: #A1A1AA; font-size: 16px; line-height: 1.6;">
                  Use this one-time code to finish verifying your college account.
                </p>

                <div style="margin: 0 0 22px; padding: 22px 20px; border-radius: 16px; border: 1px solid #1E2C31; background: rgba(255, 255, 255, 0.03); text-align: center;">
                  <div style="color: #D4D4D8; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px;">
                    Verification code
                  </div>
                  <div style="font-size: 34px; line-height: 1; letter-spacing: 0.28em; font-weight: 700; color: #ffffff; font-variant-numeric: tabular-nums;">
                    ${otp}
                  </div>
                </div>

                <p style="margin: 0 0 10px; color: #A1A1AA; font-size: 14px; line-height: 1.6;">
                  This code expires in 10 minutes.
                </p>

                <p style="margin: 0; color: #71717A; font-size: 14px; line-height: 1.6;">
                  If you did not request this code, you can ignore this email.
                </p>
              </div>

              <div style="padding: 0 28px 24px;">
                <div style="height: 1px; background: rgba(255, 255, 255, 0.08); margin-bottom: 18px;"></div>
                <p style="margin: 0; color: #71717A; font-size: 12px; line-height: 1.5; text-align: center;">
                  PeerHelp • College marketplace for verified students
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
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
