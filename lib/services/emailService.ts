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
  to?: string; // Optional recipient email
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - email service unavailable"
      );
      console.error(
        "💡 Please add RESEND_API_KEY environment variable to enable email sending"
      );
      console.error(
        "📖 See EMAIL_SERVICE_SETUP.md for detailed setup instructions"
      );
      return {
        success: false,
        error:
          "Email service not configured. Please contact administrator to set up RESEND_API_KEY.",
      };
    }

    // Determine recipient - use provided 'to' email or fallback to admin
    const recipientEmail = formData.to || "info@oma-hub.com";
    
    console.log("📧 Sending contact email via Resend to:", recipientEmail);
    const { data, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [recipientEmail],
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
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Contact email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Failed to send contact email:", error);
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
  isFromSuperAdmin?: boolean;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send inquiry reply email"
      );
      console.error("💡 Customer will not receive email notification of reply");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Reply to:", replyData.customerEmail);
      return {
        success: false,
        error:
          "Email service not configured. Reply saved but customer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const {
      customerName,
      customerEmail,
      originalSubject,
      originalMessage,
      replyMessage,
      brandName,
      adminName = "OmaHub Team",
      isFromSuperAdmin = false,
    } = replyData;

    // Determine sender name based on admin type
    const senderName = isFromSuperAdmin ? "OmaHub Support" : adminName;

    const { data, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [customerEmail],
      subject: `Re: ${originalSubject}`,
      text: `
Dear ${customerName},

Thank you for your inquiry about ${brandName}. Here's our response:

${replyMessage}

---
Original Message:
${originalMessage}

Best regards,
${senderName}
OmaHub Team

---
This is an automated response from the OmaHub platform.
      `,
      replyTo: isFromSuperAdmin ? "support@oma-hub.com" : "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Inquiry reply email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Failed to send inquiry reply email:", error);
    return { success: false, error };
  }
}

export async function sendNewsletterConfirmationEmail(formData: {
  email: string;
  firstName: string;
  lastName: string;
  isReactivation?: boolean;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send newsletter confirmation email"
      );
      console.error("💡 Subscriber will not receive confirmation email");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Confirmation to:", formData.email);
      return {
        success: false,
        error:
          "Email service not configured. Subscription saved but confirmation email was not sent. Please set up RESEND_API_KEY.",
      };
    }

    const { email, firstName, lastName, isReactivation = false } = formData;
    
    const displayName = firstName === "there" ? "there" : `${firstName} ${lastName}`.trim();
    const subject = isReactivation 
      ? "Welcome back to OmaHub Newsletter!" 
      : "Welcome to OmaHub Newsletter!";
    
    const welcomeMessage = isReactivation
      ? "Welcome back! We're thrilled to have you back in our community."
      : "Welcome to our community! We're excited to have you join us.";

    console.log("📧 Sending newsletter confirmation email to:", email);
    
    const { data, error } = await resend.emails.send({
      from: "OmaHub <newsletter@oma-hub.com>",
      to: [email],
      subject: subject,
      text: `
Dear ${displayName},

${welcomeMessage}

You're now subscribed to our newsletter and will receive:
• Early access to new designer collections
• Exclusive designer interviews and behind-the-scenes content
• Special event invitations and fashion industry updates
• Platform updates and new features

We're committed to bringing you the best in emerging fashion design and will only send you content that adds value to your experience.

If you ever want to unsubscribe, you can do so at any time by clicking the unsubscribe link in any of our emails.

Thank you for joining our community!

Best regards,
The OmaHub Team

---
This is an automated confirmation email. Please do not reply to this message.
      `,
      replyTo: "newsletter@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Newsletter confirmation email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Failed to send newsletter confirmation email:", error);
    return { success: false, error };
  }
}

export async function subscribeToNewsletter(email: string) {
  // TODO: Implement Klaviyo/Mailchimp integration
  try {
    // For now, we'll just log the subscription
    console.log("📧 New newsletter subscription:", email);
    return { success: true };
  } catch (error) {
    console.error("💥 Failed to subscribe to newsletter:", error);
    return { success: false, error };
  }
}
