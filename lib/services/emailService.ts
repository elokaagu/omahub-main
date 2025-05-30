import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Oma Hub <onboarding@resend.dev>",
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
