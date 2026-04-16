import { adminEmailServiceServer } from "@/lib/services/adminEmailService.server";
import { buildOmaHubEmailHtml } from "@/lib/services/omahubEmailTemplate";

/** Minimal profile shape needed to email admins (matches webhook payload). */
export type NewProfileNotificationInput = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

/**
 * Sends new-account emails to webhook admin list. Best-effort; never throws.
 * Used by signup API and by `/api/webhooks/new-account` after auth verification.
 */
export async function notifyAdminsOfNewProfile(
  user: NewProfileNotificationInput
): Promise<void> {
  try {
    const adminEmails = await adminEmailServiceServer.getWebhookAdminEmails();
    await sendNewAccountEmails(user, adminEmails);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "new_account_notify_failed",
        message: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

async function sendNewAccountEmails(
  user: NewProfileNotificationInput,
  adminEmails: string[]
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return;
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const userCreatedDate = new Date(user.created_at).toLocaleString("en-GB");
    const roleDisplay = user.role.replace("_", " ").toUpperCase();

    for (const adminEmail of adminEmails) {
      try {
        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [adminEmail],
          subject: `🎉 New Account Created - ${user.email}`,
          html: buildOmaHubEmailHtml({
            preheader: `New account created for ${user.email}`,
            title: "New Account Alert",
            subtitle: user.email,
            intro: "A new user has created an account on OmaHub.",
            sections: [
              {
                title: "Account Details",
                details: [
                  { label: "Email", value: user.email },
                  { label: "Role", value: roleDisplay },
                  { label: "User ID", value: user.id },
                  { label: "Created", value: userCreatedDate },
                ],
              },
            ],
            ctaLabel: "View in Admin Panel",
            ctaUrl: "https://oma-hub.com/studio/users",
            footerNote:
              "You received this because you are an OmaHub admin.",
          }),
        });
      } catch (emailError) {
        console.error(
          JSON.stringify({
            event: "new_account_email_recipient_failed",
            adminEmail,
            message:
              emailError instanceof Error
                ? emailError.message
                : String(emailError),
          })
        );
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "new_account_email_batch_failed",
        message: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
