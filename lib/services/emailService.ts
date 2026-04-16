import { Resend } from "resend";
import { buildOmaHubEmailHtml } from "@/lib/services/omahubEmailTemplate";

// Lazy initialization helper - get Resend instance when needed
function getResendInstance(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    return new Resend(apiKey);
  } catch (error) {
    console.error("❌ Failed to initialize Resend:", error);
    return null;
  }
}

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  to?: string; // Optional recipient email
}) {
  try {
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
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
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
      return {
        success: false,
        error:
          "Email service not configured. Please contact administrator to set up RESEND_API_KEY.",
      };
    }

    // Determine recipient - use provided 'to' email or fallback to admin
    const recipientEmail = formData.to || "info@oma-hub.com";
    const studioInboxUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/studio/inbox`;
    
    console.log("📧 Sending contact email via Resend to:", recipientEmail);
    const { data, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [recipientEmail],
      subject: `New Contact Form Submission: ${formData.subject}`,
      html: buildOmaHubEmailHtml({
        preheader: `New contact submission from ${formData.name}`,
        title: "New Contact Submission",
        subtitle: formData.subject,
        intro: "A new contact form entry has been submitted on OmaHub.",
        sections: [
          {
            title: "Submission Details",
            details: [
              { label: "Name", value: formData.name },
              { label: "Email", value: formData.email },
              { label: "Subject", value: formData.subject },
            ],
          },
          {
            title: "Message",
            content: formData.message,
          },
        ],
        ctaLabel: "Open Studio Inbox",
        ctaUrl: studioInboxUrl,
      }),
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

/** Notify brand contact when a new public lead is captured (server-side; no HTTP self-call). */
export async function sendNewLeadNotificationToBrand(params: {
  to: string;
  brandName: string;
  customerName: string;
  customerEmail: string;
  source: string;
  leadType: string;
  notes?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendInstance();
    if (!resend) {
      return { success: false, error: "Email not configured" };
    }

    const notesBlock = params.notes?.trim()
      ? `\nNotes:\n${params.notes.trim()}\n`
      : "";
    const inboxUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/studio/inbox`;

    const { error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [params.to],
      subject: `New lead — ${params.brandName}`,
      replyTo: params.customerEmail,
      html: buildOmaHubEmailHtml({
        preheader: `New lead for ${params.brandName}`,
        title: "New Lead",
        subtitle: params.brandName,
        intro: "A new lead has been captured on OmaHub.",
        sections: [
          {
            title: "Lead Details",
            details: [
              { label: "Brand", value: params.brandName },
              { label: "Name", value: params.customerName },
              { label: "Email", value: params.customerEmail },
              { label: "Source", value: params.source },
              { label: "Type", value: params.leadType },
            ],
          },
          ...(params.notes?.trim()
            ? [{ title: "Notes", content: params.notes.trim() }]
            : []),
        ],
        ctaLabel: "View Inbox",
        ctaUrl: inboxUrl,
      }),
      text: `You have a new lead on OmaHub.

Brand: ${params.brandName}
Name: ${params.customerName}
Email: ${params.customerEmail}
Source: ${params.source}
Type: ${params.leadType}${notesBlock}
Reply directly to this email to reach the customer.`,
    });

    if (error) {
      console.error(
        "New lead notification email error:",
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: string }).message)
          : String(error)
      );
      return { success: false, error: "Send failed" };
    }
    return { success: true };
  } catch (e) {
    console.error(
      "New lead notification exception:",
      e instanceof Error ? e.message : e
    );
    return { success: false, error: "Send failed" };
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
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send inquiry reply email"
      );
      console.error("💡 Customer will not receive email notification of reply");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Reply to:", replyData.customerEmail);
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
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
      html: buildOmaHubEmailHtml({
        preheader: `Reply from ${brandName}`,
        title: "New Reply from OmaHub",
        subtitle: brandName,
        intro: `Hello ${customerName}, we have replied to your inquiry.`,
        sections: [
          { title: "Reply", content: replyMessage },
          { title: "Your Original Message", content: originalMessage },
        ],
        footerNote: `Sent by ${senderName} via OmaHub.`,
      }),
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
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send newsletter confirmation email"
      );
      console.error("💡 Subscriber will not receive confirmation email");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Confirmation to:", formData.email);
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
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
      html: buildOmaHubEmailHtml({
        preheader: subject,
        title: "Newsletter Subscription",
        subtitle: "Welcome to OmaHub",
        intro: `Hi ${displayName},`,
        sections: [
          {
            content: `${welcomeMessage}\n\nYou're now subscribed and will receive product drops, designer highlights, and curated updates from OmaHub.`,
          },
        ],
        ctaLabel: "Explore OmaHub",
        ctaUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com",
        footerNote:
          "You can unsubscribe at any time from the link in future newsletter emails.",
      }),
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

export async function sendNewApplicationNotification(
  application: {
    id: string;
    brand_name: string;
    designer_name: string;
    email: string;
    phone?: string;
    location: string;
    category: string;
    description: string;
    website?: string;
    instagram?: string;
    year_founded?: number;
    created_at: string;
  },
  adminEmails: string[]
) {
  try {
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send new application notification"
      );
      console.error("💡 Super admins will not receive email notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
      return {
        success: false,
        error:
          "Email service not configured. Application saved but admins were not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const applicationDate = new Date(application.created_at).toLocaleString("en-GB");
    const studioUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/studio/applications`;
    const applicationUrl = `${studioUrl}?id=${application.id}`;

    console.log("📧 Sending new application notification to super admins:", adminEmails);
    console.log(`📊 Total super admins to notify: ${adminEmails.length}`);

    // Validate that we have emails to send to
    if (!adminEmails || adminEmails.length === 0) {
      console.error("❌ No super admin emails provided - cannot send notification");
      return {
        success: false,
        error: "No super admin emails provided",
        results: [],
        successCount: 0,
        failureCount: 0,
      };
    }

    // Filter out any invalid emails
    const validEmails = adminEmails.filter(email => {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.warn(`⚠️ Invalid email address skipped: ${email}`);
        return false;
      }
      return true;
    });

    if (validEmails.length === 0) {
      console.error("❌ No valid super admin emails found after filtering");
      return {
        success: false,
        error: "No valid super admin emails found",
        results: [],
        successCount: 0,
        failureCount: 0,
      };
    }

    console.log(`✅ Sending to ${validEmails.length} valid super admin email(s):`, validEmails);

    // Send email to each super admin
    const emailResults = [];
    for (const adminEmail of validEmails) {
      try {
        console.log(`📧 Attempting to send notification to: ${adminEmail}`);
        const { data, error } = await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [adminEmail],
          subject: `📝 New Designer Application - ${application.brand_name}`,
          html: buildOmaHubEmailHtml({
            preheader: `New application from ${application.brand_name}`,
            title: "New Designer Application",
            subtitle: application.brand_name,
            intro:
              "A new designer application has been submitted and is ready for review.",
            sections: [
              {
                title: "Application Details",
                details: [
                  { label: "Brand Name", value: application.brand_name },
                  { label: "Designer", value: application.designer_name },
                  { label: "Email", value: application.email },
                  ...(application.phone ? [{ label: "Phone", value: application.phone }] : []),
                  { label: "Location", value: application.location },
                  { label: "Category", value: application.category },
                  ...(application.website
                    ? [{ label: "Website", value: application.website }]
                    : []),
                  ...(application.instagram
                    ? [{ label: "Instagram", value: `@${application.instagram.replace(/^@/, "")}` }]
                    : []),
                  ...(application.year_founded
                    ? [{ label: "Founded", value: String(application.year_founded) }]
                    : []),
                  { label: "Submitted", value: applicationDate },
                ],
              },
              {
                title: "Description",
                content: application.description,
              },
            ],
            ctaLabel: "Review Application",
            ctaUrl: applicationUrl,
            footerNote:
              "You received this because you are a super admin on OmaHub.",
          }),
          text: `
New Designer Application - ${application.brand_name}

A new designer application has been submitted and requires review.

Application Details:
- Brand Name: ${application.brand_name}
- Designer: ${application.designer_name}
- Email: ${application.email}
${application.phone ? `- Phone: ${application.phone}` : ''}
- Location: ${application.location}
- Category: ${application.category}
${application.website ? `- Website: ${application.website}` : ''}
${application.instagram ? `- Instagram: @${application.instagram.replace(/^@/, '')}` : ''}
${application.year_founded ? `- Founded: ${application.year_founded}` : ''}
- Submitted: ${applicationDate}

Description:
${application.description}

Review this application: ${applicationUrl}
View all applications: ${studioUrl}

This is an automated notification from OmaHub.
You're receiving this because you're a super admin.
          `,
          replyTo: "info@oma-hub.com",
        });

        if (error) {
          console.error(`❌ Failed to send notification to ${adminEmail}:`, {
            error,
            message: error.message,
            code: (error as any).code,
            details: error
          });
          emailResults.push({ 
            email: adminEmail, 
            success: false, 
            error: error.message || JSON.stringify(error) 
          });
        } else {
          console.log(`✅ New application notification sent successfully to ${adminEmail}`);
          emailResults.push({ email: adminEmail, success: true, data });
        }
      } catch (emailError) {
        console.error(
          `❌ Error sending notification to ${adminEmail}:`,
          emailError
        );
        emailResults.push({
          email: adminEmail,
          success: false,
          error: emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    const successCount = emailResults.filter((r) => r.success).length;
    const failureCount = emailResults.filter((r) => !r.success).length;

    // Log detailed results
    console.log(`📊 Email sending results: ${successCount} successful, ${failureCount} failed`);
    
    if (successCount > 0) {
      const successfulEmails = emailResults.filter(r => r.success).map(r => r.email);
      console.log(
        `✅ Sent new application notifications to ${successCount} admin(s):`,
        successfulEmails
      );
    }
    if (failureCount > 0) {
      const failedEmails = emailResults.filter(r => !r.success).map(r => ({
        email: r.email,
        error: r.error
      }));
      console.warn(
        `⚠️ Failed to send notifications to ${failureCount} admin(s):`,
        failedEmails
      );
    }

    return {
      success: successCount > 0,
      results: emailResults,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error("💥 Error sending new application notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendApplicationApprovalEmail(data: {
  designerName: string;
  brandName: string;
  email: string;
  temporaryPassword?: string;
  passwordResetLink?: string;
  isNewUser: boolean;
}) {
  try {
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send application approval email"
      );
      console.error("💡 Designer will not receive approval notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Approval notification to:", data.email);
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
      return {
        success: false,
        error:
          "Email service not configured. Application approved but designer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const {
      designerName,
      brandName,
      email,
      temporaryPassword,
      passwordResetLink,
      isNewUser,
    } = data;
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/login`;

    console.log("📧 Sending application approval email to:", email);

    const { data: emailData, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [email],
      subject: `🎉 Your Application Has Been Approved - Welcome to OmaHub!`,
      html: buildOmaHubEmailHtml({
        preheader: `Your ${brandName} application has been approved`,
        title: "Application Approved",
        subtitle: brandName,
        intro: `Congratulations ${designerName}, your application has been approved and your brand is now live on OmaHub.`,
        sections: [
          {
            title: "Account Access",
            content: isNewUser
              ? `A new account was prepared for ${email}. Use your temporary password or password reset link to complete setup.`
              : "You can sign in with your existing account credentials.",
          },
          ...(temporaryPassword
            ? [{ title: "Temporary Password", content: temporaryPassword }]
            : []),
          ...(passwordResetLink
            ? [{ title: "Set Your Password Link", content: passwordResetLink }]
            : []),
          {
            title: "Next Steps",
            content:
              "1) Log into Studio.\n2) Complete your brand profile.\n3) Add products and start managing inquiries.",
          },
        ],
        ctaLabel: "Log In to Studio",
        ctaUrl: loginUrl,
      }),
      text: `
Congratulations, ${designerName}!

Your application for ${brandName} has been approved!

We're thrilled to welcome you to OmaHub! Your brand has been set up and you now have access to manage your brand profile, products, and customer inquiries.

${isNewUser
  ? `Your Login Credentials:

${temporaryPassword ? `${passwordResetLink ? 'Option 1: ' : ''}Login with Temporary Password
You can log in immediately using these credentials:

Email: ${email}
Temporary Password: ${temporaryPassword}

⚠️ Important: Please change your password after your first login for security.

${passwordResetLink ? '\n' : ''}` : ''}${passwordResetLink ? `Option 2: Set Your Password (Recommended)
Click the link below to set your own secure password. This link expires in 7 days.

Set My Password: ${passwordResetLink}

If the link doesn't work, copy and paste it into your browser.

` : ''}${!temporaryPassword && !passwordResetLink ? `Your account has been created. Please use the "Forgot Password" feature to set your password.` : ''}`
  : `You can log in using your existing account credentials.`}

What's Next?

1. Log in to your Studio: ${loginUrl}
2. Access your brand dashboard: Once logged in, you'll be able to manage your brand from the Studio
3. Complete your brand profile: Add your brand logo, images, and complete product listings
4. Start managing: Respond to customer inquiries, update your catalogue, and grow your presence on OmaHub

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Welcome aboard!
The OmaHub Team
      `,
      replyTo: "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Application approval email sent successfully:", emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("💥 Failed to send application approval email:", error);
    return { success: false, error };
  }
}

export async function sendApplicationRejectionEmail(data: {
  designerName: string;
  brandName: string;
  email: string;
  notes?: string;
}) {
  try {
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send application rejection email"
      );
      console.error("💡 Designer will not receive rejection notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Rejection notification to:", data.email);
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
      return {
        success: false,
        error:
          "Email service not configured. Application rejected but designer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const { designerName, brandName, email, notes } = data;
    const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/join`;

    console.log("📧 Sending application rejection email to:", email);

    const { data: emailData, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [email],
      subject: `Update on Your Application - ${brandName}`,
      html: buildOmaHubEmailHtml({
        preheader: `Application update for ${brandName}`,
        title: "Application Update",
        subtitle: brandName,
        intro: `Thank you ${designerName} for applying to OmaHub.`,
        sections: [
          {
            content:
              "After review, we are unable to proceed with this application at the moment.",
          },
          ...(notes ? [{ title: "Feedback", content: notes }] : []),
          {
            title: "What Next",
            content:
              "You are welcome to apply again in the future as your brand evolves. If you have questions, please reply to this email.",
          },
        ],
        ctaLabel: "Visit OmaHub",
        ctaUrl: joinUrl,
      }),
      text: `
Dear ${designerName},

Thank you for your interest in OmaHub and for taking the time to submit your application for ${brandName}.

After careful consideration, we've decided not to move forward with your application at this time.

${notes ? `\nFeedback:\n${notes}\n` : ''}

We encourage you to continue developing your brand and portfolio. You're welcome to apply again in the future when your brand has evolved or meets our current criteria.

If you have any questions or would like to discuss your application further, please don't hesitate to reach out to our support team.

Thank you for your interest in OmaHub.

Best regards,
The OmaHub Team

Visit us: ${joinUrl}
      `,
      replyTo: "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Application rejection email sent successfully:", emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("💥 Failed to send application rejection email:", error);
    return { success: false, error };
  }
}

export async function sendApplicationConfirmationEmail(data: {
  designerName: string;
  brandName: string;
  email: string;
}) {
  try {
    // Get Resend instance (lazy initialization)
    const resend = getResendInstance();
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send application confirmation email"
      );
      console.error("💡 Designer will not receive confirmation notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Confirmation notification to:", data.email);
      console.error("🔍 RESEND_API_KEY check:", {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A"
      });
      return {
        success: false,
        error:
          "Email service not configured. Application saved but designer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const { designerName, brandName, email } = data;
    const websiteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}`;

    console.log("📧 Sending application confirmation email to:", email);

    const { data: emailData, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [email],
      subject: `Application Received - ${brandName}`,
      html: buildOmaHubEmailHtml({
        preheader: `Application received for ${brandName}`,
        title: "Application Received",
        subtitle: brandName,
        intro: `Thank you ${designerName}. We have successfully received your application.`,
        sections: [
          {
            title: "What Happens Next",
            content:
              "Our team will review your application and share an update within 3-5 days. If anything changes, reply to this email and we will help.",
          },
        ],
        ctaLabel: "Visit OmaHub",
        ctaUrl: websiteUrl,
      }),
      text: `
Dear ${designerName},

Thank you for your interest in joining OmaHub and for taking the time to submit your application for ${brandName}.

We've successfully received your application and appreciate you sharing your brand with us.

What Happens Next?

Our team will carefully review your application. We'll get back to you within 3-5 days with an update on your application status.

If you have any questions or need to update your application, please don't hesitate to reach out to our support team.

Thank you for your interest in OmaHub.

Best regards,
The OmaHub Team

Visit us: ${websiteUrl}
      `,
      replyTo: "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ [CONFIRMATION EMAIL] Resend API error:", error);
      console.error("❌ [CONFIRMATION EMAIL] Error type:", error?.constructor?.name || typeof error);
      console.error("❌ [CONFIRMATION EMAIL] Error details:", JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : (error as any)?.message || String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }

    console.log("✅ [CONFIRMATION EMAIL] Application confirmation email sent successfully:", emailData?.id);
    console.log("✅ [CONFIRMATION EMAIL] Email sent to:", email);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("💥 [CONFIRMATION EMAIL] Failed to send application confirmation email:", error);
    console.error("💥 [CONFIRMATION EMAIL] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("💥 [CONFIRMATION EMAIL] Error message:", error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}
