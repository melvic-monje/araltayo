import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://araltayo.ph";

export async function sendParentConsentEmail(
  parentEmail: string,
  childDisplayName: string,
  token: string
): Promise<void> {
  const consentUrl = `${APP_URL}/api/auth/parent-consent?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "AralTayo <noreply@araltayo.ph>",
    to: parentEmail,
    subject: `Parental Consent Required — ${childDisplayName} joined AralTayo`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <h1 style="color:#6d28d9;font-size:24px;margin-bottom:8px">AralTayo</h1>
        <p style="color:#374151;font-size:16px">
          Your child (<strong>${childDisplayName}</strong>) created an account on
          <strong>AralTayo</strong>, a Philippine AI-powered study platform for students.
        </p>
        <p style="color:#374151;font-size:16px">
          Because they are under 18, their account requires your consent to activate.
          No personal ID was collected — only their birth year.
        </p>
        <a
          href="${consentUrl}"
          style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600"
        >
          Approve Account
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">
          If you did not expect this email, you can safely ignore it. The account will
          remain inactive without your approval.
        </p>
        <p style="color:#6b7280;font-size:13px">
          This link expires in 7 days.
        </p>
      </div>
    `,
  });
}
