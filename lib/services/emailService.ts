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
    // Check if Resend is configured
    if (!resend) {
      console.warn("Resend API key not configured. Email not sent.");
      // In development, just log the email instead of sending
      console.log("Contact form submission (not sent):", {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      return { success: true, data: { id: "dev-mode" } };
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
