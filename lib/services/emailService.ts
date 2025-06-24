import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error("Resend API key not configured");
      return { success: false, error: "Email service not configured" };
    }

    const { data, error } = await resend.emails.send({
      from: "OmaHub <onboarding@resend.dev>",
      to: ["eloka@satellitelabs.xyz"],
      subject: `New Contact Form Submission: ${formData.subject}`,
      text: `
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}
      `,
      replyTo: formData.email,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendInquiryReplyEmail(replyData: {
  customerName: string;
  customerEmail: string;
  originalSubject: string;
  originalMessage: string;
  replyMessage: string;
  brandName: string;
  adminName?: string;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error("Resend API key not configured");
      return { success: false, error: "Email service not configured" };
    }

    const {
      customerName,
      customerEmail,
      originalSubject,
      originalMessage,
      replyMessage,
      brandName,
      adminName = "OmaHub Team",
    } = replyData;

    const { data, error } = await resend.emails.send({
      from: `${brandName} via OmaHub <noreply@omahub.com>`,
      to: [customerEmail],
      subject: `Re: ${originalSubject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffdf8;">
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(58, 30, 45, 0.1); border: 1px solid rgba(212, 178, 133, 0.2);">
            
            <!-- Header -->
            <div style="text-align: center; padding: 40px 40px 30px 40px; background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white;">
              <div style="font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 8px;">OmaHub</div>
              <div style="font-size: 14px; opacity: 0.9; letter-spacing: 1px;">Reply from ${brandName}</div>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              <div style="margin-bottom: 30px;">
                <h2 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 22px; font-weight: 400;">Hi ${customerName},</h2>
                <p style="color: #666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                  Thank you for reaching out! We've received your inquiry and ${adminName} from ${brandName} has responded to your message.
                </p>
              </div>

              <!-- Reply Section -->
              <div style="background: #f8f9fa; border-left: 4px solid #a07f68; padding: 24px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <div style="color: #3a1e2d; font-weight: 600; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Reply from ${brandName}</div>
                <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</div>
              </div>

              <!-- Original Message Reference -->
              <div style="border-top: 1px solid #e9ecef; padding-top: 24px; margin-top: 30px;">
                <div style="color: #666; font-size: 14px; margin-bottom: 12px;">Your original message:</div>
                <div style="background: #f1f3f4; padding: 16px; border-radius: 8px; color: #555; font-size: 14px; line-height: 1.5;">
                  <div style="font-weight: 600; margin-bottom: 8px;">Subject: ${originalSubject}</div>
                  <div style="white-space: pre-wrap;">${originalMessage}</div>
                </div>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 40px 0 20px 0;">
                <p style="color: #666; margin: 0 0 20px 0; font-size: 16px;">
                  Have more questions? Feel free to reply to this email or contact us directly.
                </p>
                <a href="mailto:${customerEmail}?subject=Re: ${originalSubject}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                  Continue Conversation
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                This email was sent by <strong>${brandName}</strong> via OmaHub
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                Discover amazing fashion brands at <a href="https://omahub.com" style="color: #a07f68; text-decoration: none;">omahub.com</a>
              </p>
            </div>
          </div>
        </div>
      `,
      replyTo: customerEmail,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send inquiry reply email:", error);
    return { success: false, error };
  }
}

export async function subscribeToNewsletter(email: string) {
  // TODO: Implement Klaviyo/Mailchimp integration
  try {
    // For now, we'll just log the subscription
    console.log("New newsletter subscription:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to subscribe to newsletter:", error);
    return { success: false, error };
  }
}
