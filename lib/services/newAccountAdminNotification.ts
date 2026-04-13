import { adminEmailServiceServer } from "@/lib/services/adminEmailService.server";

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
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">OmaHub</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">New Account Alert</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 20px;">🎉 New User Registered</h2>
                  <p style="margin: 0; color: #666;">A new user has just created an account on OmaHub!</p>
                </div>

                <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 16px;">Account Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Email:</td>
                      <td style="padding: 8px 0; color: #333;"><strong>${user.email}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Role:</td>
                      <td style="padding: 8px 0; color: #333;">${roleDisplay}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">User ID:</td>
                      <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${user.id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Created:</td>
                      <td style="padding: 8px 0; color: #333;">${userCreatedDate}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 12px 0; font-size: 16px;">Quick Actions</h3>
                  <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">You can manage this user from the admin panel:</p>
                  <a href="https://oma-hub.com/studio/users" 
                     style="display: inline-block; background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    View in Admin Panel
                  </a>
                </div>

                <div style="border-top: 1px solid #e9ecef; padding-top: 20px; text-align: center;">
                  <p style="margin: 0; color: #666; font-size: 12px;">
                    This is an automated notification from OmaHub.<br>
                    You're receiving this because you're an admin.
                  </p>
                </div>
              </div>
            </div>
          `,
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
